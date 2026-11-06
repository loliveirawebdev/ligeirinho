#!/usr/bin/env node
import { runCli } from './cli/run-cli.js';

process.exitCode = await runCli(process.argv.slice(2), {
  info: (line) => {
    process.stdout.write(`${line}\n`);
  },
  error: (line) => {
    process.stderr.write(`${line}\n`);
  },
});
