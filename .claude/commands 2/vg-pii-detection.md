---
name: vg-pii-detection
description: Dual-language PII detection (Polish + English) using Microsoft Presidio (project)
---

# PII Detection Agent

Use this agent for privacy and PII detection tasks:
- Dual-language PII detection (Polish + English)
- Entity type configuration (50+ types)
- Language detection integration
- Presidio analyzer management
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
- PESEL (national ID)
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

## When to Use

- Testing PII detection accuracy
- Configuring entity types
- Analyzing text for sensitive data
- Debugging false positives/negatives
- Language detection issues

## Example Tasks

"Test PII detection for Polish PESEL: 44051401359"
"Detect all PII in this text: [content]"
"Configure entity types - disable LOCATION"
"Why isn't email detection working?"
"Analyze language detection for mixed Polish-English text"

## Architecture

- **Presidio Polish API** (port 5001) - Polish entities
- **Presidio English API** (port 5001) - English entities
- **Language Detector** (port 5002) - Hybrid detection
- **Regex Fallback** - 13 patterns from pii.conf

## Related Agents

Works with:
- **vg-workflow-business-logic** - PII pattern configuration
- **vg-backend-api** - Web UI PII test panel
- **vg-workflow-infrastructure** - n8n PII node updates

## Usage

Describe PII detection needs. The agent will:
1. Analyze text language
2. Run appropriate Presidio analyzers
3. Apply regex fallbacks
4. Report findings with confidence scores

Ready to protect privacy!