#!/usr/bin/env bun

import { Command } from 'commander';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve, basename, relative, dirname } from 'path';
import { generateImages } from './generator.js';
import glob from 'fast-glob';

const program = new Command();

// Density presets (based on experiment findings)
const densityPresets: Record<string, { linesPerPage: number; fontSize: number }> = {
  high: { linesPerPage: 100, fontSize: 12 },
  medium: { linesPerPage: 80, fontSize: 14 },  // ⭐ Recommended
  low: { linesPerPage: 60, fontSize: 16 },
};

/**
 * Check if a string contains glob pattern characters
 */
function isGlobPattern(str: string): boolean {
  return /[*?{\[\]]/.test(str);
}

/**
 * Convert a file path to a safe directory name
 */
function fileToDirectoryName(filePath: string): string {
  const name = basename(filePath, '.md').replace(/[^a-zA-Z0-9-_]/g, '_');
  return name;
}

/**
 * Process a single documentation file
 */
async function processFile(
  filePath: string,
  outputBaseDir: string,
  options: {
    density: string;
    lines?: number;
    fontSize?: number;
    width: string;
    isMultiFile?: boolean;
  }
): Promise<void> {
  // Read documentation
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Determine output directory
  const outputDir = options.isMultiFile
    ? join(outputBaseDir, fileToDirectoryName(filePath))
    : outputBaseDir;

  mkdirSync(outputDir, { recursive: true });

  // Get configuration
  const density = options.density.toLowerCase();
  const preset = densityPresets[density] || densityPresets.medium;
  const linesPerPage = options.lines ? parseInt(String(options.lines)) : preset.linesPerPage;
  const fontSize = options.fontSize ? parseInt(String(options.fontSize)) : preset.fontSize;
  const imageWidth = parseInt(options.width);

  // Generate images
  await generateImages({
    lines,
    outputDir,
    linesPerPage,
    fontSize,
    imageWidth,
  });

  return;
}

program
  .name('docshot')
  .description('Convert documentation into terminal-style images for efficient Claude context usage')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert documentation file(s) into images (supports glob patterns)')
  .argument('<file>', 'Path to file or glob pattern (e.g., "docs/**/*.md")')
  .option('-o, --output <dir>', 'Output directory for images', 'docshot')
  .option('-d, --density <type>', 'Image density: high, medium, or low', 'medium')
  .option('--lines <number>', 'Lines per image (overrides density preset)')
  .option('--font-size <number>', 'Font size in points (overrides density preset)')
  .option('--width <number>', 'Image width in pixels', '1400')
  .action(async (file: string, options: any) => {
    try {
      // Validate density
      const density = options.density.toLowerCase();
      if (!['high', 'medium', 'low'].includes(density) && !options.lines) {
        console.error(`❌ Error: Invalid density '${density}'. Must be: high, medium, or low`);
        process.exit(1);
      }

      const outputBaseDir = resolve(options.output);

      // Check if input is a glob pattern
      let files: string[];
      if (isGlobPattern(file)) {
        console.log(`🔍 Searching for files matching: ${file}`);
        files = await glob(file, { absolute: true, onlyFiles: true });

        if (files.length === 0) {
          console.error(`❌ Error: No files found matching pattern: ${file}`);
          process.exit(1);
        }

        console.log(`   Found ${files.length} file(s)`);
        files.forEach(f => console.log(`   - ${relative(process.cwd(), f)}`));
        console.log();
      } else {
        // Single file mode
        const filePath = resolve(file);
        if (!existsSync(filePath)) {
          console.error(`❌ Error: File not found: ${filePath}`);
          process.exit(1);
        }
        files = [filePath];
      }

      const isMultiFile = files.length > 1;

      // Display configuration
      const preset = densityPresets[density] || densityPresets.medium;
      const linesPerPage = options.lines ? parseInt(options.lines) : preset.linesPerPage;
      const fontSize = options.fontSize ? parseInt(options.fontSize) : preset.fontSize;

      console.log(`⚙️  Configuration:`);
      console.log(`   Density: ${density}${density === 'medium' ? ' ⭐ (recommended)' : ''}`);
      console.log(`   Lines per image: ${linesPerPage}`);
      console.log(`   Font size: ${fontSize}pt`);
      console.log(`   Image width: ${options.width}px`);
      console.log(`   Output directory: ${outputBaseDir}`);
      console.log();

      // Process each file
      console.log(`🖼️  Generating images...`);
      console.log();

      for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        const fileName = relative(process.cwd(), filePath);

        if (isMultiFile) {
          console.log(`[${i + 1}/${files.length}] Processing: ${fileName}`);
        } else {
          console.log(`📖 Processing: ${fileName}`);
        }

        const content = readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        console.log(`   Lines: ${lines.length}`);

        await processFile(filePath, outputBaseDir, {
          ...options,
          isMultiFile,
        });

        console.log();
      }

      console.log(`✅ Success!`);
      console.log();
      console.log(`📊 Token Savings (based on experiment results):`);
      if (density === 'high') {
        console.log(`   Expected: ~73.5% token reduction`);
        console.log(`   Accuracy: ~91% (vs 100% baseline)`);
      } else if (density === 'medium') {
        console.log(`   Expected: ~67% token reduction ⭐`);
        console.log(`   Accuracy: ~97% (vs 100% baseline) ⭐`);
        console.log(`   📌 Best balance of efficiency and accuracy!`);
      } else {
        console.log(`   Expected: ~56% token reduction`);
        console.log(`   Accuracy: ~89% (vs 100% baseline)`);
      }
      console.log();
      console.log(`📥 Next: Load into Claude Code`);
      console.log(`   bun run dev load ${options.output}`);
      console.log();
      if (isMultiFile) {
        console.log(`💡 Files organized by name in subdirectories`);
        console.log();
      }

    } catch (error: any) {
      console.error(`❌ Error: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('load')
  .description('Get instructions for loading images into Claude Code')
  .argument('[dir]', 'Directory containing the images', 'docshot')
  .action((dir: string) => {
    const imageDir = resolve(dir);

    if (!existsSync(imageDir)) {
      console.error(`❌ Error: Directory not found: ${imageDir}`);
      process.exit(1);
    }

    console.log();
    console.log('═'.repeat(70));
    console.log('  LOADING IMAGES INTO CLAUDE CODE');
    console.log('═'.repeat(70));
    console.log();
    console.log('📁 Image Directory:');
    console.log(`   ${imageDir}`);
    console.log();
    console.log('💬 Copy and paste this into Claude Code:');
    console.log();
    console.log('─'.repeat(70));
    console.log();
    console.log(`Review all images in ${imageDir}`);
    console.log();
    console.log('─'.repeat(70));
    console.log();
    console.log('💡 Or be more specific:');
    console.log();
    console.log(`"Based on the API documentation in ${imageDir}, help me implement authentication"`);
    console.log();
    console.log(`"Explain the rate limiting strategy shown in ${imageDir}"`);
    console.log();
    console.log(`"Using the examples in ${imageDir}, write code to handle webhooks"`);
    console.log();
    console.log('═'.repeat(70));
    console.log();
    console.log('✨ Claude Code will automatically:');
    console.log('   • Find all .png files in the directory');
    console.log('   • Load them into the conversation');
    console.log('   • Use 56-73% fewer tokens than raw text!');
    console.log();
  });

program.parse();
