import { mkdtemp, writeFile } from 'fs/promises';
import { rm, readdir } from 'fs/promises';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

const tempDirBase = join(tmpdir(), 'docshot-tests-');

/**
 * Create a temporary file with the given content
 * Returns the path to the created file
 */
export async function createTempFile(content: string, extension = '.md'): Promise<string> {
  const tempDir = await mkdtemp(tempDirBase);
  const filePath = join(tempDir, `test${extension}`);
  await writeFile(filePath, content, 'utf8');
  return filePath;
}

/**
 * Create a temporary directory
 * Returns the path to the created directory
 */
export async function createTempDir(): Promise<string> {
  return await mkdtemp(tempDirBase);
}

/**
 * Clean up temporary files and directories
 */
export async function cleanupTempFiles(...paths: string[]): Promise<void> {
  for (const path of paths) {
    try {
      if (existsSync(path)) {
        await rm(path, { recursive: true, force: true });
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Execute a CLI command and capture output
 */
export async function runCommand(
  cmd: string,
  args: string[],
  options?: { cwd?: string }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd: options?.cwd || process.cwd(),
      env: { ...process.env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 0,
      });
    });
  });
}

/**
 * Get list of PNG files in a directory
 */
export async function getPngFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) {
    return [];
  }
  const files = await readdir(dir);
  return files
    .filter((file) => file.endsWith('.png'))
    .map((file) => join(dir, file))
    .sort();
}

/**
 * Verify a file is a valid PNG by checking its header
 * PNG files start with: 89 50 4E 47 0D 0A 1A 0A
 */
export function isValidPng(file: string): boolean {
  if (!existsSync(file)) {
    return false;
  }
  try {
    const buffer = readFileSync(file);
    // Check PNG signature: 89 50 4E 47 0D 0A 1A 0A
    return (
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  } catch {
    return false;
  }
}

/**
 * Count lines in a file
 */
export function countLines(content: string): number {
  return content.split('\n').length;
}

/**
 * Generate test markdown content with specified number of lines
 */
export function generateTestContent(lines: number): string {
  const content: string[] = [];
  content.push('# Test Documentation');
  content.push('');
  content.push('This is a test document for integration testing.');
  content.push('');

  // Add various content types
  for (let i = 0; i < lines - 10; i++) {
    const lineNum = i + 1;
    if (lineNum % 20 === 0) {
      content.push(`## Section ${Math.floor(lineNum / 20)}`);
      content.push('');
    } else if (lineNum % 15 === 0) {
      content.push('```typescript');
      content.push(`const example${lineNum} = "test";`);
      content.push('```');
      content.push('');
    } else if (lineNum % 10 === 0) {
      content.push(`// Comment at line ${lineNum}`);
    } else {
      content.push(`Line ${lineNum}: This is test content for testing the docshot converter.`);
    }
  }

  // Pad to exact line count
  while (content.length < lines) {
    content.push('');
  }

  return content.slice(0, lines).join('\n');
}

