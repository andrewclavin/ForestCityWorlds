#!/usr/bin/env node
import * as path from "node:path";
import { App } from "aws-cdk-lib";
import { WebStack } from "../lib/web-stack.js";

const app = new App();

const region = (app.node.tryGetContext("fcw:region") as string | undefined) ?? "us-east-1";
const devCtx = (app.node.tryGetContext("fcw:env:dev") as
  | { stackSuffix: string; openNextOutDir: string; logRetentionDays?: number }
  | undefined) ?? {
  stackSuffix: "dev",
  openNextOutDir: "../apps/web/.open-next",
  logRetentionDays: 30,
};

const openNextDir = path.resolve(process.cwd(), devCtx.openNextOutDir);

new WebStack(app, `WebStack-${devCtx.stackSuffix}`, {
  env: {
    region,
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
  envName: devCtx.stackSuffix,
  openNextOutDir: openNextDir,
  logRetentionDays: devCtx.logRetentionDays ?? 30,
});

app.synth();
