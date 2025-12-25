# Contributing to Claude AutoPilot

Thank you for your interest in contributing! This project aims to make AI-assisted development more accessible and efficient.

## How to Contribute

### Reporting Issues
- Use [GitHub Issues](https://github.com/travissutphin/openSource-claudeAutoPilot/issues) to report bugs or suggest features
- Include your Claude Code version and OS
- Provide sample PRD or reproduction steps if applicable

### Submitting PRDs
We welcome sample PRD contributions! Good examples help everyone.

1. Place in `examples/` directory
2. Name format: `sample-prd-{type}.md` (e.g., `sample-prd-ecommerce.md`)
3. Follow the structure in existing examples:
   - Overview with clear description
   - Goals (measurable)
   - User stories
   - Features with acceptance criteria
   - Technical requirements
   - Out of scope section

### Improving Automation Scripts
Located in `automation/` - scripts that power autonomous operations.

Before submitting:
1. Test on both Windows and Unix systems
2. Ensure no hardcoded paths
3. Add error handling for edge cases
4. Update documentation if behavior changes

### Slash Commands
Located in `slash-commands/` - these define Claude Code workflows.

Guidelines:
1. Clear step-by-step instructions
2. Specify which team role executes each step
3. Include version history
4. Test the complete workflow

## Code Style

- **JavaScript**: Node.js compatible, no external dependencies where possible
- **Markdown**: Use consistent heading hierarchy
- **JSON configs**: Include `_comment` fields explaining purpose

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`feature/your-feature-name`)
3. Make your changes
4. Test thoroughly
5. Submit PR with clear description of changes

## Questions?

Open a [GitHub Issue](https://github.com/travissutphin/openSource-claudeAutoPilot/issues) with the `question` label.

---

## Project Links

- **Repository**: https://github.com/travissutphin/openSource-claudeAutoPilot
- **Issues**: https://github.com/travissutphin/openSource-claudeAutoPilot/issues
- **Discussions**: https://github.com/travissutphin/openSource-claudeAutoPilot/discussions
