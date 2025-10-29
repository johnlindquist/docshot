#!/bin/bash

# Example: Convert documentation to images
echo "Converting documentation to images..."
bun run dev convert ../data/documentation.md --output docs-images --density medium

# Example: Use with Claude CLI (single prompt)
echo ""
echo "Example 1: Using with Claude CLI"
echo "claude --print \"Based on this API documentation: \$(ls docs-images/*.png | tr '\\n' ' ') How do I implement authentication?\""

# Example: Save image list and reuse
echo ""
echo "Example 2: Save image list for reuse"
echo "IMAGES=\$(ls docs-images/*.png | tr '\\n' ' ')"
echo "claude --print \"Explain rate limiting: \$IMAGES\""
echo "claude --print \"Show webhook examples: \$IMAGES\""

# Example: Different densities
echo ""
echo "Example 3: Try different densities"
echo "bun run dev convert docs.md --density high    # Max token savings (73.5%)"
echo "bun run dev convert docs.md --density medium  # Best balance (67%) ⭐"
echo "bun run dev convert docs.md --density low     # Best readability (56%)"
