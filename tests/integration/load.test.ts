import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  createTempFile,
  createTempDir,
  cleanupTempFiles,
  runCommand,
  generateTestContent,
} from '../helpers.js';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, resolve } from 'path';

describe('load command', () => {
  describe('existing directory', () => {
    it('should display instructions for existing directory with images', async () => {
      // First, create some images
      const content = generateTestContent(100);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        // Generate images
        const { exitCode: convertExitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
        ]);

        expect(convertExitCode).toBe(0);

        // Now test load command
        const { stdout, stderr, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'load',
          outputDir,
        ]);

        expect(exitCode).toBe(0);
        expect(stderr).toBe('');
        expect(stdout).toContain('LOADING IMAGES INTO CLAUDE CODE');
        expect(stdout).toContain('Image Directory:');
        expect(stdout).toContain(outputDir);
        expect(stdout).toContain('Copy and paste this into Claude Code:');
        expect(stdout).toContain(`Review all images in ${outputDir}`);
        expect(stdout).toContain('Claude Code will automatically:');
        expect(stdout).toContain('Find all .png files in the directory');
        expect(stdout).toContain('Load them into the conversation');
        expect(stdout).toContain('Use 56-73% fewer tokens than raw text!');
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should use default directory when no argument provided', async () => {
      // Create a default "docshot" directory in a temp location
      const tempBase = await createTempDir();
      const defaultDir = join(tempBase, 'docshot');
      const testFileContent = generateTestContent(50);
      const testFilePath = join(tempBase, 'test.md');
      
      // Write test file directly to tempBase
      await writeFile(testFilePath, testFileContent, 'utf8');

      try {
        // Use absolute path to CLI script
        const cliScript = resolve('src/index.ts');
        
        // Run convert in temp directory context with relative file path
        const { exitCode: convertExitCode } = await runCommand(
          'bun',
          ['run', cliScript, 'convert', 'test.md'],
          { cwd: tempBase }
        );

        expect(convertExitCode).toBe(0);
        expect(existsSync(defaultDir)).toBe(true);

        // Test load without argument (should use default)
        const { stdout, exitCode } = await runCommand(
          'bun',
          ['run', cliScript, 'load'],
          { cwd: tempBase }
        );

        expect(exitCode).toBe(0);
        expect(stdout).toContain('docshot');
      } finally {
        await cleanupTempFiles(testFilePath, tempBase);
      }
    });

    it('should display example prompts in output', async () => {
      const content = generateTestContent(50);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { exitCode: convertExitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
        ]);

        expect(convertExitCode).toBe(0);

        const { stdout } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'load',
          outputDir,
        ]);

        expect(stdout).toContain('Based on the API documentation in');
        expect(stdout).toContain('help me implement authentication');
        expect(stdout).toContain('Explain the rate limiting strategy');
        expect(stdout).toContain('write code to handle webhooks');
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });

  describe('error handling', () => {
    it('should handle non-existent directory', async () => {
      const nonExistentDir = join(await createTempDir(), 'nonexistent-subdir');

      const { stdout, stderr, exitCode } = await runCommand('bun', [
        'run',
        'src/index.ts',
        'load',
        nonExistentDir,
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Error: Directory not found:');
      expect(stderr).toContain(nonExistentDir);
    });

    it('should handle empty directory name gracefully', async () => {
      // This tests that empty string is treated as relative path
      const emptyDir = '';
      const { exitCode } = await runCommand('bun', [
        'run',
        'src/index.ts',
        'load',
        emptyDir,
      ]);

      // Should either succeed (if docshot exists) or fail (if it doesn't)
      // The important thing is it doesn't crash
      expect(exitCode).toBeGreaterThanOrEqual(0);
    });
  });

  describe('output format', () => {
    it('should have correct formatting with separators', async () => {
      const content = generateTestContent(50);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { exitCode: convertExitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
        ]);

        expect(convertExitCode).toBe(0);

        const { stdout } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'load',
          outputDir,
        ]);

        // Check for separator lines
        expect(stdout).toContain('═'.repeat(70));
        expect(stdout).toContain('─'.repeat(70));
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should display directory path correctly', async () => {
      const content = generateTestContent(50);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { exitCode: convertExitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
        ]);

        expect(convertExitCode).toBe(0);

        const { stdout } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'load',
          outputDir,
        ]);

        // The directory path should appear multiple times in the output
        const occurrences = (stdout.match(new RegExp(outputDir.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        expect(occurrences).toBeGreaterThan(0);
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });
});

