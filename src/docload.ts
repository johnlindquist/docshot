#!/usr/bin/env bun

import { readdirSync, existsSync, statSync } from 'fs';
import { join, resolve, relative } from 'path';
import { spawn } from 'child_process';

// Parse command line arguments
const args = process.argv.slice(2);

// Check for help flags - if present, pass directly to claude without image loading
const helpFlags = ['--help', '-h'];
if (args.some(arg => helpFlags.includes(arg))) {
  const claudeProcess = spawn('claude', args, {
    stdio: 'inherit',
    shell: false,
  });
  claudeProcess.on('exit', (code) => process.exit(code ?? 0));
  claudeProcess.on('error', (error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });
  // Don't process images - wait for claude to finish
  // The process will exit via the 'exit' handler above
} else {
  // Normal flow: load images and append to system prompt
  
  // Find --images flag and extract directory
  let imagesDir = 'docshot';
  const imagesIndex = args.findIndex(arg => arg === '--images' || arg === '-i');

  if (imagesIndex !== -1) {
    if (imagesIndex + 1 < args.length) {
      imagesDir = args[imagesIndex + 1];
    } else {
      console.error('❌ Error: --images flag requires a directory path');
      process.exit(1);
    }
  }

  // Resolve image directory path
  const imageDirPath = resolve(imagesDir);

  // Validate directory exists
  if (!existsSync(imageDirPath)) {
    console.error(`❌ Error: Directory not found: ${imageDirPath}`);
    process.exit(1);
  }

  // Check if it's actually a directory
  if (!statSync(imageDirPath).isDirectory()) {
    console.error(`❌ Error: Path is not a directory: ${imageDirPath}`);
    process.exit(1);
  }

  // Find all PNG files
  let pngFiles: string[];
  try {
    const files = readdirSync(imageDirPath);
    pngFiles = files
      .filter(file => file.toLowerCase().endsWith('.png'))
      .map(file => join(imageDirPath, file))
      .sort(); // Sort alphabetically (page_001.png, page_002.png, etc.)
  } catch (error: any) {
    console.error(`❌ Error reading directory: ${error.message}`);
    process.exit(1);
  }

  // Check if any images were found
  if (pngFiles.length === 0) {
    console.error(`❌ Error: No PNG files found in directory: ${imageDirPath}`);
    console.error(`   Make sure you've run 'docshot convert' first to generate images.`);
    process.exit(1);
  }

  // Generate relative paths from current working directory
  const cwd = process.cwd();
  const relativePaths = pngFiles.map(file => {
    const relPath = relative(cwd, file);
    return `@${relPath}`;
  });

  // Build system prompt with image references
  const systemPrompt = relativePaths.join(' ');

  // Remove --images flag and its value from args before passing to claude
  const claudeArgs: string[] = [];
  if (imagesIndex !== -1) {
    // Copy args before --images/-i flag
    claudeArgs.push(...args.slice(0, imagesIndex));
    // Copy args after --images/-i flag value (skip the flag and its value)
    claudeArgs.push(...args.slice(imagesIndex + 2));
  } else {
    // No --images flag, pass all args through
    claudeArgs.push(...args);
  }

  // Add --append-system-prompt flag with image references
  claudeArgs.push('--append-system-prompt', systemPrompt);

  // Spawn claude process
  const claudeProcess = spawn('claude', claudeArgs, {
    stdio: 'inherit',
    shell: false,
  });

  // Forward exit code
  claudeProcess.on('exit', (code) => {
    process.exit(code ?? 0);
  });

  claudeProcess.on('error', (error) => {
    console.error(`❌ Error spawning claude command: ${error.message}`);
    console.error(`   Make sure 'claude' CLI is installed and available in PATH.`);
    process.exit(1);
  });
}

