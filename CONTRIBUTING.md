# Contributing to Vigil-Code

Thank you for your interest in contributing to Vigil-Code! This document provides guidelines for contributing to the Master-Agent Architecture framework.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Provide clear description of the problem
3. Include reproduction steps if applicable
4. Mention your environment (OS, Node version, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Write or update tests if applicable
5. Update documentation
6. Commit with descriptive message
7. Push to your fork
8. Open a Pull Request

### Commit Message Format

Follow conventional commits:

```
type(scope): subject

body (optional)

footer (optional)
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Maintenance tasks

### Adding New Agents

1. Create agent directory: `agents/[agent-name]/`
2. Include `AGENT.md` with:
   - Overview
   - Core Responsibilities
   - Supported Tasks
   - Task Identifiers
   - Integration Points
   - Best Practices
3. Update Master Orchestrator registry
4. Add tests if applicable
5. Update README.md

### Creating Workflow Templates

1. Document in `master-orchestrator/docs/workflow-templates.md`
2. Include:
   - Trigger conditions
   - Agent sequence
   - Validation criteria
   - Success metrics
3. Add examples
4. Test thoroughly

## Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/vigil-code.git
cd vigil-code

# Install dependencies
npm install

# Validate agents
npm run validate

# List all agents
npm run list-agents
```

## Testing

- Ensure all agent definitions are valid JSON/Markdown
- Test workflow templates with various inputs
- Verify agent communication protocols
- Check for circular dependencies

## Documentation

- Keep documentation up-to-date with code changes
- Use clear, concise language
- Include examples where helpful
- Update version numbers consistently

## Questions?

Feel free to open an issue for any questions or discussions about contributing.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.