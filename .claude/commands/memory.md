# Memory Command

Access cross-session memory with progressive disclosure.

## Usage

```
/memory              → Summary (categories + counts)
/memory list         → Headlines (one-liners)
/memory list <cat>   → Headlines filtered by category
/memory show <id>    → Full details for entry
/memory search <q>   → Search in lessons/decisions
/memory comods       → Co-modification patterns
```

## Layers

| Layer | Tokens | Command |
|-------|--------|---------|
| Summary | 50-100 | `/memory` |
| Headlines | 200-400 | `/memory list` |
| Details | 500-1000 | `/memory show <id>` |

## Examples

```
/memory
→ Shows: Learnings: 25 | Decisions: 3
         Categories: security: 5, documentation: 3, ...

/memory list
→ Shows all headlines with IDs

/memory list security
→ Shows only security-category headlines

/memory show 5
→ Shows full details for learning #5

/memory show D0
→ Shows full details for decision #0

/memory search NATS
→ Searches for "NATS" in lessons and decisions

/memory comods
→ Shows file pairs frequently edited together
```

## Implementation

When user invokes `/memory`, Claude should:

1. Parse the subcommand and arguments
2. Run the appropriate memory-loader.py command:

```bash
# Summary (default)
python3 .claude/lib/memory-loader.py --layer=summary

# Headlines
python3 .claude/lib/memory-loader.py --layer=headlines
python3 .claude/lib/memory-loader.py --layer=headlines --category=security

# Details
python3 .claude/lib/memory-loader.py --layer=details --id=5
python3 .claude/lib/memory-loader.py --layer=details --id=D0

# Search
python3 .claude/lib/memory-loader.py --search="NATS"

# Co-modifications
python3 .claude/lib/memory-loader.py --layer=comods
```

3. Display the output to the user

## Related

- `/remember` - Save new learnings/decisions
- Memory loader: `.claude/lib/memory-loader.py`
- Memory files: `.claude/memory/`
