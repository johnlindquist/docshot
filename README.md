# docshot

**Convert documentation into terminal-style images for efficient Claude context usage**

Reduce your Claude context token usage by 56-73% while maintaining 89-97% accuracy! Based on comprehensive experiments showing that documentation stored as images uses significantly fewer tokens than raw text.

## Why Use This?

When working with Claude Code or Claude API, you often need to provide large documentation files as context. This can quickly consume your token budget. Our experiments show:

- **Medium Density** (recommended): **67% token reduction** with **97% accuracy** ⭐
- **High Density**: **73.5% token reduction** with **91% accuracy**
- **Low Density**: **56% token reduction** with **89% accuracy**

## Installation

```bash
# Clone or copy this directory
cd docshot

# Install dependencies with bun (required)
bun install
```

**Note:** This project requires Bun runtime. If you don't have it installed:
```bash
curl -fsSL https://bun.sh/install | bash
```

## Usage

### Basic Workflow

**1. Convert documentation to images:**

```bash
bun run dev convert path/to/documentation.md
```

This creates a `docshot` folder with your documentation split into terminal-style images.

**2. Load into Claude Code:**

```bash
bun run dev load docshot
```

This shows you exactly what to paste into Claude Code to load the images.

**Or directly in Claude Code:**

```
Review all images in docshot/
```

### Specify Output Directory

```bash
bun run dev convert docs.md --output my-images
```

### Choose Density

```bash
# Medium density (recommended) - best balance
bun run dev convert docs.md --density medium

# High density - maximum token savings
bun run dev convert docs.md --density high

# Low density - best accuracy
bun run dev convert docs.md --density low
```

### Custom Settings

```bash
# Override lines per image
bun run dev convert docs.md --lines 100

# Override font size
bun run dev convert docs.md --font-size 16

# Combine options
bun run dev convert docs.md -o output --density high --width 1600
```

## Density Presets

Based on our experiment findings:

| Density | Lines/Image | Font Size | Token Savings | Accuracy | Best For |
|---------|-------------|-----------|---------------|----------|----------|
| **Medium** ⭐ | 80 | 14pt | **67%** | **97%** | **Recommended - best balance** |
| High | 100 | 12pt | 73.5% | 91% | Maximum token efficiency |
| Low | 60 | 16pt | 56% | 89% | Highest readability |

## Using with Claude CLI

After generating images, use them with Claude:

```bash
# Single prompt with all images
claude --print "Based on this API documentation: $(ls docshot/*.png | tr '\n' ' ')

How do I implement authentication?"

# Or save image list to a variable
IMAGES=$(ls docshot/*.png | tr '\n' ' ')
claude --print "Explain the rate limiting strategy shown in: $IMAGES"
```

## Using with Claude API

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { readdirSync, readFileSync } from 'fs';

const client = new Anthropic();

// Load images
const imageFiles = readdirSync('docshot')
  .filter(f => f.endsWith('.png'))
  .sort();

const imageContent = imageFiles.map(file => ({
  type: 'image' as const,
  source: {
    type: 'base64' as const,
    media_type: 'image/png' as const,
    data: readFileSync(`docshot/${file}`).toString('base64'),
  },
}));

const response = await client.messages.create({
  model: 'claude-sonnet-4-5-20250929',
  max_tokens: 1024,
  messages: [{
    role: 'user',
    content: [
      ...imageContent,
      {
        type: 'text',
        text: 'Based on the API documentation shown in these images, how do I implement authentication?',
      },
    ],
  }],
});
```

## Build for Production

```bash
# Build the CLI
bun run build

# Run the built version
bun dist/index.js convert docs.md
```

## Command Reference

### Convert Command

```
docshot convert <file> [options]

Arguments:
  file                     Path to the documentation file

Options:
  -o, --output <dir>       Output directory (default: "docshot")
  -d, --density <type>     Density: high, medium, or low (default: "medium")
  --lines <number>         Lines per image (overrides density)
  --font-size <number>     Font size in points (overrides density)
  --width <number>         Image width in pixels (default: "1400")
  -h, --help               Display help
```

### Load Command

```
docshot load [dir]

Arguments:
  dir                      Directory containing images (default: "docshot")

Shows you exactly what to paste into Claude Code to load your images.
```

## How It Works

1. **Reads your documentation file** - Any text file (markdown, code, etc.)
2. **Splits into pages** - Based on lines per page setting
3. **Generates terminal-style images** - Dark theme, monospace font, line numbers
4. **Optimized for Claude** - Images use ~67% fewer tokens than raw text

The images use a VS Code Dark+ color scheme with basic syntax highlighting to maintain readability while minimizing token usage.

## Experiment Results

This tool is based on a comprehensive experiment comparing raw text vs. images:

**Baseline (Raw Text):**
- Avg tokens: 124,580
- Accuracy: 100%
- Cost: $5.31

**Medium Density Images (Recommended):**
- Avg tokens: 41,088 (67% reduction) ✅
- Accuracy: 97% (3% drop)
- Cost: $2.50 (53% savings)
- Images: 169 pages

See the full experiment in `../results/REPORT-CLI.md`

## Tips

1. **Start with medium density** - It offers the best balance of token savings and accuracy
2. **Use for reference documentation** - Works great for API docs, guides, specifications
3. **Combine with text** - You can mix images with text prompts for best results
4. **Test your use case** - Different types of content may work better at different densities

## Requirements

- Bun runtime (required - uses native TypeScript execution)
- @napi-rs/canvas (for image generation - installed automatically)

## License

MIT
