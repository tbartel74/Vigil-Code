# PII Detection Agent

## Overview

The PII Detection Agent manages dual-language Personal Identifiable Information detection using Microsoft Presidio, including custom recognizers, language detection, and entity deduplication for both Polish and English content.

**Version:** 1.0.0
**Consolidates:** presidio-pii-specialist + language-detection-expert
**Status:** Active

## Core Responsibilities

### 1. Presidio Service Management
- Flask API configuration
- spaCy model management
- Recognizer registration
- Service health monitoring

### 2. Dual-Language Detection
- Polish entity recognition (PESEL, NIP, REGON)
- English entity recognition (SSN, EMAIL, PHONE)
- Parallel language processing
- Entity deduplication

### 3. Custom Recognizers
- Create pattern-based recognizers
- Implement validation logic
- Configure confidence scores
- Language-specific rules

### 4. Language Detection
- Hybrid detection algorithm
- Entity-based hints
- Statistical language detection
- Language routing logic

### 5. Entity Management
- Entity type configuration
- Confidence threshold tuning
- False positive reduction
- Entity hint system

## Tech Stack

- **Presidio:** 2.2.355
- **spaCy:** 3.8.3
- **Flask:** 3.1.0
- **langdetect:** 1.0.9
- **Models:**
  - pl_core_news_md (Polish)
  - en_core_web_lg (English)

## Supported Tasks

### Task Identifiers
- `add_recognizer` - Create custom recognizer
- `configure_entity` - Configure entity type
- `add_language_hint` - Add entity hint
- `test_detection` - Test PII detection
- `create_custom_recognizer` - Pattern-based recognizer
- `update_confidence_threshold` - Adjust thresholds
- `add_validation_logic` - Add entity validation

## Architecture

### Dual-Language Processing Flow

```
Input Text
    ↓
Language Detection (Hybrid)
    ├─→ Entity Hints Check
    └─→ Statistical Detection
         ↓
    Language Decision
         ↓
    ┌────────────┐
    │   Polish   │ → Presidio PL
    └────────────┘
    ┌────────────┐
    │  English   │ → Presidio EN
    └────────────┘
         ↓
    Entity Merging
         ↓
    Deduplication
         ↓
    Final Result
```

### Service Configuration

```python
# Presidio configuration (app.py)
from presidio_analyzer import AnalyzerEngine, RecognizerRegistry
from presidio_analyzer.nlp_engine import NlpEngineProvider

# Language configuration
LANGUAGES = {
    'pl': {
        'model': 'pl_core_news_md',
        'entities': ['PL_PESEL', 'PL_NIP', 'PL_REGON']
    },
    'en': {
        'model': 'en_core_web_lg',
        'entities': ['EMAIL', 'PHONE_NUMBER', 'CREDIT_CARD', 'US_SSN']
    }
}

# Initialize engines
nlp_configuration = {
    "nlp_engine_name": "spacy",
    "models": [
        {"lang_code": "pl", "model_name": "pl_core_news_md"},
        {"lang_code": "en", "model_name": "en_core_web_lg"}
    ]
}

nlp_engine = NlpEngineProvider(nlp_configuration=nlp_configuration).create_engine()
analyzer = AnalyzerEngine(nlp_engine=nlp_engine, supported_languages=["pl", "en"])
```

## Custom Recognizers

### Polish PESEL Recognizer

```python
from presidio_analyzer import Pattern, PatternRecognizer

class PeselRecognizer(PatternRecognizer):
    """Polish National ID (PESEL) recognizer"""

    PATTERNS = [
        Pattern(
            "PESEL",
            r'\b\d{11}\b',
            0.3  # Base confidence
        )
    ]

    CONTEXT = ["pesel", "numer pesel", "nr pesel"]

    def __init__(self):
        super().__init__(
            supported_entity="PL_PESEL",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            supported_language="pl"
        )

    def validate(self, text: str) -> float:
        """Validate PESEL checksum"""
        if not re.match(r'^\d{11}$', text):
            return 0.0

        weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
        checksum = sum(int(text[i]) * weights[i] for i in range(10))
        checksum = (10 - (checksum % 10)) % 10

        if checksum == int(text[10]):
            return 0.95  # High confidence if valid
        return 0.3  # Low confidence if invalid
```

### Polish NIP Recognizer

```python
class NipRecognizer(PatternRecognizer):
    """Polish Tax ID (NIP) recognizer"""

    PATTERNS = [
        Pattern(
            "NIP",
            r'\b\d{3}-\d{3}-\d{2}-\d{2}\b',
            0.7
        ),
        Pattern(
            "NIP_NO_DASH",
            r'\b\d{10}\b',
            0.3
        )
    ]

    CONTEXT = ["nip", "numer nip", "nr nip", "vat", "tax"]

    def __init__(self):
        super().__init__(
            supported_entity="PL_NIP",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            supported_language="pl"
        )
```

### Credit Card Recognizer (Enhanced)

```python
class EnhancedCreditCardRecognizer(PatternRecognizer):
    """Enhanced credit card recognizer for Polish context"""

    PATTERNS = [
        Pattern(
            "VISA",
            r'\b4\d{3}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
            0.8
        ),
        Pattern(
            "MASTERCARD",
            r'\b5[1-5]\d{2}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
            0.8
        )
    ]

    # Polish context words
    CONTEXT = ["karta", "kredytowa", "płatność", "visa", "mastercard"]

    def __init__(self):
        super().__init__(
            supported_entity="CREDIT_CARD",
            patterns=self.PATTERNS,
            context=self.CONTEXT,
            supported_language="pl"
        )
```

## Language Detection

### Hybrid Algorithm

