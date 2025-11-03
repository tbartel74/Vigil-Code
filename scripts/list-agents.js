#!/usr/bin/env node

import { readdir } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';

const AGENTS_DIR = './agents';

async function listAgents() {
  console.log(chalk.cyan.bold('\n📋 Available Agents in Vigil-Code:\n'));

  try {
    const agents = await readdir(AGENTS_DIR);

    for (const agent of agents) {
      if (agent.startsWith('.')) continue;

      const agentPath = join(AGENTS_DIR, agent);
      console.log(chalk.green(`  ✓ ${agent}`));
    }

    console.log(chalk.gray(`\n  Total: ${agents.filter(a => !a.startsWith('.')).length} agents\n`));
  } catch (error) {
    console.error(chalk.red('Error reading agents directory:'), error.message);
    process.exit(1);
  }
}

listAgents();