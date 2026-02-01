---
name: pii
description: Dual-language PII detection (Polish + English) using Microsoft Presidio (project)
---

# PII Detection Agent

Use this agent for privacy and PII detection tasks in Vigil Guard Enterprise:
- Dual-language PII detection (Polish + English)
- Entity type configuration (50+ types)
- pii-worker NATS consumer management
- Presidio API configuration
- PII pattern testing

## What This Agent Does

The PII detection agent manages privacy protection:

1. **Analyze Entity** - Detects PII in text (PESEL, email, credit cards, etc.)
2. **Detect PII** - Runs dual-language detection with scoring
3. **Configure Entities** - Enables/disables specific PII types
4. **Test Detection** - Validates PII patterns work correctly
5. **Language Analysis** - Determines text language for optimal detection

## Supported Entities

**Polish:**
- PL_PESEL (national ID) - checksum validated
- PL_NIP (tax ID) - checksum validated
- PL_REGON (business ID)
- Polish phone numbers
- Polish addresses

**English:**
- Email addresses
- Credit card numbers
- SSN, IP addresses
- Person names, locations

**Both languages:**
- URLs, dates, medical records
- 50+ entity types total

## Architecture (Enterprise)

```
NATS JetStream
    |
    +---> pii-worker (TypeScript)
              |
              +---> Presidio API (:5001)
                        |
                        +---> Polish model (pl_core_news_lg)
                        +---> English model (en_core_web_lg)
```

## When to Use

- Testing PII detection accuracy
- Configuring entity types
- Analyzing text for sensitive data
- Debugging false positives/negatives
- Worker health issues

## Example Tasks

"Test PII detection for Polish PESEL: 44051401359"
"Detect all PII in this text: [content]"
"Configure entity types - disable LOCATION"
"Why isn't email detection working?"
"Check pii-worker consumer status"

## Quick Commands

```bash
# Test Presidio API directly
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"PESEL: 92032100157","language":"pl","entities":["PL_PESEL"]}'

# Check pii-worker consumer
docker exec vigil-nats nats consumer info VIGIL_DETECTION pii-worker

# View worker logs
docker logs pii-worker --tail 50
```

## Related Agents

Works with:
- **patterns** - PII pattern configuration
- **backend** - API PII endpoints
- **infrastructure** - Worker pipeline

## Related Skills

- presidio-pii-specialist - Full Presidio guidance
- nats-messaging - Worker management
- testing-e2e - PII test cases

## Usage

Describe PII detection needs. The agent will:
1. Analyze text language
2. Run appropriate Presidio analyzers
3. Apply regex fallbacks
4. Report findings with confidence scores

Ready to protect privacy!
