#!/usr/bin/env bun

import { Command } from 'commander';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { generateImages } from './generator.js';

const program = new Command();

program
  .name('docshot')
  .description('Convert documentation into terminal-style images for efficient Claude context usage')
  .version('1.0.0');

program
  .command('convert')
  .description('Convert a documentation file into images')
  .argument('<file>', 'Path to the documentation file')
  .option('-o, --output <dir>', 'Output directory for images', 'docshot')
  .option('-d, --density <type>', 'Image density: high, medium, or low', 'medium')
  .option('--lines <number>', 'Lines per image (overrides density preset)')
  .option('--font-size <number>', 'Font size in points (overrides density preset)')
  .option('--width <number>', 'Image width in pixels', '1400')
  .action(async (file: string, options: any) => {
    try {
      // Validate input file
      const filePath = resolve(file);
      if (!existsSync(filePath)) {
        console.error(`❌ Error: File not found: ${filePath}`);
        process.exit(1);
      }

      // Read documentation
      console.log(`📖 Reading documentation from: ${filePath}`);
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      console.log(`   Lines: ${lines.length}`);
      console.log(`   Characters: ${content.length}`);
      console.log();

      // Set up density presets (based on our experiment findings)
      const densityPresets: Record<string, { linesPerPage: number; fontSize: number }> = {
        high: { linesPerPage: 100, fontSize: 12 },
        medium: { linesPerPage: 80, fontSize: 14 },  // ⭐ Recommended
        low: { linesPerPage: 60, fontSize: 16 },
      };

      // Get configuration
      const density = options.density.toLowerCase();
      if (!['high', 'medium', 'low'].includes(density) && !options.lines) {
        console.error(`❌ Error: Invalid density '${density}'. Must be: high, medium, or low`);
        process.exit(1);
      }

      const preset = densityPresets[density] || densityPresets.medium;
      const linesPerPage = options.lines ? parseInt(options.lines) : preset.linesPerPage;
      const fontSize = options.fontSize ? parseInt(options.fontSize) : preset.fontSize;
      const imageWidth = parseInt(options.width);

      // Create output directory
      const outputDir = resolve(options.output);
      mkdirSync(outputDir, { recursive: true });

      console.log(`⚙️  Configuration:`);
      console.log(`   Density: ${density}${density === 'medium' ? ' ⭐ (recommended)' : ''}`);
      console.log(`   Lines per image: ${linesPerPage}`);
      console.log(`   Font size: ${fontSize}pt`);
      console.log(`   Image width: ${imageWidth}px`);
      console.log(`   Output directory: ${outputDir}`);
      console.log();

      // Generate images
      console.log(`🖼️  Generating images...`);
      await generateImages({
        lines,
        outputDir,
        linesPerPage,
        fontSize,
        imageWidth,
      });

      console.log();
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
      console.log(`💡 Or use with Claude CLI:`);
      console.log(`   claude --print "Your prompt here: $(ls ${outputDir}/*.png | tr '\\n' ' ')"`);
      console.log();

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
