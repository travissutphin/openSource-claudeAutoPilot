#!/bin/bash

echo ""
echo "AI-DOCS Framework Installer"
echo "============================"
echo ""

# Check if we're in the docs-framework directory or parent
if [ -f "CLAUDE.md.default" ]; then
    SOURCE="CLAUDE.md.default"
    TARGET="../CLAUDE.md"
elif [ -f "docs-framework/CLAUDE.md.default" ]; then
    SOURCE="docs-framework/CLAUDE.md.default"
    TARGET="CLAUDE.md"
else
    echo "ERROR: Cannot find CLAUDE.md.default"
    echo "Make sure you're in the project root or docs-framework directory"
    exit 1
fi

# Check if CLAUDE.md already exists
if [ -f "$TARGET" ]; then
    echo "WARNING: CLAUDE.md already exists at $TARGET"
    read -p "Overwrite with default? (y/n): " OVERWRITE
    if [ "$OVERWRITE" != "y" ] && [ "$OVERWRITE" != "Y" ]; then
        echo "Installation cancelled."
        exit 0
    fi
fi

# Copy the default file
cp "$SOURCE" "$TARGET"
if [ $? -eq 0 ]; then
    echo ""
    echo "SUCCESS! CLAUDE.md installed."
    echo ""
    echo "Next steps:"
    echo "  1. Open Claude Code in this directory"
    echo "  2. Type: [SetupProject]"
    echo "  3. Answer the questions or provide your PRD"
    echo ""
    echo "[SetupProject] will update CLAUDE.md with your project config."
    echo ""
else
    echo "ERROR: Failed to copy file"
    exit 1
fi
