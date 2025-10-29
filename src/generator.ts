import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Terminal-style color scheme (VS Code Dark+)
const BG_COLOR = 'rgb(30, 30, 30)';
const TEXT_COLOR = 'rgb(212, 212, 212)';
const COMMENT_COLOR = 'rgb(106, 153, 85)';
const KEYWORD_COLOR = 'rgb(86, 156, 214)';
const STRING_COLOR = 'rgb(206, 145, 120)';
const NUMBER_COLOR = 'rgb(181, 206, 168)';
const LINE_NUMBER_COLOR = 'rgb(133, 133, 133)';

const PADDING = 40;
const LINE_HEIGHT_MULTIPLIER = 1.6;

interface GenerateImagesOptions {
  lines: string[];
  outputDir: string;
  linesPerPage: number;
  fontSize: number;
  imageWidth: number;
}

/**
 * Apply basic syntax highlighting to a line
 */
function getLineColor(line: string): string {
  const trimmed = line.trim();

  // Comments
  if (trimmed.startsWith('#') || trimmed.startsWith('//')) {
    return COMMENT_COLOR;
  }

  // Markdown headers
  if (trimmed.startsWith('#')) {
    return KEYWORD_COLOR;
  }

  // Keywords
  if (/^(function|const|let|var|class|import|export|return|if|else|for|while|async|await|interface|type|enum)\b/.test(trimmed)) {
    return KEYWORD_COLOR;
  }

  // Default
  return TEXT_COLOR;
}

/**
 * Generate terminal-style images from documentation lines
 */
export async function generateImages(options: GenerateImagesOptions): Promise<void> {
  const { lines, outputDir, linesPerPage, fontSize, imageWidth } = options;

  const lineHeight = Math.floor(fontSize * LINE_HEIGHT_MULTIPLIER);
  const imageHeight = PADDING * 2 + lineHeight * (linesPerPage + 2); // +2 for header and blank line

  // Split lines into pages
  const totalPages = Math.ceil(lines.length / linesPerPage);
  const pages: string[][] = [];

  for (let i = 0; i < lines.length; i += linesPerPage) {
    pages.push(lines.slice(i, i + linesPerPage));
  }

  console.log(`   Total pages: ${totalPages}`);
  console.log(`   Image dimensions: ${imageWidth}x${imageHeight}px`);
  console.log();

  // Generate each page
  for (let pageNum = 0; pageNum < pages.length; pageNum++) {
    const pageLines = pages[pageNum];
    const currentPage = pageNum + 1;

    // Create canvas
    const canvas = createCanvas(imageWidth, imageHeight);
    const ctx = canvas.getContext('2d');

    // Fill background
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, imageWidth, imageHeight);

    // Set font
    ctx.font = `${fontSize}px Monaco, "Courier New", monospace`;

    // Draw header
    ctx.fillStyle = LINE_NUMBER_COLOR;
    const header = `API Documentation - Page ${currentPage}/${totalPages}`;
    ctx.fillText(header, PADDING, PADDING + fontSize);

    // Draw separator line
    let yPosition = PADDING + lineHeight * 2;

    // Draw content lines
    const startLineNum = pageNum * linesPerPage + 1;

    for (let i = 0; i < pageLines.length; i++) {
      const line = pageLines[i];
      const lineNum = startLineNum + i;
      const lineNumStr = String(lineNum).padStart(5, ' ');

      // Draw line number
      ctx.fillStyle = LINE_NUMBER_COLOR;
      ctx.fillText(lineNumStr + '→', PADDING, yPosition);

      // Draw line content with basic syntax highlighting
      const lineColor = getLineColor(line);
      ctx.fillStyle = lineColor;

      // Calculate x position for text (after line number)
      const lineNumberWidth = ctx.measureText(lineNumStr + '→ ').width;
      ctx.fillText(line, PADDING + lineNumberWidth, yPosition);

      yPosition += lineHeight;
    }

    // Save image
    const filename = `page_${String(currentPage).padStart(3, '0')}.png`;
    const filepath = join(outputDir, filename);
    const buffer = canvas.toBuffer('image/png');
    writeFileSync(filepath, buffer);

    // Progress indicator
    const progress = Math.floor((currentPage / totalPages) * 100);
    const progressBar = '█'.repeat(Math.floor(progress / 2)) + '░'.repeat(50 - Math.floor(progress / 2));
    process.stdout.write(`\r   Progress: [${progressBar}] ${progress}%`);
  }

  console.log(); // New line after progress bar
  console.log(`   Generated ${totalPages} images`);
}
