# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**docshot** is a CLI tool that converts documentation into terminal-style images to reduce Claude's token usage by 56-73% while maintaining 89-97% accuracy. The tool is built with Bun and TypeScript, using @napi-rs/canvas for image generation. It supports both single file and glob pattern processing for batch conversions.

## Development Commands

### Running the CLI

```bash
# Development mode (uses source files directly)
bun run dev convert <file> [options]
bun run dev convert "docs/**/*.md"  # Glob patterns supported
bun run dev load [dir]

# Production mode (uses built files)
bun run build
./dist/index.js convert <file> [options]
./dist/docload.js [args]
```

### Building

```bash
# Build for production
bun run build

# This compiles src/index.ts and src/docload.ts to dist/
# IMPORTANT: Native dependencies (@napi-rs/canvas) are marked as external
# to prevent bundling issues with native bindings
```

### Testing

```bash
bun test
```

### Publishing

This project uses semantic-release with conventional commits. Version bumps and releases are handled automatically via CI/CD.

**DO NOT manually bump the version number in package.json.**

Use conventional commit format:
- `feat:` - New feature (minor version bump)
- `fix:` - Bug fix (patch version bump)
- `BREAKING CHANGE:` in commit body - Breaking change (major version bump)

## Architecture

### Core Components

1. **src/index.ts** (5.8 KB)
   - Main CLI entry point using Commander.js
   - Defines two commands: `convert` and `load`
   - Handles density presets (high/medium/low)
   - Supports glob patterns for batch processing (using fast-glob)
   - Manages input validation and output directory creation
   - Multi-file mode organizes outputs in subdirectories by file name

2. **src/generator.ts** (4.0 KB)
   - Core image generation logic using @napi-rs/canvas
   - Terminal-style rendering with VS Code Dark+ color scheme
   - Basic syntax highlighting for code/markdown
   - Progress bar for multi-page generation

3. **src/docload.ts** (3.7 KB)
   - Claude CLI wrapper that auto-loads images
   - Parses `--images` flag to find image directory
   - Converts PNG files to `@path` references
   - Injects image references via `--append-system-prompt`

### Image Generation Flow

```
Documentation File(s) (text)
  → Glob pattern matching (if pattern provided)
    - Finds all matching files
    - Reports count and file list
  → For each file:
    → Split into pages (60-100 lines per page)
    → Render each page as terminal screenshot
      - Dark background (rgb(30,30,30))
      - Monospace font (Monaco, 12-16pt)
      - Line numbers + syntax highlighting
      - Page header with progress indicator
    → Save as PNG files
      - Single file: docshot/page_001.png
      - Multi-file: docshot/{filename}/page_001.png
```

### Density Presets

Based on comprehensive experiments (see ../results/REPORT-CLI.md):

| Preset | Lines/Page | Font Size | Token Savings | Accuracy |
|--------|------------|-----------|---------------|----------|
| high   | 100        | 12pt      | 73.5%         | 91%      |
| medium | 80         | 14pt      | 67%           | 97% ⭐   |
| low    | 60         | 16pt      | 56%           | 89%      |

**Medium is recommended** as the best balance of efficiency and accuracy.

## Build Configuration

### Critical: Native Dependencies

The build script MUST mark native dependencies and certain packages as external:

```json
"build": "bun build src/index.ts src/docload.ts --outdir dist --target bun --external @napi-rs/canvas --external commander --external fast-glob"
```

**Why:**
- @napi-rs/canvas uses native Node.js bindings that cannot be bundled. Bundling them causes "Failed to load native binding" errors at runtime.
- fast-glob and commander are also marked external to avoid bundling issues.

### Package Structure

```
dist/
  ├── index.js      - Main CLI (docshot command)
  └── docload.js    - Claude wrapper (docload command)
```

Both files have shebang (`#!/usr/bin/env bun`) and are executable.

## Common Development Tasks

### Using Glob Patterns

The tool supports glob patterns for batch processing multiple files:

```bash
# Convert all markdown files in a directory
bun run dev convert "docs/**/*.md"

# Multiple file extensions
bun run dev convert "src/**/*.{md,txt}"

# Specific paths
bun run dev convert "guides/*.md"
```

**Key implementation details:**
- Pattern detection: Uses `/[*?{\[\]]/` regex to detect glob patterns
- File finding: Uses `fast-glob` library with `absolute: true` and `onlyFiles: true`
- Output organization: Multi-file mode creates subdirectories per file (using `fileToDirectoryName()`)
- Progress reporting: Shows `[1/N] Processing: file.md` for multi-file operations

### Adding a New Density Preset

Edit the `densityPresets` object in src/index.ts:

```typescript
const densityPresets: Record<string, { linesPerPage: number; fontSize: number }> = {
  high: { linesPerPage: 100, fontSize: 12 },
  medium: { linesPerPage: 80, fontSize: 14 },
  low: { linesPerPage: 60, fontSize: 16 },
  // Add new preset here
};
```

