#!/usr/bin/env node
/**
 * Forest platform CLI — Phase 3.5 will implement new/dev/deploy/graduate.
 * Stub so `pnpm forest` resolves and scripts can grow in place.
 */
const argv = process.argv.slice(2);
const [cmd, ...rest] = argv;

if (!cmd || cmd === "help" || cmd === "--help" || cmd === "-h") {
  console.log(`forest — Forest City Worlds CLI (stub)

Usage:
  pnpm forest <command>

Commands (planned):
  new poc <name>     Scaffold a POC from pocs/_template
  dev <name>         Run a service locally with auth cookie mock
  deploy <name>      CDK deploy for one manifest
  graduate <name>    Flip manifest to graduated + optional repo extract
`);
  process.exit(0);
}

console.error(`Unknown command: ${cmd}`, rest);
process.exit(1);
