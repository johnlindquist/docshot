# docshot

**Reduce Claude context token usage by 56-73% with a single command**

## Purpose

This tool solves a simple problem: **large documentation files consume massive amounts of tokens in Claude**.

When you need to provide API documentation, guides, or reference materials to Claude Code, you typically paste raw text which can use 100k+ tokens for a single documentation file. This quickly exhausts your context window and increases costs.

**docshot** converts your documentation into terminal-style images, reducing token usage by **56-73%** while maintaining **89-97% accuracy**.

### The Problem

```bash
# Traditional approach - Raw text
claude: "Here's my 13,000 line API documentation..."
Result: 124,580 tokens consumed 💸

# With docshot
docshot convert api-docs.md
claude: [loads images]
Result: 41,088 tokens consumed (67% savings!) ✅
```

## Why This Works

Based on comprehensive experiments:

- **Text is processed character-by-character** → High token count
- **Images are processed visually** → Lower token count per information unit
- Claude's vision capabilities can read text in images efficiently
- You get the same information with a fraction of the tokens

## Quick Start

```bash
# 1. Convert your documentation
bun run dev convert docs/api-reference.md

# 2. Load into Claude Code (see LOADING section below)
# The images are now in docshot/ folder
```

## Loading Images into Claude Code

### Method 1: Use the Load Helper (Recommended)

After generating images, get loading instructions:

```bash
bun run dev load docshot

# This shows you exactly what to paste into Claude Code:
# "Review all images in /path/to/docshot"
```

### Method 2: Direct Load

Simply reference the folder in Claude Code:

```
Review all images in docshot/
```

Claude Code will automatically:
- Find all .png files in the directory
- Load them into the conversation
- Use 56-73% fewer tokens than raw text!

### Method 3: Specific Questions

Be more specific about what you need:

```
Based on the API documentation in docshot/, help me implement authentication
```

```
Explain the rate limiting strategy shown in docshot/
```

```
Using the examples in docshot/, write code to handle webhooks
```

## Recommended Workflow

1. **Convert your documentation:**
   ```bash
   bun run dev convert docs/api-reference.md --density medium
   ```

2. **Keep images organized:**
   ```bash
   # Rename output for clarity
   bun run dev convert docs/api-reference.md --output api-images
   ```

3. **Load into Claude Code:**
   ```
   "Review the API documentation in api-images/ and help me implement authentication"
   ```

4. **Reuse across conversations:**
   - Images are static - generate once, use many times
   - Reference the same image folder in multiple conversations
   - Update images only when documentation changes

## Results from Experiment

| Density | Token Savings | Accuracy | Best For |
|---------|--------------|----------|----------|
| **Medium ⭐** | **67%** | **97%** | **Recommended - best balance** |
| High | 73.5% | 91% | Maximum token efficiency |
| Low | 56% | 89% | Best readability |

**Baseline:** 124,580 tokens (raw text)
**Medium Density:** 41,088 tokens (67% reduction, 97% accuracy)

## Use Cases

✅ **API Documentation** - Share complete API references without token explosion
✅ **Code Standards** - Load style guides and best practices
✅ **Technical Specs** - Include full specifications in context
✅ **Tutorial Content** - Provide detailed tutorials and examples
✅ **Error Logs** - Share long error outputs efficiently
✅ **Configuration Examples** - Include complete config files

## Tips

1. **Start with medium density** - Best balance of savings and accuracy
2. **Generate once, use many times** - Images are reusable across conversations
3. **Organize by topic** - Create separate image sets for different documentation areas
4. **Update only when needed** - Regenerate images only when documentation changes
5. **Test your use case** - Different content may work better at different densities

## Performance Benefits

From our experiment (13,464 lines of API documentation):

- **Token Reduction:** 67% fewer tokens (medium density)
- **Cost Savings:** 53% lower API costs
- **Accuracy:** 97% maintained (only 3% drop)
- **Time:** Same or faster responses (less context to process)

## How It Works

1. **Splits documentation** into pages (60-100 lines per page)
2. **Generates terminal-style images** with dark theme, line numbers, syntax colors
3. **Optimizes for Claude's vision** using proven settings from experiments
4. **Maintains readability** while minimizing token usage

## Development

This tool was built based on a comprehensive experiment comparing raw text vs. images for Claude context efficiency. See `../results/REPORT-CLI.md` for full experimental details.

## Next Steps

Try it now:

```bash
bun run dev convert your-docs.md --density medium
```

Then load the generated images into Claude Code and experience the token savings firsthand!
