#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { init, status, record, complete, runCheck, report, adopt, configure, recover, packageVersion } from '../lib/runner.mjs';
import { install } from '../lib/install.mjs';

const help = `Engineering Relay ${packageVersion}\n\nCommands:\n  install --target DIR [--adapter generic|codex|copilot]\n  init --project DIR --id ID [--profile small|service|critical] [--workflow change|operate|retire]\n       [--input FILE ...] [--agent NAME] [--model VERSION] [--max-attempts 3]\n  status|next --run DIR\n  record --run DIR --stage intake|requirements|design|implementation --file FILE\n  complete --run DIR --stage intake|requirements|design|implementation|verification|readiness\n  check --run DIR --check ID [--rerun] [--review-file FILE]\n  report --run DIR\n  adopt --run DIR --agent NAME [--model VERSION]\n  configure --run DIR --profile PROFILE --reason TEXT\n  recover --run DIR\n\nAll output is JSON. status/report exit 0 even when incomplete; use verify for a CI gate.\n  verify --run DIR   Exit 0 only when every stage and its evidence are current.\n\nChecks execute explicit argv in the project directory with the host's permissions.\nStatus, next, complete, and report never execute checks or deploy anything.\nSee workflow/guide.md for artifact contracts, handoff, and evidence limitations.\n`;
try {
  const { values, positionals } = parseArgs({ allowPositionals: true, options: {
    target: { type: 'string' }, adapter: { type: 'string' }, project: { type: 'string' }, id: { type: 'string' }, profile: { type: 'string' }, workflow: { type: 'string' },
    input: { type: 'string', multiple: true }, agent: { type: 'string' }, model: { type: 'string' }, 'max-attempts': { type: 'string' },
    run: { type: 'string' }, stage: { type: 'string' }, file: { type: 'string' }, check: { type: 'string' }, 'review-file': { type: 'string' },
    reason: { type: 'string' }, rerun: { type: 'boolean' }, help: { type: 'boolean', short: 'h' }, version: { type: 'boolean' }
  } });
  const command = positionals[0];
  if (values.version) console.log(packageVersion);
  else if (values.help || !command) console.log(help);
  else {
    if (positionals.length !== 1) throw new Error('Unexpected positional arguments; use --help');
    const need = name => { if (!values[name]) throw new Error(`--${name} is required`); return values[name]; };
    let result;
    switch (command) {
      case 'install': result = install(need('target'), values.adapter); break;
      case 'init': result = init({ project: need('project'), id: need('id'), profile: values.profile, workflow: values.workflow, inputs: values.input, agent: values.agent, model: values.model, maxAttempts: values['max-attempts'] ? Number(values['max-attempts']) : undefined }); break;
      case 'status': case 'verify': result = status(need('run')); if (command === 'verify' && !result.ready) process.exitCode = 1; break;
      case 'next': result = status(need('run')).next ?? { message: 'All stages complete; follow existing release authority.' }; break;
      case 'record': result = record(need('run'), need('stage'), need('file')); break;
      case 'complete': result = complete(need('run'), need('stage')); break;
      case 'check': result = runCheck(need('run'), need('check'), { rerun: values.rerun, reviewFile: values['review-file'] }); if (result.status !== 'pass') process.exitCode = 1; break;
      case 'report': result = report(need('run')); break;
      case 'adopt': result = adopt(need('run'), need('agent'), values.model); break;
      case 'configure': result = configure(need('run'), need('profile'), need('reason')); break;
      case 'recover': result = recover(need('run')); break;
      default: throw new Error(`Unknown command: ${command}`);
    }
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) { console.error(JSON.stringify({ error: error.message })); process.exitCode = 1; }
