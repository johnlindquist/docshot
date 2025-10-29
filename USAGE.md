# docshot Usage Guide

Complete guide to converting documentation to images and using them with Claude.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Workflow](#basic-workflow)
3. [Advanced Usage](#advanced-usage)
4. [Loading Images into Claude](#loading-images-into-claude)
5. [Optimization Tips](#optimization-tips)

---

## Quick Start

**Get started in 30 seconds:**

```bash
# 1. Convert your documentation
bun run dev convert docs/api-reference.md

# 2. Get loading instructions
bun run dev load

# 3. Copy the output and paste into Claude Code
```

**Expected token savings:** 56-73% reduction with 89-97% accuracy maintained!

---

## Basic Workflow

### Step 1: Convert Documentation

Convert any text file to terminal-style images:

```bash
bun run dev convert path/to/documentation.md
```

**Options:**

```bash
# Specify output directory
bun run dev convert docs.md --output my-api-docs

# Choose density (affects token savings)
bun run dev convert docs.md --density medium  # Recommended ⭐
bun run dev convert docs.md --density high    # Max savings (73.5%)
bun run dev convert docs.md --density low     # Best readability (56%)

# Custom settings
bun run dev convert docs.md --lines 100 --font-size 16
```

**What gets created:**
- A folder (default: `docshot/`) containing PNG files
- Each image contains 60-100 lines of your documentation
- Terminal-style formatting with line numbers and syntax colors

### Step 2: Load into Claude Code

**Method 1: Use the load helper** (recommended)

```bash
bun run dev load docshot
```

This shows you exactly what to paste into Claude Code.

**Method 2: Direct reference**

Just mention the folder in Claude Code:

```
Review all images in docshot/
```

Claude Code automatically:
- Finds all .png files in the directory
- Loads them into the conversation
- Uses 56-73% fewer tokens than raw text!

**Method 3: Specific questions**

Be direct about what you need:

```
Based on the API documentation in docshot/, help me implement authentication
```

```
Using the examples in docshot/, write a webhook handler
```

---

## Advanced Usage

### Working with Multiple Documentation Sets

Organize different docs into separate folders:

```bash
# Convert different documentation
bun run dev convert api-docs.md --output api-images
bun run dev convert user-guide.md --output guide-images
bun run dev convert examples.md --output example-images

# Then reference specific sets in Claude
```

In Claude Code:
```
"Use api-images/ for API reference and example-images/ for code examples.
Show me how to implement user registration."
```

### Density Comparison

Choose the right density for your use case:

| Density | Lines/Image | Font | Token Savings | Accuracy | Best For |
|---------|-------------|------|---------------|----------|----------|
| **High** | 100 | 12pt | **73.5%** | 91% | Max efficiency, familiar docs |
| **Medium** ⭐ | 80 | 14pt | **67%** | 97% | **Recommended balance** |
| **Low** | 60 | 16pt | 56% | 89% | Complex docs, readability focus |

**When to use each:**

- **High density**: You're very familiar with the docs, need max token savings
- **Medium density**: Default choice - best balance of efficiency and accuracy ⭐
- **Low density**: Complex technical docs where readability is critical

### Custom Line Counts

Override density presets for specific needs:

```bash
# Very dense (save maximum tokens)
bun run dev convert docs.md --lines 120

# Very sparse (maximum readability)
bun run dev convert docs.md --lines 40

# Custom font size too
bun run dev convert docs.md --lines 80 --font-size 18
```

---

## Loading Images into Claude

### Interactive Claude Code Sessions

**Simple reference:**
```
Review the documentation in docshot/
```

**With context:**
```
I'm working on implementing OAuth. Review the auth documentation in docshot/
and help me write the code.
```

**Multi-part questions:**
```
First, review all images in docshot/.

Then, help me:
1. Understand the rate limiting strategy
2. Implement exponential backoff
3. Handle edge cases
```

### Claude CLI (Non-Interactive)

**For scripts and automation:**

```bash
# Single question via CLI
claude --print "Based on images in docshot/: How does authentication work?"

# With explicit image paths (for --print mode)
claude --print "Explain this API: $(ls docshot/*.png | tr '\n' ' ')"
```

**Save responses:**

```bash
claude --print "Summarize the API in docshot/" > api-summary.md
```

### Reusing Images Across Conversations

Images are static - generate once, use many times:

```bash
# Convert documentation (do this once)
bun run dev convert api-docs.md --output api-images

# Use in multiple conversations
claude "Using api-images/, help me with auth"
# Later...
claude "Using api-images/, explain webhooks"
# Later...
claude "Using api-images/, show rate limit handling"
```

Only regenerate when documentation changes!

---

## Real-World Workflows

### Workflow 1: API Implementation

```bash
# 1. Convert API docs
bun run dev convert api-reference.md --output api-docs

# 2. Start coding with Claude
claude "Review api-docs/ and help me implement user authentication"

# 3. Continue referencing same images
claude "Using api-docs/, now help me add webhook support"

# 4. Reuse for different features
claude "Based on api-docs/, implement rate limit handling"
```

**Token savings:** ~67% per conversation!

### Workflow 2: Code Review with Standards

```bash
# 1. Convert coding standards
bun run dev convert standards.md --output standards-images

# 2. Review code against standards
claude "Review my code against the standards in standards-images/"
```

### Workflow 3: Tutorial Assistance

```bash
# 1. Convert tutorial/guide
bun run dev convert tutorial.md --output tutorial-images

# 2. Get help while learning
claude "I'm on step 5 of the tutorial in tutorial-images/. Help me understand..."
```

### Workflow 4: Debugging with Docs

```bash
# 1. Keep docs as images
bun run dev convert error-codes.md --output error-docs

# 2. Debug with full context
claude "I'm getting error XYZ. Check error-docs/ and help me fix it."
```

---

## Optimization Tips

### 1. Choose the Right Density

Start with **medium** (recommended), then adjust:

```bash
# Try medium first
bun run dev convert docs.md --density medium

# If accuracy drops, try low
bun run dev convert docs.md --density low

# If you want more savings, try high
bun run dev convert docs.md --density high
```

### 2. Split Large Documentation

For very large docs (20k+ lines), split by topic:

```bash
# Split manually or by section
bun run dev convert api-auth.md --output auth-images
bun run dev convert api-webhooks.md --output webhook-images
bun run dev convert api-errors.md --output error-images

# Then load only what you need
claude "Using auth-images/, help me implement OAuth"
```

### 3. Update Only When Needed

Images are static - only regenerate when docs change:

```bash
# Initial generation
bun run dev convert api-docs.md

# Use for weeks/months...

# Only regenerate when docs are updated
bun run dev convert api-docs.md  # Overwrites old images
```

### 4. Organize by Project

Keep images organized per project:

```bash
project/
├── docs/
│   └── api-reference.md
├── api-images/          # Generated images
│   ├── page_001.png
│   ├── page_002.png
│   └── ...
└── src/
```

Reference with full path:
```
claude "Review api-images/ in this project and help me..."
```

### 5. Combine Text + Images

You can mix regular prompts with images:

```
I'm building a REST API for user management.

Review the best practices in api-images/ and help me design the endpoints.

Requirements:
- OAuth 2.0 authentication
- Rate limiting
- Webhook support
```

---

## Measuring Your Savings

**Track token usage:**

1. **Before images:** Note tokens used in conversation with raw text
2. **After images:** Compare tokens used with images
3. **Expected savings:** 56-73% reduction

**Example:**
- Raw text: 124,580 tokens
- With images (medium): 41,088 tokens
- **Savings: 67%** (83,492 tokens saved!)

---

## Common Use Cases

### ✅ API Documentation
Perfect for API references, endpoint docs, parameter lists

```bash
bun run dev convert api-reference.md --output api-images
```

### ✅ Coding Standards & Style Guides
Great for team standards, linting rules, best practices

```bash
bun run dev convert code-standards.md --output standards
```

### ✅ Configuration Examples
Ideal for config files, environment setups, deployment guides

```bash
bun run dev convert config-guide.md --output config-images
```

### ✅ Error Code References
Excellent for error catalogs, troubleshooting guides

```bash
bun run dev convert error-codes.md --output errors
```

### ✅ Tutorial Content
Works well for step-by-step guides, learning materials

```bash
bun run dev convert tutorial.md --output tutorial-images --density low
```

### ✅ Long Error Logs
Useful for sharing stack traces, debug output

```bash
bun run dev convert error-log.txt --output debug-images
```

---

## Troubleshooting

### Images look too dense

**Solution:** Use low density or custom line count

```bash
bun run dev convert docs.md --density low
# Or
bun run dev convert docs.md --lines 50
```

### Images look too sparse

**Solution:** Use high density

```bash
bun run dev convert docs.md --density high
```

### Claude not finding images

**Solution:** Use absolute path or load helper

```bash
# Get the right path
bun run dev load docshot

# Or use absolute path in Claude
"Review /full/path/to/docshot/"
```

### Want more token savings

**Solution:** Use high density

```bash
bun run dev convert docs.md --density high
# Saves 73.5% tokens (91% accuracy)
```

### Accuracy dropped too much

**Solution:** Use low density

```bash
bun run dev convert docs.md --density low
# Saves 56% tokens (89% accuracy)
```

---

## Best Practices

1. **Start with medium density** - Best balance for most use cases
2. **Keep images organized** - Use descriptive output directory names
3. **Reuse images** - Generate once, use in many conversations
4. **Split by topic** - For large docs, split into logical sections
5. **Test your use case** - Different content may work better at different densities
6. **Update strategically** - Only regenerate when documentation changes
7. **Combine with text** - Mix images with additional context for best results
8. **Use load helper** - Makes it easy to get the right path/command

---

## Quick Reference

```bash
# Convert with defaults (medium density)
bun run dev convert docs.md

# Convert with specific density
bun run dev convert docs.md --density [high|medium|low]

# Convert to specific output
bun run dev convert docs.md --output my-images

# Get loading instructions
bun run dev load [directory]

# Custom settings
bun run dev convert docs.md --lines 100 --font-size 14 --width 1600
```

---

## Performance Data

Based on comprehensive experiments with 13,464 lines of API documentation:

| Method | Tokens | Accuracy | Cost | Time |
|--------|--------|----------|------|------|
| Raw Text | 124,580 | 100% | $5.31 | Baseline |
| High Density | 32,998 | 91% | $2.20 | Same |
| **Medium Density** ⭐ | **41,088** | **97%** | **$2.50** | **Same** |
| Low Density | 54,975 | 89% | $3.45 | Same |

**Savings:**
- High: 73.5% token reduction, 58.5% cost savings
- Medium: 67% token reduction, 52.9% cost savings ⭐
- Low: 55.9% token reduction, 35% cost savings

---

## Next Steps

1. Try it with your own documentation:
   ```bash
   bun run dev convert your-docs.md
   ```

2. Experiment with different densities:
   ```bash
   bun run dev convert your-docs.md --density high
   bun run dev convert your-docs.md --density medium
   bun run dev convert your-docs.md --density low
   ```

3. Use with Claude and measure your savings!

4. Share your results and help improve the tool

---

For more details, see:
- **README.md** - Installation and basic usage
- **CLAUDE.md** - Claude Code specific guide
- **IDEAS.md** - Future enhancement ideas
