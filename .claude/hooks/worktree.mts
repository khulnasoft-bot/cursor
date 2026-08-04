#!/usr/bin/env node

/**
 * Worktree Hook for Cursor Project
 *
 * This hook runs on SessionStart to validate the environment and provide
 * useful context about the current git worktree or repository state.
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

interface HookOutput {
  decision: 'allow' | 'defer';
  reason?: string;
  context?: Record<string, any>;
}

function getGitInfo() {
  try {
    const branch = execSync('git branch --show-current', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    const commit = execSync('git rev-parse --short HEAD', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim();

    const isWorktree = execSync('git rev-parse --is-inside-work-tree', {
      cwd: PROJECT_DIR,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    }).trim() === 'true';

    return { branch, commit, isWorktree };
  } catch (error) {
    return { branch: 'unknown', commit: 'unknown', isWorktree: false };
  }
}

function checkNodeModules() {
  const nodeModulesPath = join(PROJECT_DIR, 'node_modules');
  return existsSync(nodeModulesPath);
}

function checkPackageJson() {
  const packageJsonPath = join(PROJECT_DIR, 'package.json');
  if (!existsSync(packageJsonPath)) {
    return { exists: false, version: 'unknown' };
  }

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return { exists: true, version: packageJson.version || 'unknown' };
  } catch {
    return { exists: true, version: 'parse-error' };
  }
}

function main() {
  const gitInfo = getGitInfo();
  const hasNodeModules = checkNodeModules();
  const packageInfo = checkPackageJson();

  const output: HookOutput = {
    decision: 'allow',
    context: {
      project: 'cursor',
      git: gitInfo,
      environment: {
        hasNodeModules,
        packageVersion: packageInfo.version
      }
    }
  };

  // Add a warning if node_modules is missing
  if (!hasNodeModules) {
    output.reason = 'Warning: node_modules not found. Run "npm i" to install dependencies.';
  }

  console.log(JSON.stringify(output, null, 2));
  process.exit(0);
}

main();