### Modifying Color Scheme

Edit color constants in src/generator.ts:

```typescript
const BG_COLOR = 'rgb(30, 30, 30)';
const TEXT_COLOR = 'rgb(212, 212, 212)';
const COMMENT_COLOR = 'rgb(106, 153, 85)';
// etc.
```

### Improving Syntax Highlighting

The `getLineColor()` function in src/generator.ts provides basic syntax highlighting. Extend the regex patterns to support more language features.

### Adding New CLI Options

Use Commander.js in src/index.ts:

```typescript
program
  .command('convert')
  .option('--new-option <value>', 'Description')
  .action(async (file: string, options: any) => {
    const newOption = options.newOption;
    // Use the option
  });
```

## Testing Strategy

When testing changes:

1. **Test with dev mode first:**
   ```bash
   # Single file
   bun run dev convert test-file.md

   # Glob pattern
   bun run dev convert "tests/**/*.md"
   ```

2. **Verify build works:**
   ```bash
   bun run build
   ./dist/index.js convert test-file.md
   ./dist/index.js convert "tests/**/*.md"
   ```

3. **Check generated images:**
   - Open a few PNG files visually
   - Verify line numbers are correct
   - Check syntax highlighting
   - Ensure page headers show correct progress

4. **Test with Claude Code:**
   ```bash
   bun run dev load docshot
   # Copy output and test in Claude Code conversation
   ```

## Troubleshooting

### "Failed to load native binding" Error

**Cause:** @napi-rs/canvas was bundled instead of being external.

**Fix:** Ensure build script includes `--external @napi-rs/canvas`

### Images Not Loading in Claude

**Cause:** Path resolution issues.

**Solution:** Use `bun run dev load` to get the correct path format, or use absolute paths.

### Syntax Highlighting Not Working

The syntax highlighting is intentionally basic (performance-optimized). It only handles:
- Comments (lines starting with # or //)
- Common keywords (function, const, let, etc.)
- Default text color for everything else

This is by design - complex syntax highlighting would require more processing and potentially affect image generation speed.

## File Organization

```
prompt-images/
├── src/
│   ├── index.ts        - Main CLI
│   ├── generator.ts    - Image generation
│   └── docload.ts      - Claude wrapper
├── dist/               - Built output
├── CLAUDE.md          - This file
├── README.md          - User documentation
├── USAGE.md           - Detailed usage guide
└── IDEAS.md           - Future enhancements
```

## Dependencies

### Production Dependencies

- **@napi-rs/canvas** (^0.1.81) - Native canvas implementation for Node.js (image rendering)
- **commander** (^12.0.0) - CLI framework
- **fast-glob** (^3.3.2) - Fast file pattern matching for glob support

### Dev Dependencies

- **@types/node** - TypeScript types for Node.js
- **bun-types** - TypeScript types for Bun runtime
- **semantic-release** - Automated versioning and package publishing
- **@semantic-release/npm** - NPM plugin for semantic-release
- **@semantic-release/github** - GitHub plugin for semantic-release
- **conventional-changelog-conventionalcommits** - Conventional commits parser

## Release Process

This project uses semantic-release (see .releaserc.json) with automated CI/CD via GitHub Actions.

### Making a Release

1. **Make changes and commit using conventional format:**
   ```bash
   git commit -m "fix: resolve native binding bundling issue"
   ```

2. **Push to main branch:**
   ```bash
   git push origin main
   ```

3. **GitHub Actions automatically runs (.github/workflows/release.yml):**
   - Checks out code
   - Sets up Bun runtime
   - Installs dependencies (`bun install --frozen-lockfile`)
   - Runs tests (`bun test`)
   - Builds the project (`bun run build`)
   - Runs semantic-release:
     - Analyzes commits since last release
     - Determines version bump (major/minor/patch)
     - Updates package.json version
     - Generates CHANGELOG
     - Publishes to NPM (requires NPM_TOKEN secret)
     - Creates GitHub release

**Never manually:**
- Edit version in package.json
- Create git tags
- Publish to NPM
- Run `npm publish`

### CI/CD Requirements

The release workflow requires two secrets:
- **GITHUB_TOKEN** - Automatically provided by GitHub Actions
- **NPM_TOKEN** - Must be configured in repository secrets for NPM publishing

## Performance Considerations

- **Image generation is I/O bound:** Canvas rendering is fast, but writing PNG files can be slow with many pages
- **Progress bar:** Always show progress for large documents (implemented in generator.ts)
- **Memory usage:** Each canvas is created and destroyed per page, keeping memory usage constant
- **Parallelization:** Not implemented - pages are generated sequentially for simplicity

## Related Files

- **README.md** - Installation instructions and basic usage for end users
- **USAGE.md** - Comprehensive usage guide with workflows and examples
- **IDEAS.md** - Future feature ideas and enhancements
- **../results/REPORT-CLI.md** - Full experimental results justifying the token savings claims
