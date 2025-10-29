# Ideas for Easy Image Loading with Claude CLI

## Goal
Make it **dead simple** to launch Claude with documentation images. Easy to type, easy to teach, easy to learn.

## Current Claude CLI Options

From `claude --help`:
- `--system-prompt <prompt>` - Replace system prompt
- `--append-system-prompt <prompt>` - Append to system prompt
- `[prompt]` - Direct prompt argument (can include image paths)

---

## Idea 1: Simple Wrapper Command ⭐ EASIEST

**Add a `ask` command to docshot:**

```bash
# Super simple - just ask your question
bun run dev ask "How do I implement authentication?"

# Specify which image directory
bun run dev ask "Explain rate limiting" --images api-docs

# Works with any question
bun run dev ask "Show me webhook examples" --images my-images
```

**Implementation:**
- Command finds all images in specified directory (default: `docshot`)
- Constructs the claude command with image paths
- Launches claude in interactive mode or print mode

**Code example:**
```typescript
program
  .command('ask')
  .description('Ask Claude a question using generated images')
  .argument('<question>', 'Your question')
  .option('-i, --images <dir>', 'Image directory', 'docshot')
  .option('-p, --print', 'Use print mode (non-interactive)', false)
  .action((question, options) => {
    // Find all images
    const images = findImages(options.images);

    // Build claude command
    const claudeCmd = options.print
      ? `claude --print "${question}: ${images.join(' ')}"`
      : `claude "${question}: Please review images in ${options.images}/"`;

    // Execute
    execSync(claudeCmd, { stdio: 'inherit' });
  });
```

**Usage examples:**
```bash
bun run dev ask "How does authentication work?"
# → Launches: claude "How does authentication work?: Review images in docshot/"

bun run dev ask "Explain webhooks" --print
# → Launches: claude --print "Explain webhooks: img1.png img2.png ..."
```

---

## Idea 2: Shell Function / Alias

**Add to user's `.bashrc` or `.zshrc`:**

```bash
# Simple alias
alias claude-docs='claude "Review images in docshot/ and then:"'

# Usage:
claude-docs "How do I authenticate?"
# → Runs: claude "Review images in docshot/ and then: How do I authenticate?"
```

**Or more advanced shell function:**

```bash
# In ~/.bashrc or ~/.zshrc
claude-with-docs() {
  local images_dir="${2:-docshot}"
  claude "Review all images in $images_dir/ and then: $1"
}

# Usage:
claude-with-docs "How does auth work?"
claude-with-docs "Explain rate limits" "api-docs"
```

**Teach users to add this during setup:**
```bash
bun run dev install-alias
# → Adds function to ~/.bashrc or ~/.zshrc
```

---

## Idea 3: Environment Variable

**Set default image directory:**

```bash
export CLAUDE_DOCS_DIR="$PWD/docshot"

# Then simple command
claude-docs "Your question here"
```

**Implementation in wrapper:**
```bash
#!/bin/bash
DOCS_DIR="${CLAUDE_DOCS_DIR:-docshot}"
claude "Review images in $DOCS_DIR/ and then: $*"
```

**Usage:**
```bash
# One-time setup
export CLAUDE_DOCS_DIR="$PWD/api-docs"

# Then super simple
claude-docs "How do I authenticate?"
claude-docs "Show webhook examples"
```

---

## Idea 4: System Prompt Approach

**Use `--append-system-prompt` to preload context:**

```bash
# Generate system prompt from images (new command)
bun run dev system-prompt --images docshot > docs-prompt.txt

# Launch claude with docs in system prompt
claude --append-system-prompt "$(cat docs-prompt.txt)" "How does auth work?"
```

**Or wrapper that does it automatically:**
```bash
bun run dev with-context "Your question"
# → Internally runs:
#    claude --append-system-prompt "Here are the docs: [images]" "Your question"
```

---

## Idea 5: Config File Approach

**Create a `.claude-docs` config file:**

```json
{
  "imageDir": "docshot",
  "autoLoad": true
}
```

**Then simple wrapper reads config:**
```bash
claude-docs "Your question"
# → Reads .claude-docs and auto-loads images
```

---

## Idea 6: Batch/Script Generator ⭐ FASTEST SETUP

**Generate a ready-to-use script:**

```bash
# Generate a launch script
bun run dev make-launcher

# Creates: ./claude-docs.sh
```

**Generated `claude-docs.sh`:**
```bash
#!/bin/bash
IMAGES="/full/path/to/docshot"
claude "Review all images in $IMAGES/ and answer: $*"
```

**Usage:**
```bash
chmod +x claude-docs.sh
./claude-docs.sh "How does authentication work?"
```

---

## Recommended Approach: Combination! 🎯

**1. Add `ask` command (for power users):**
```bash
bun run dev ask "Your question" --images docshot
```

**2. Generate simple launcher script (for everyone):**
```bash
bun run dev make-launcher
# Creates ./ask-docs.sh

./ask-docs.sh "How does auth work?"
```

**3. Optional: Install shell function:**
```bash
bun run dev install-alias
# Adds to ~/.bashrc:
#   claude-docs() { claude "Review images in docshot/: $*"; }

claude-docs "Your question here"
```

---

## Simplest Possible Experience

**The absolute simplest for end users:**

```bash
# 1. Convert docs (one time)
bun run dev convert api-docs.md

# 2. Create launcher (one time)
bun run dev make-launcher

# 3. Use forever
./ask "How does authentication work?"
./ask "Show me webhook examples"
./ask "Explain rate limiting"
```

**Or even simpler with install:**

```bash
# 1. Convert and setup (one time)
bun run dev setup api-docs.md

# Creates:
# - docshot/ folder
# - ./ask script

# 2. Use forever
./ask "Your question here"
```

---

## Teaching / Documentation

**Simple 3-step guide:**

```
Step 1: Convert your docs
  bun run dev convert api-docs.md

Step 2: Setup the launcher
  bun run dev make-launcher

Step 3: Ask questions!
  ./ask "How do I authenticate?"
```

**Or ONE command:**
```bash
bun run dev setup api-docs.md && ./ask "How does this API work?"
```

---

## Which to Implement First?

**Priority 1: `make-launcher` command**
- Generates a simple `./ask` script
- Works everywhere (bash/zsh)
- Nothing to install or configure
- Just works™

**Priority 2: `ask` command**
- For users who don't mind typing `bun run dev`
- More flexible
- Good for testing

**Priority 3: `setup` command**
- Combines convert + make-launcher
- Ultimate simplicity
- One command to rule them all

**Priority 4: Shell function installer**
- For power users
- Makes `claude-docs` available everywhere
- Optional, not required