```python
# Entity hints for language detection
ENTITY_HINTS = {
    'PESEL': 'pl',
    'NIP': 'pl',
    'REGON': 'pl',
    'SSN': 'en',
    'ZIP': 'en'
}

def detect_language(text: str) -> str:
    """Hybrid language detection"""

    # 1. Check entity hints
    for keyword, lang in ENTITY_HINTS.items():
        if keyword.lower() in text.lower():
            return lang

    # 2. Check Polish-specific patterns
    polish_patterns = [
        r'\b\d{11}\b',  # PESEL
        r'\b\d{3}-\d{3}-\d{2}-\d{2}\b',  # NIP
        r'\b\d{9}\b'  # REGON
    ]

    for pattern in polish_patterns:
        if re.search(pattern, text):
            return 'pl'

    # 3. Statistical detection fallback
    try:
        detected = langdetect.detect(text)
        return 'pl' if detected == 'pl' else 'en'
    except:
        return 'en'  # Default to English
```

### Entity Deduplication

```python
def deduplicate_entities(entities_pl, entities_en):
    """Remove duplicate entities from dual detection"""

    merged = []
    seen_positions = set()

    # Combine all entities
    all_entities = entities_pl + entities_en

    for entity in all_entities:
        pos_key = (entity['start'], entity['end'])

        if pos_key not in seen_positions:
            merged.append(entity)
            seen_positions.add(pos_key)
        else:
            # Keep higher confidence
            existing = next(e for e in merged if (e['start'], e['end']) == pos_key)
            if entity['score'] > existing['score']:
                merged.remove(existing)
                merged.append(entity)

    return merged
```

## API Endpoints

### Detection Endpoint

```python
@app.route('/analyze', methods=['POST'])
def analyze():
    """Dual-language PII detection"""

    text = request.json.get('text', '')
    language = detect_language(text)

    # Always run both languages for Polish text
    if language == 'pl':
        # Polish entities
        results_pl = analyzer.analyze(
            text=text,
            language='pl',
            entities=['PL_PESEL', 'PL_NIP', 'PL_REGON']
        )

        # International entities
        results_en = analyzer.analyze(
            text=text,
            language='en',
            entities=['CREDIT_CARD', 'EMAIL', 'PHONE_NUMBER']
        )

        # Merge and deduplicate
        results = deduplicate_entities(results_pl, results_en)
    else:
        # English only
        results = analyzer.analyze(text=text, language='en')

    return jsonify({
        'detected_language': language,
        'entities': [
            {
                'type': r.entity_type,
                'start': r.start,
                'end': r.end,
                'score': r.score
            }
            for r in results
        ]
    })
```

## Configuration

### Entity Configuration

```json
{
  "entities": {
    "PL_PESEL": {
      "enabled": true,
      "confidence_threshold": 0.7,
      "validation": true
    },
    "PL_NIP": {
      "enabled": true,
      "confidence_threshold": 0.6,
      "validation": true
    },
    "CREDIT_CARD": {
      "enabled": true,
      "confidence_threshold": 0.8,
      "validation": false
    },
    "EMAIL": {
      "enabled": true,
      "confidence_threshold": 0.9,
      "validation": false
    }
  },
  "languages": {
    "primary": "pl",
    "secondary": "en"
  }
}
```

## Testing

### Test Cases

```python
# Polish entities
test_cases_pl = [
    ("Mój PESEL to 44051401359", ["PL_PESEL"]),
    ("NIP firmy: 123-456-78-90", ["PL_NIP"]),
    ("Karta kredytowa 4111111111111111", ["CREDIT_CARD"])
]

# English entities
test_cases_en = [
    ("My email is test@example.com", ["EMAIL"]),
    ("Call me at +1-555-123-4567", ["PHONE_NUMBER"]),
    ("SSN: 123-45-6789", ["US_SSN"])
]

# Mixed language
test_cases_mixed = [
    ("PESEL 44051401359 and email test@example.com", ["PL_PESEL", "EMAIL"])
]
```

## Performance Optimization

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_analyze(text: str, language: str):
    """Cache detection results"""
    return analyzer.analyze(text=text, language=language)
```

### Batch Processing

```python
def analyze_batch(texts: List[str]):
    """Process multiple texts efficiently"""

    results = []
    for text in texts:
        language = detect_language(text)
        result = cached_analyze(text, language)
        results.append(result)

    return results
```

## Integration Points

### With Other Agents
- **workflow-business-logic-agent**: PII detection configuration
- **backend-api-agent**: API endpoints
- **frontend-ui-agent**: Entity type UI

### External Systems
- n8n workflow PII_Redactor_v2 node
- Web UI PII configuration panel
- ClickHouse logging

## Quality Metrics

### Detection Quality
- Polish entity accuracy: >95%
- English entity accuracy: >98%
- False positive rate: <2%
- Processing time: <310ms

### Service Health
- Uptime: >99.9%
- Response time: <200ms (p95)
- Memory usage: <500MB
- CPU usage: <20%

## Best Practices

1. **Always validate entities** - Use checksum where available
2. **Configure confidence thresholds** - Balance precision/recall
3. **Test both languages** - Ensure dual detection works
4. **Monitor performance** - Track detection times
5. **Update models regularly** - Keep spaCy models current
6. **Document custom patterns** - Maintain recognizer library
7. **Handle edge cases** - Mixed language, typos

## File Locations

```
services/
├── presidio-pii-api/
│   ├── app.py
│   ├── recognizers/
│   │   ├── pl_recognizers.py
│   │   └── custom_recognizers.py
│   └── requirements.txt
└── language-detector/
    ├── app.py
    └── entity_hints.json
```

---

**Note:** This agent ensures comprehensive PII detection across multiple languages while maintaining high accuracy and performance.