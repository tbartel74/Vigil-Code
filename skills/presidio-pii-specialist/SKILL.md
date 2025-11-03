# Presidio PII Specialist

## Overview
Microsoft Presidio PII detection API in Vigil Guard - Python Flask service providing dual-language PII detection (Polish + English) with spaCy NER models, entity deduplication, and graceful fallback.

## When to Use This Skill
- Managing Presidio Flask API (services/presidio-pii-api/)
- Dual-language PII detection configuration
- Working with spaCy models (en_core_web_lg, pl_core_news_lg)
- Entity deduplication logic
- Performance optimization (<310ms target)
- Custom recognizers (PESEL, NIP, REGON)

## Tech Stack
- Python 3.11, Flask 3.0.0
- presidio-analyzer 2.2.354, presidio-anonymizer 2.2.354
- spaCy 3.7.2
- Models: en_core_web_lg (560MB), pl_core_news_lg (470MB)

## Dual-Language Architecture

### Request Flow
```yaml
1. n8n sends: POST /analyze {"text": "...", "language": "pl", "entities": [...]}
2. Load spaCy model: pl → pl_core_news_lg, en → en_core_web_lg
3. Run analyzer: spaCy NER + custom recognizers + patterns
4. Return entities with scores
```

### Parallel Detection (v1.6.10+)
```javascript
// From n8n PII_Redactor_v2 node
const [plResults, enResults] = await Promise.all([
  axios.post('http://vigil-presidio-pii:5001/analyze', {text, language: 'pl', entities: ['PERSON', 'PL_PESEL']}),
  axios.post('http://vigil-presidio-pii:5001/analyze', {text, language: 'en', entities: ['EMAIL', 'CREDIT_CARD']})
]);

const allEntities = deduplicateEntities([...plResults.data.entities, ...enResults.data.entities]);
```

## Common Tasks

### Task 1: Add Custom Recognizer

**Polish Passport Example:**
```python
# custom_recognizers/polish_passport.py
from presidio_analyzer import Pattern, PatternRecognizer

class PolishPassportRecognizer(PatternRecognizer):
    PATTERNS = [Pattern(name="polish_passport", regex=r"\b[A-Z]{2}\d{7}\b", score=0.85)]
    CONTEXT = ["paszport", "passport", "dokument"]

    def __init__(self):
        super().__init__(supported_entity="PL_PASSPORT", patterns=self.PATTERNS, context=self.CONTEXT)

    def validate_result(self, pattern_text: str) -> bool:
        return len(pattern_text) == 9 and pattern_text[:2].isalpha() and pattern_text[2:].isdigit()
```

**Register in app.py:**
```python
from custom_recognizers.polish_passport import PolishPassportRecognizer
polish_passport_recognizer = PolishPassportRecognizer()
analyzer_pl.registry.add_recognizer(polish_passport_recognizer)
```

### Task 2: Entity Deduplication

```python
def deduplicate_entities(entities: List[dict]) -> List[dict]:
    """Remove overlapping entities, keep highest score"""
    sorted_entities = sorted(entities, key=lambda e: (e['start'], -e['score']))
    deduplicated = []

    for entity in sorted_entities:
        overlaps = any(
            (entity['start'] >= ex['start'] and entity['start'] < ex['end']) or
            (entity['end'] > ex['start'] and entity['end'] <= ex['end'])
            for ex in deduplicated
        )
        if not overlaps:
            deduplicated.append(entity)

    return deduplicated
```

### Task 3: Performance Optimization

```python
# Disable unnecessary spaCy components (faster loading)
nlp_en = spacy.load("en_core_web_lg", disable=["parser", "lemmatizer"])

# Lazy loading
_analyzer_en = None
def get_analyzer(language: str):
    global _analyzer_en
    if language == "en" and _analyzer_en is None:
        _analyzer_en = AnalyzerEngine(nlp_engine=SpacyNlpEngine(...))
    return _analyzer_en
```

### Task 4: Custom Recognizers Reference

**PESEL (Polish National ID):**
```python
# 11 digits: YYMMDDXXXXX with checksum
def validate_pesel(pesel: str) -> bool:
    weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
    checksum = sum(int(pesel[i]) * weights[i] for i in range(10)) % 10
    return int(pesel[10]) == (10 - checksum) % 10
```

**NIP (Polish Tax ID):**
```python
# 10 digits: XXX-XXX-XX-XX with checksum
def validate_nip(nip: str) -> bool:
    nip = nip.replace('-', '')
    weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
    checksum = sum(int(nip[i]) * weights[i] for i in range(9)) % 11
    return int(nip[9]) == checksum
```

## Health Check

```python
@app.route('/health', methods=['GET'])
def health():
    try:
        analyzer_en = get_analyzer('en')
        analyzer_pl = get_analyzer('pl')
        return jsonify({'status': 'healthy', 'models_loaded': True}), 200
    except Exception as e:
        return jsonify({'status': 'degraded', 'error': str(e)}), 503
```

## Integration Points

### With workflow-json-architect:
- Update PII_Redactor_v2 node entities list
- Test dual-language detection

### With test-fixture-generator:
- Generate PII test fixtures
- Verify detection accuracy

## Troubleshooting

**Model fails to load:**
```bash
docker exec vigil-presidio-pii python -m spacy download en_core_web_lg
docker-compose build presidio-pii-api && docker-compose up -d
```

**Low detection rate:**
```python
# Lower score threshold
results = analyzer.analyze(text, entities, language, score_threshold=0.3)
```

## Quick Reference

```bash
# Test API
curl -X POST http://localhost:5001/analyze -H "Content-Type: application/json" \
  -d '{"text":"My email is test@example.com","language":"en","entities":["EMAIL"]}'

# Health check
curl http://localhost:5001/health

# Rebuild
docker-compose build presidio-pii-api && docker-compose up -d
```

---
**Performance:** <310ms average, 96% detection accuracy
**Models:** 1GB+ (en_core_web_lg + pl_core_news_lg)
