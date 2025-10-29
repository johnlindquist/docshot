import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import {
  createTempFile,
  createTempDir,
  cleanupTempFiles,
  runCommand,
  getPngFiles,
  isValidPng,
  generateTestContent,
  countLines,
} from '../helpers.js';
import { existsSync } from 'fs';
import { join } from 'path';

describe('convert command', () => {
  describe('default options', () => {
    let testFile: string;
    let outputDir: string;

    beforeAll(async () => {
      // Create a test file with ~100 lines
      const content = generateTestContent(100);
      testFile = await createTempFile(content);
      outputDir = await createTempDir();
    });

    afterAll(async () => {
      await cleanupTempFiles(testFile, outputDir);
    });

    it('should convert file with default options', async () => {
      const { stdout, stderr, exitCode } = await runCommand('bun', [
        'run',
        'src/index.ts',
        'convert',
        testFile,
        '--output',
        outputDir,
      ]);

      expect(exitCode).toBe(0);
      expect(stderr).toBe('');
      expect(stdout).toContain('Reading documentation from:');
      expect(stdout).toContain('Success!');
      expect(existsSync(outputDir)).toBe(true);

      const pngFiles = await getPngFiles(outputDir);
      expect(pngFiles.length).toBeGreaterThan(0);

      // Verify all PNG files are valid
      for (const pngFile of pngFiles) {
        expect(isValidPng(pngFile)).toBe(true);
      }
    });

    it('should create correct number of images based on default density', async () => {
      const content = generateTestContent(250);
      const testFile2 = await createTempFile(content);
      const outputDir2 = await createTempDir();

      try {
        const { exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile2,
          '--output',
          outputDir2,
        ]);

        expect(exitCode).toBe(0);

        const lineCount = countLines(content);
        const linesPerPage = 80; // Default medium density
        const expectedPages = Math.ceil(lineCount / linesPerPage);

        const pngFiles = await getPngFiles(outputDir2);
        expect(pngFiles.length).toBe(expectedPages);
      } finally {
        await cleanupTempFiles(testFile2, outputDir2);
      }
    });

    it('should create files with correct naming pattern', async () => {
      const content = generateTestContent(200);
      const testFile3 = await createTempFile(content);
      const outputDir3 = await createTempDir();

      try {
        const { exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile3,
          '--output',
          outputDir3,
        ]);

        expect(exitCode).toBe(0);

        const pngFiles = await getPngFiles(outputDir3);
        expect(pngFiles.length).toBeGreaterThan(0);

        // Check naming pattern: page_001.png, page_002.png, etc.
        pngFiles.forEach((file, index) => {
          const expectedName = `page_${String(index + 1).padStart(3, '0')}.png`;
          expect(file).toContain(expectedName);
        });
      } finally {
        await cleanupTempFiles(testFile3, outputDir3);
      }
    });
  });

  describe('density presets', () => {
    it('should use high density preset correctly', async () => {
      const content = generateTestContent(250);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { stdout, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
          '--density',
          'high',
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('Density: high');
        expect(stdout).toContain('Lines per image: 100');
        expect(stdout).toContain('Font size: 12pt');

        const lineCount = countLines(content);
        const expectedPages = Math.ceil(lineCount / 100);

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBe(expectedPages);
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should use medium density preset correctly', async () => {
      const content = generateTestContent(250);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { stdout, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
          '--density',
          'medium',
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('Density: medium');
        expect(stdout).toContain('Lines per image: 80');
        expect(stdout).toContain('Font size: 14pt');

        const lineCount = countLines(content);
        const expectedPages = Math.ceil(lineCount / 80);

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBe(expectedPages);
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should use low density preset correctly', async () => {
      const content = generateTestContent(250);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { stdout, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
          '--density',
          'low',
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('Density: low');
        expect(stdout).toContain('Lines per image: 60');
        expect(stdout).toContain('Font size: 16pt');

        const lineCount = countLines(content);
        const expectedPages = Math.ceil(lineCount / 60);

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBe(expectedPages);
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });

  describe('custom options', () => {
    it('should use custom --lines option', async () => {
      const content = generateTestContent(200);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { stdout, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
          '--lines',
          '50',
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('Lines per image: 50');

        const lineCount = countLines(content);
        const expectedPages = Math.ceil(lineCount / 50);

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBe(expectedPages);
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should use custom --font-size option', async () => {
      const content = generateTestContent(100);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { stdout, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
          '--font-size',
          '18',
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('Font size: 18pt');
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should use custom --width option', async () => {
      const content = generateTestContent(100);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { stdout, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
          '--width',
          '1600',
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('Image width: 1600px');
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should use custom --output option', async () => {
      const content = generateTestContent(100);
      const testFile = await createTempFile(content);
      const customOutputDir = await createTempDir();

      try {
        const { exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          customOutputDir,
        ]);

        expect(exitCode).toBe(0);
        expect(existsSync(customOutputDir)).toBe(true);

        const pngFiles = await getPngFiles(customOutputDir);
        expect(pngFiles.length).toBeGreaterThan(0);
      } finally {
        await cleanupTempFiles(testFile, customOutputDir);
      }
    });

    it('should combine multiple custom options', async () => {
      const content = generateTestContent(150);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { stdout, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
          '--lines',
          '30',
          '--font-size',
          '16',
          '--width',
          '1200',
        ]);

        expect(exitCode).toBe(0);
        expect(stdout).toContain('Lines per image: 30');
        expect(stdout).toContain('Font size: 16pt');
        expect(stdout).toContain('Image width: 1200px');

        const lineCount = countLines(content);
        const expectedPages = Math.ceil(lineCount / 30);

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBe(expectedPages);
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });

  describe('error handling', () => {
    it('should handle file not found error', async () => {
      const nonExistentFile = '/tmp/nonexistent-file-12345.md';
      const outputDir = await createTempDir();

      try {
        const { stdout, stderr, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          nonExistentFile,
          '--output',
          outputDir,
        ]);

        expect(exitCode).toBe(1);
        expect(stderr).toContain('Error: File not found:');
      } finally {
        await cleanupTempFiles(outputDir);
      }
    });

    it('should handle invalid density value', async () => {
      const content = generateTestContent(50);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { stdout, stderr, exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
          '--density',
          'invalid',
        ]);

        expect(exitCode).toBe(1);
        expect(stderr).toContain("Error: Invalid density 'invalid'");
        expect(stderr).toContain('Must be: high, medium, or low');
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });

  describe('output validation', () => {
    it('should generate valid PNG files', async () => {
      const content = generateTestContent(100);
      const testFile = await createTempFile(content);
      const outputDir = await createTempDir();

      try {
        const { exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
        ]);

        expect(exitCode).toBe(0);

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBeGreaterThan(0);

        // Verify all files are valid PNGs
        for (const pngFile of pngFiles) {
          expect(isValidPng(pngFile)).toBe(true);
        }
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });

    it('should calculate correct number of pages for exact line counts', async () => {
      const testCases = [
        { lines: 80, linesPerPage: 80, expectedPages: 1 },
        { lines: 81, linesPerPage: 80, expectedPages: 2 },
        { lines: 160, linesPerPage: 80, expectedPages: 2 },
        { lines: 161, linesPerPage: 80, expectedPages: 3 },
      ];

      for (const testCase of testCases) {
        const content = generateTestContent(testCase.lines);
        const testFile = await createTempFile(content);
        const outputDir = await createTempDir();

        try {
          const { exitCode } = await runCommand('bun', [
            'run',
            'src/index.ts',
            'convert',
            testFile,
            '--output',
            outputDir,
            '--lines',
            String(testCase.linesPerPage),
          ]);

          expect(exitCode).toBe(0);

          const pngFiles = await getPngFiles(outputDir);
          expect(pngFiles.length).toBe(testCase.expectedPages);
        } finally {
          await cleanupTempFiles(testFile, outputDir);
        }
      }
    });

    it('should create output directory if it does not exist', async () => {
      const content = generateTestContent(50);
      const testFile = await createTempFile(content);
      const outputDir = join(await createTempDir(), 'nested', 'output', 'dir');

      try {
        const { exitCode } = await runCommand('bun', [
          'run',
          'src/index.ts',
          'convert',
          testFile,
          '--output',
          outputDir,
        ]);

        expect(exitCode).toBe(0);
        expect(existsSync(outputDir)).toBe(true);

        const pngFiles = await getPngFiles(outputDir);
        expect(pngFiles.length).toBeGreaterThan(0);
      } finally {
        await cleanupTempFiles(testFile, outputDir);
      }
    });
  });
});

