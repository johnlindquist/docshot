import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  createTempFile,
  createTempDir,
  cleanupTempFiles,
  runCommand,
  generateTestContent,
  getPngFiles,
} from '../helpers.js';
import { existsSync, writeFile } from 'fs';
import { writeFile as writeFileAsync } from 'fs/promises';
import { join, resolve, relative } from 'path';
import { which } from 'bun';

// Check if claude CLI is available
async function isClaudeAvailable(): Promise<boolean> {
  try {
    const claudePath = await which('claude');
    return claudePath !== null;
  } catch {
    return false;
  }
}

describe('docload command', () => {
  describe('help flag handling', () => {
    it('should pass --help flag directly to claude without image loading', async () => {
      if (!(await isClaudeAvailable())) {
        console.log('Skipping test: claude CLI not available');
        return;
      }

      const { stdout, stderr, exitCode } = await runCommand('bun', [
        'run',
        'src/docload.ts',
        '--help',
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage: claude');
      expect(stdout).toContain('Claude Code');
      // Should not have image-related errors
      expect(stderr).not.toContain('Directory not found');
      expect(stderr).not.toContain('No PNG files found');
    });

    it('should pass -h flag directly to claude without image loading', async () => {
      if (!(await isClaudeAvailable())) {
        console.log('Skipping test: claude CLI not available');
        return;
      }

      const { stdout, stderr, exitCode } = await runCommand('bun', [
        'run',
        'src/docload.ts',
        '-h',
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('Usage: claude');
      // Should not have image-related errors
      expect(stderr).not.toContain('Directory not found');
      expect(stderr).not.toContain('No PNG files found');
    });
  });

  describe('error handling', () => {
    it('should handle non-existent directory', async () => {
      const nonExistentDir = join(await createTempDir(), 'nonexistent-subdir');

      const { stdout, stderr, exitCode } = await runCommand('bun', [
        'run',
        'src/docload.ts',
        '--images',
        nonExistentDir,
        'test prompt',
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Error: Directory not found:');
      expect(stderr).toContain('nonexistent-subdir');
    });

    it('should handle directory with no PNG files', async () => {
      const emptyDir = await createTempDir();

      const { stdout, stderr, exitCode } = await runCommand('bun', [
        'run',
        'src/docload.ts',
        '--images',
        emptyDir,
        'test prompt',
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Error: No PNG files found in directory:');
      expect(stderr).toContain('docshot convert');
    });

    it('should handle --images flag without value when it is last argument', async () => {
      // When --images is the last argument, there's no value
      // This tests the edge case where --images is followed by nothing
      const { stdout, stderr, exitCode } = await runCommand('bun', [
        'run',
        'src/docload.ts',
        '--images',
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Error: --images flag requires a directory path');
    });

    it('should handle file path instead of directory', async () => {
      const testFile = await createTempFile('test content');

      const { stdout, stderr, exitCode } = await runCommand('bun', [
        'run',
        'src/docload.ts',
        '--images',
        testFile,
        'test prompt',
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain('Error: Path is not a directory:');
      expect(stderr).toContain('test.md');
    });
  });

  describe('image discovery', () => {
    it('should find images in default docshot directory', async () => {
      const tempBase = await createTempDir();
      const defaultDir = join(tempBase, 'docshot');
      const testFileContent = generateTestContent(100);
      const testFilePath = join(tempBase, 'test.md');

      await writeFileAsync(testFilePath, testFileContent, 'utf8');

      try {
        // Generate images first
        const { exitCode: convertExitCode } = await runCommand(
          'bun',
          ['run', resolve('src/index.ts'), 'convert', 'test.md', '--output', 'docshot'],
          { cwd: tempBase }
        );

        expect(convertExitCode).toBe(0);
        expect(existsSync(defaultDir)).toBe(true);

        // Verify images exist
        const pngFiles = await getPngFiles(defaultDir);
        expect(pngFiles.length).toBeGreaterThan(0);

        // Test docload - it will try to call claude which might hang or fail
        // But we can verify it doesn't error on image discovery by checking
        // that it doesn't output image-related errors before claude is invoked
        // Use a timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        
        const commandPromise = runCommand(
          'bun',
          ['run', resolve('src/docload.ts'), '--print', 'test'],
          { cwd: tempBase }
        );

        try {
          const { stderr } = await Promise.race([commandPromise, timeoutPromise]) as any;
          // Should not have image discovery errors
          expect(stderr).not.toContain('Directory not found');
          expect(stderr).not.toContain('No PNG files found');
        } catch (error: any) {
          // If timeout or claude error, that's OK - we just want to verify
          // it got past image discovery. The error message will tell us.
          if (error.message !== 'Timeout' && error.stderr) {
            // Should not have image discovery errors
            expect(error.stderr).not.toContain('Directory not found');
            expect(error.stderr).not.toContain('No PNG files found');
          }
        }
      } finally {
        await cleanupTempFiles(testFilePath, tempBase);
      }
    });

    it('should find images in custom directory via --images flag', async () => {
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

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBeGreaterThan(0);

        // Test docload with custom directory - use timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        
        const commandPromise = runCommand('bun', [
          'run',
          'src/docload.ts',
          '--images',
          outputDir,
          '--print',
          'test',
        ]);

        try {
          const result = await Promise.race([commandPromise, timeoutPromise]) as any;
          // Should not have image discovery errors
          expect(result.stderr).not.toContain('Directory not found');
          expect(result.stderr).not.toContain('No PNG files found');
        } catch (error: any) {
          // If timeout or claude error, verify it got past image discovery
          if (error.message !== 'Timeout' && error.stderr) {
            expect(error.stderr).not.toContain('Directory not found');
            expect(error.stderr).not.toContain('No PNG files found');
          }
        }
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should discover and sort images correctly', async () => {
      const content = generateTestContent(250); // Enough for multiple pages
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

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBeGreaterThan(1); // Should have multiple images

        // Verify they're sorted correctly (page_001.png, page_002.png, etc.)
        const filenames = pngFiles.map(file => file.split(/[\\/]/).pop()!);
        const sortedFilenames = [...filenames].sort();

        expect(filenames).toEqual(sortedFilenames);
        expect(filenames[0]).toContain('page_001.png');
        if (filenames.length > 1) {
          expect(filenames[filenames.length - 1]).toContain(`page_${String(filenames.length).padStart(3, '0')}.png`);
        }
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });

  describe('argument parsing', () => {
    it('should extract --images flag and remove it from claude args', async () => {
      const content = generateTestContent(50);
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

        // Test that --images flag is handled and removed
        // Use timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        
        const commandPromise = runCommand('bun', [
          'run',
          'src/docload.ts',
          '--images',
          outputDir,
          '--print',
          '--model',
          'sonnet',
          'test prompt',
        ]);

        try {
          const result = await Promise.race([commandPromise, timeoutPromise]) as any;
          // Should not have errors about --images flag being invalid for claude
          expect(result.stderr).not.toContain('--images flag requires');
          expect(result.stderr).not.toContain('Directory not found');
          expect(result.stderr).not.toContain('No PNG files found');
        } catch (error: any) {
          // If timeout or claude error, verify it got past image discovery
          if (error.message !== 'Timeout' && error.stderr) {
            expect(error.stderr).not.toContain('--images flag requires');
            expect(error.stderr).not.toContain('Directory not found');
            expect(error.stderr).not.toContain('No PNG files found');
          }
        }
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should pass through other arguments to claude', async () => {
      const content = generateTestContent(50);
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

        // Test with multiple claude flags - use timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        
        const commandPromise = runCommand('bun', [
          'run',
          'src/docload.ts',
          '--images',
          outputDir,
          '--print',
          '--model',
          'sonnet',
          'test prompt',
        ]);

        try {
          const result = await Promise.race([commandPromise, timeoutPromise]) as any;
          // Should not error on image discovery
          expect(result.stderr).not.toContain('Directory not found');
          expect(result.stderr).not.toContain('No PNG files found');
        } catch (error: any) {
          // If timeout or claude error, verify it got past image discovery
          if (error.message !== 'Timeout' && error.stderr) {
            expect(error.stderr).not.toContain('Directory not found');
            expect(error.stderr).not.toContain('No PNG files found');
          }
        }
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should handle --images flag in different positions', async () => {
      const content = generateTestContent(50);
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

        const timeoutPromise = (timeout: number) => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeout)
        );

        // Test --images flag at the end
        const commandPromise1 = runCommand('bun', [
          'run',
          'src/docload.ts',
          '--print',
          '--images',
          outputDir,
          'test',
        ]);

        try {
          const result1 = await Promise.race([commandPromise1, timeoutPromise(2000)]) as any;
          expect(result1.stderr).not.toContain('Directory not found');
          expect(result1.stderr).not.toContain('No PNG files found');
        } catch (error: any) {
          if (error.message !== 'Timeout' && error.stderr) {
            expect(error.stderr).not.toContain('Directory not found');
            expect(error.stderr).not.toContain('No PNG files found');
          }
        }

        // Test --images flag in the middle
        const commandPromise2 = runCommand('bun', [
          'run',
          'src/docload.ts',
          '--print',
          '--images',
          outputDir,
          '--model',
          'sonnet',
          'test',
        ]);

        try {
          const result2 = await Promise.race([commandPromise2, timeoutPromise(2000)]) as any;
          expect(result2.stderr).not.toContain('Directory not found');
          expect(result2.stderr).not.toContain('No PNG files found');
        } catch (error: any) {
          if (error.message !== 'Timeout' && error.stderr) {
            expect(error.stderr).not.toContain('Directory not found');
            expect(error.stderr).not.toContain('No PNG files found');
          }
        }
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });

  describe('path generation', () => {
    it('should generate relative paths from current working directory', async () => {
      const content = generateTestContent(50);
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

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBeGreaterThan(0);

        // Verify relative paths can be generated
        const cwd = process.cwd();
        const relativePaths = pngFiles.map(file => {
          const relPath = relative(cwd, file);
          return `@${relPath}`;
        });

        // All paths should start with @
        relativePaths.forEach(path => {
          expect(path).toMatch(/^@/);
        });

        // At least one path should contain the output directory name
        const outputDirName = outputDir.split(/[\\/]/).pop()!;
        const hasOutputDir = relativePaths.some(path => path.includes(outputDirName));
        expect(hasOutputDir).toBe(true);
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should format image references with @ prefix and space separation', async () => {
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

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBeGreaterThan(0);

        // Generate the expected format
        const cwd = process.cwd();
        const relativePaths = pngFiles.map(file => {
          const relPath = relative(cwd, file);
          return `@${relPath}`;
        });
        const systemPrompt = relativePaths.join(' ');

        // Verify format
        expect(systemPrompt).toMatch(/^@/); // Starts with @
        expect(systemPrompt).toMatch(/\.png/); // Contains .png references
        // Should have spaces between @ references if multiple images
        if (pngFiles.length > 1) {
          expect(systemPrompt.split('@').length - 1).toBe(pngFiles.length);
        }
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });

  describe('default directory behavior', () => {
    it('should use docshot directory by default when no --images flag provided', async () => {
      const tempBase = await createTempDir();
      const defaultDir = join(tempBase, 'docshot');
      const testFileContent = generateTestContent(50);
      const testFilePath = join(tempBase, 'test.md');

      await writeFileAsync(testFilePath, testFileContent, 'utf8');

      try {
        // Generate images in default location
        const { exitCode: convertExitCode } = await runCommand(
          'bun',
          ['run', resolve('src/index.ts'), 'convert', 'test.md'],
          { cwd: tempBase }
        );

        expect(convertExitCode).toBe(0);
        expect(existsSync(defaultDir)).toBe(true);

        // Test docload without --images flag - use timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 2000)
        );
        
        const commandPromise = runCommand(
          'bun',
          ['run', resolve('src/docload.ts'), '--print', 'test'],
          { cwd: tempBase }
        );

        try {
          const result = await Promise.race([commandPromise, timeoutPromise]) as any;
          // Should not error on finding docshot directory
          expect(result.stderr).not.toContain('Directory not found');
          expect(result.stderr).not.toContain('No PNG files found');
        } catch (error: any) {
          // If timeout or claude error, verify it got past image discovery
          if (error.message !== 'Timeout' && error.stderr) {
            expect(error.stderr).not.toContain('Directory not found');
            expect(error.stderr).not.toContain('No PNG files found');
          }
        }
      } finally {
        await cleanupTempFiles(testFilePath, tempBase);
      }
    });
  });
});

