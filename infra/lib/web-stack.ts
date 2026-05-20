import { existsSync } from "node:fs";
import * as path from "node:path";
import {
  CfnOutput,
  Duration,
  RemovalPolicy,
  Stack,
  type StackProps,
} from "aws-cdk-lib";
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  OriginRequestPolicy,
  PriceClass,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import {
  FunctionUrlOrigin,
  S3BucketOrigin,
} from "aws-cdk-lib/aws-cloudfront-origins";
import {
  Architecture,
  Code,
  Function as LambdaFunction,
  FunctionUrlAuthType,
  InvokeMode,
  Runtime,
} from "aws-cdk-lib/aws-lambda";
import { RetentionDays } from "aws-cdk-lib/aws-logs";
import { BlockPublicAccess, Bucket, BucketEncryption } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import type { Construct } from "constructs";

/**
 * Forest City Worlds — Phase 1 web stack.
 *
 * Composes the three pieces OpenNext produces for a Next.js app:
 *
 *  - `assets/`                      → S3, served via CloudFront
 *  - `server-functions/default/`    → Lambda Function URL behind CloudFront (SSR)
 *  - `image-optimization-function/` → Lambda Function URL for `/_next/image`
 *
 * The stack is **synth-only safe** when those directories do not yet exist
 * (e.g. running `cdk synth` in CI without building OpenNext first): we fall
 * back to `Code.fromInline` placeholders so synth succeeds. `cdk deploy`
 * with placeholders will deploy a working CloudFront distribution that
 * returns 503 from origin until a real build is uploaded — useful for
 * smoke-testing the infra without waiting on the app build.
 */
export interface WebStackProps extends StackProps {
  /** Short label (e.g. "dev"). Used in resource descriptions/outputs. */
  readonly envName: string;
  /** Absolute path to `apps/web/.open-next` produced by `pnpm build:open-next`. */
  readonly openNextOutDir: string;
  /** CloudWatch log retention for the SSR + image lambdas. */
  readonly logRetentionDays?: number;
}

const PLACEHOLDER_HANDLER = `exports.handler = async () => ({
  statusCode: 503,
  body: "OpenNext build missing. Run \`pnpm --filter web build:open-next\` before \`cdk deploy\`.",
});`;

export class WebStack extends Stack {
  public readonly distributionDomainName: string;

  constructor(scope: Construct, id: string, props: WebStackProps) {
    super(scope, id, props);

    const retention =
      props.logRetentionDays === undefined
        ? RetentionDays.ONE_MONTH
        : asRetention(props.logRetentionDays);

    const assetsDir = path.join(props.openNextOutDir, "assets");
    const serverDir = path.join(
      props.openNextOutDir,
      "server-functions",
      "default",
    );
    const imageDir = path.join(
      props.openNextOutDir,
      "image-optimization-function",
    );

    const assetsBucket = new Bucket(this, "AssetsBucket", {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      encryption: BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    if (existsSync(assetsDir)) {
      new BucketDeployment(this, "AssetsDeployment", {
        sources: [Source.asset(assetsDir)],
        destinationBucket: assetsBucket,
        prune: true,
        retainOnDelete: false,
      });
    }

    const serverFn = new LambdaFunction(this, "ServerFn", {
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 1024,
      timeout: Duration.seconds(20),
      handler: "index.handler",
      code: existsSync(path.join(serverDir, "index.mjs"))
        ? Code.fromAsset(serverDir)
        : Code.fromInline(PLACEHOLDER_HANDLER),
      logRetention: retention,
      environment: { NODE_ENV: "production" },
    });

    const serverUrl = serverFn.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
      invokeMode: InvokeMode.RESPONSE_STREAM,
    });

    const imageFn = new LambdaFunction(this, "ImageFn", {
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      memorySize: 1536,
      timeout: Duration.seconds(20),
      handler: "index.handler",
      code: existsSync(path.join(imageDir, "index.mjs"))
        ? Code.fromAsset(imageDir)
        : Code.fromInline(PLACEHOLDER_HANDLER),
      logRetention: retention,
    });

    const imageUrl = imageFn.addFunctionUrl({
      authType: FunctionUrlAuthType.AWS_IAM,
    });

    const serverOrigin = FunctionUrlOrigin.withOriginAccessControl(serverUrl);
    const imageOrigin = FunctionUrlOrigin.withOriginAccessControl(imageUrl);
    const assetsOrigin = S3BucketOrigin.withOriginAccessControl(assetsBucket);

    const distribution = new Distribution(this, "Distribution", {
      comment: `Forest City Worlds — web (${props.envName})`,
      priceClass: PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: serverOrigin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_ALL,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
      additionalBehaviors: {
        "/_next/static/*": {
          origin: assetsOrigin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        },
        "/_next/image*": {
          origin: imageOrigin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
        },
        "/assets/*": {
          origin: assetsOrigin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        },
      },
    });

    this.distributionDomainName = distribution.distributionDomainName;

    new CfnOutput(this, "DistributionDomainName", {
      value: distribution.distributionDomainName,
      description: "Public CloudFront domain for the marketing site",
    });
    new CfnOutput(this, "AssetsBucketName", {
      value: assetsBucket.bucketName,
      description: "S3 bucket holding OpenNext static assets",
    });
  }
}

function asRetention(days: number): RetentionDays {
  const known: Record<number, RetentionDays> = {
    1: RetentionDays.ONE_DAY,
    3: RetentionDays.THREE_DAYS,
    5: RetentionDays.FIVE_DAYS,
    7: RetentionDays.ONE_WEEK,
    14: RetentionDays.TWO_WEEKS,
    30: RetentionDays.ONE_MONTH,
    60: RetentionDays.TWO_MONTHS,
    90: RetentionDays.THREE_MONTHS,
    180: RetentionDays.SIX_MONTHS,
    365: RetentionDays.ONE_YEAR,
  };
  return known[days] ?? RetentionDays.ONE_MONTH;
}
