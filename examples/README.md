# Example: Converting API Documentation to Images

This example demonstrates how to use `docshot` and `docload` to convert documentation into images for efficient Claude context usage.

## What's Included

- `api-documentation.md` - A realistic API documentation file (~300 lines)
- `run-example.sh` - A script that demonstrates the complete workflow

## Prerequisites

1. **Install Bun** (if not already installed):
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install docshot dependencies** (from the project root):
   ```bash
   cd ..
   bun install
   ```

3. **Ensure docshot is built** (from the project root):
   ```bash
   bun run build
   ```

## Quick Start

### Option 1: Run the Example Script

```bash
cd examples
bash run-example.sh
```

This script will:
1. Convert the API documentation to images
2. Show you the generated images
3. Demonstrate how to use `docload`

### Option 2: Step-by-Step Manual Process

#### Step 1: Convert Documentation to Images

From the `examples/` directory:

```bash
# Using default settings (medium density - recommended)
bun run ../src/index.ts convert api-documentation.md

# Or specify a custom output directory
bun run ../src/index.ts convert api-documentation.md --output api-images

# Or try different densities
bun run ../src/index.ts convert api-documentation.md --density high    # Max savings (73.5%)
bun run ../src/index.ts convert api-documentation.md --density medium  # Best balance (67%) ⭐
bun run ../src/index.ts convert api-documentation.md --density low     # Best readability (56%)
```

This creates a `docshot/` folder (or your custom output folder) containing PNG images of your documentation.

#### Step 2: View the Generated Images

```bash
# List the generated images
ls -lh docshot/

# You should see files like:
# page_001.png
# page_002.png
# page_003.png
# etc.
```

#### Step 3: Use with Claude

**Method A: Using `docload` (Recommended for CLI)**

`docload` wraps the `claude` CLI and automatically appends image references to system prompts:

```bash
# Default: uses docshot/ directory
bun run ../src/docload.ts "How do I authenticate with this API?"

# Custom directory
bun run ../src/docload.ts --images api-images "Explain the rate limiting strategy"

# With claude flags
bun run ../src/docload.ts --print "Summarize the authentication methods"
bun run ../src/docload.ts --model sonnet "Help me implement webhook handling"
```

**Method B: Using Claude Code (Interactive)**

1. Open Claude Code in your IDE
2. Reference the images folder:

```
Review all images in examples/docshot/
```

Or be more specific:

```
Based on the API documentation in examples/docshot/, help me implement authentication for my application.
```

**Method C: Using Claude CLI Directly**

```bash
# Interactive mode
claude "Review the API documentation in examples/docshot/ and explain authentication"

# Print mode (non-interactive)
claude --print "Summarize the endpoints in examples/docshot/"
```

## Understanding Density Options

The `--density` option affects how many lines fit per image and impacts token savings:

| Density | Lines/Image | Font Size | Token Savings | Accuracy | Best For |
|---------|-------------|-----------|---------------|----------|----------|
| **High** | 100 | 12pt | **73.5%** | 91% | Maximum token efficiency |
| **Medium** ⭐ | 80 | 14pt | **67%** | **97%** | **Recommended - best balance** |
| **Low** | 60 | 16pt | 56% | 89% | Best readability |

**Recommendation:** Start with `medium` density - it provides the best balance of token savings (67%) and accuracy (97%).

## Expected Results

### Before Using docshot

If you pasted the raw `api-documentation.md` text into Claude:
- **Token usage:** ~8,000-10,000 tokens (estimated)
- **Cost:** Higher per conversation
- **Context:** More of your context window consumed

### After Using docshot (Medium Density)

When using images instead:
- **Token usage:** ~2,640-3,300 tokens (67% reduction)
- **Token savings:** ~5,360-6,700 tokens saved
- **Accuracy:** 97% maintained
- **Cost:** Significantly lower per conversation

## Practical Use Cases

### Use Case 1: Implementing API Integration

```bash
# 1. Convert API docs to images
bun run ../src/index.ts convert api-documentation.md --output api-docs

# 2. Use docload to ask questions
bun run ../src/docload.ts --images api-docs "How do I implement authentication?"

# 3. Continue the conversation
bun run ../src/docload.ts --images api-docs "Show me how to handle rate limiting"
```

### Use Case 2: Code Review Against Documentation

```bash
# 1. Convert standards/docs to images
bun run ../src/index.ts convert api-documentation.md --output standards

# 2. Review code against standards
bun run ../src/docload.ts --images standards "Review my API client code against these standards"
```

### Use Case 3: Learning New APIs

```bash
# 1. Convert API docs
bun run ../src/index.ts convert api-documentation.md

# 2. Ask clarifying questions
bun run ../src/docload.ts "Explain webhooks in simple terms"
bun run ../src/docload.ts "What are the best practices for error handling?"
```

## Tips for Best Results

1. **Generate once, use many times** - Images are static, so generate them once and reuse across conversations

2. **Update only when needed** - Only regenerate images when documentation changes

3. **Organize by topic** - Create separate image sets for different documentation areas

4. **Use descriptive output names** - Instead of `docshot`, use names like `api-auth-docs`, `webhook-guide`, etc.

5. **Combine with other context** - You can reference images along with other context in your prompts

## Troubleshooting

### Images not found?

```bash
# Check that images were generated
ls docshot/

# Verify the path in your command
pwd  # Make sure you're in the right directory
```

### docload can't find claude?

Make sure the `claude` CLI is installed and in your PATH:

```bash
which claude
claude --version
```

### Wrong directory in docload?

Use the `--images` flag to specify the correct directory:

```bash
bun run ../src/docload.ts --images /full/path/to/images "your prompt"
```

## Next Steps

1. **Try it with your own documentation** - Convert your own API docs, guides, or reference materials

2. **Experiment with densities** - Try different density settings to find what works best for your content

3. **Measure your savings** - Compare token usage before and after using images

4. **Share your results** - Let us know how much you're saving!

## Example Workflow

Here's a complete example workflow:

```bash
# 1. Navigate to examples directory
cd examples

# 2. Convert documentation (medium density - recommended)
bun run ../src/index.ts convert api-documentation.md --output api-docs

# 3. Verify images were created
ls api-docs/
# Should see: page_001.png, page_002.png, etc.

# 4. Use docload to ask questions
bun run ../src/docload.ts --images api-docs "What authentication methods are supported?"

# 5. Continue the conversation
bun run ../src/docload.ts --images api-docs "Show me a code example for JavaScript"

# 6. Try different claude options
bun run ../src/docload.ts --images api-docs --print "Summarize the API endpoints"
```

## Files in This Example

- `api-documentation.md` - Sample API documentation (~300 lines)
- `README.md` - This file (usage instructions)
- `run-example.sh` - Automated example script

---

**Ready to try it?** Run `bash run-example.sh` to see it in action!

