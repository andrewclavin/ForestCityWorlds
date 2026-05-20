import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { WebStack } from "../lib/web-stack.js";

function synth() {
  const app = new App();
  const stack = new WebStack(app, "WebStack-test", {
    env: { region: "us-east-1", account: "111111111111" },
    envName: "test",
    openNextOutDir: "/nonexistent/.open-next",
    logRetentionDays: 30,
  });
  return Template.fromStack(stack);
}

describe("WebStack (synth-only, no real OpenNext output)", () => {
  it("creates exactly one CloudFront distribution", () => {
    synth().resourceCountIs("AWS::CloudFront::Distribution", 1);
  });

  it("creates the SSR and image lambdas (both ARM64)", () => {
    const t = synth();
    t.resourcePropertiesCountIs(
      "AWS::Lambda::Function",
      { Architectures: ["arm64"] },
      2,
    );
  });

  it("blocks all public access on the assets bucket", () => {
    synth().hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  it("exports the CloudFront domain", () => {
    synth().hasOutput("DistributionDomainName", {});
  });
});
