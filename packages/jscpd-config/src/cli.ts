#!/usr/bin/env node
import { runLigeirinhoJscpd } from './run-ligeirinho-jscpd.js';

process.exitCode = await runLigeirinhoJscpd({
  targetPaths: process.argv.slice(2),
  projectDir: process.cwd(),
  reportProblem: (problem) => {
    console.error(problem);
  },
});
