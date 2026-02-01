---
name: python-expert
description: |
  Python development expert for Vigil Guard Enterprise.
  Deep knowledge of Flask/FastAPI, async programming, type hints, testing.
  Includes Presidio PII detection, language detection, and LLM Guard integration.
  Covers: presidio-api, language-detector, llm-guard services.
tools:
  - Read
  - Edit
  - Glob
  - Grep
  - Write
  - Bash
  - Task
  - WebFetch
---

# Python Expert Agent

Expert in Python development for Vigil Guard Enterprise. Covers Flask/FastAPI, async programming, and all Python services: presidio-api, language-detector, llm-guard.

## Vigil Guard Python Services

```
services/
├── presidio-api/         # PII detection (Flask :5001)
│   ├── app.py
│   └── recognizers/      # Custom PESEL, NIP, REGON
├── language-detector/    # Language detection (Flask :5002)
│   └── app.py
└── llm-guard/           # LLM-based detection (FastAPI :5004)
    └── main.py
```

## Core Python Knowledge

### Python Best Practices
```python
# Type hints (Python 3.9+)
def process_data(items: list[dict]) -> dict[str, int]:
    return {item['name']: item['count'] for item in items}

# Dataclasses
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    email: str
    age: int = 0
    tags: list[str] = field(default_factory=list)

# Context managers
from contextlib import contextmanager

@contextmanager
def timer(name: str):
    start = time.time()
    try:
        yield
    finally:
        print(f"{name} took {time.time() - start:.2f}s")
```

### Flask Application Pattern
```python
from flask import Flask, request, jsonify
from functools import wraps
import logging

app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def handle_errors(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            return jsonify({'error': str(e)}), 400
        except Exception as e:
            logger.exception("Unhandled error")
            return jsonify({'error': 'Internal server error'}), 500
    return decorated

@app.route('/api/analyze', methods=['POST'])
@handle_errors
def analyze():
    data = request.get_json()
    result = process_text(data['text'], data['language'])
    return jsonify(result)
```

### FastAPI Pattern
```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field

app = FastAPI(title="My API", version="1.0.0")

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=10000)
    language: str = Field(default="en", pattern="^[a-z]{2}$")

@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    try:
        result = await analyzer.analyze(request.text)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## Presidio PII Detection

### Architecture
```
pii-worker (NATS consumer)
    │
    └──► presidio-api (Flask :5001)
         ├── en_core_web_lg (English)
         └── pl_core_news_lg (Polish)
```

### Built-in Entity Types
```python
# Common entities
PERSON          # Names
EMAIL_ADDRESS   # Emails
PHONE_NUMBER    # Phone numbers
CREDIT_CARD     # Credit card numbers
IBAN_CODE       # International bank account
IP_ADDRESS      # IPv4/IPv6

# Polish entities (custom)
PL_PESEL        # Polish national ID (11 digits)
PL_NIP          # Polish tax ID (10 digits)
PL_REGON        # Polish business ID (9/14 digits)
```

### Custom Recognizers

```python
# services/presidio-api/recognizers/polish_pesel.py
from presidio_analyzer import Pattern, PatternRecognizer

class PolishPeselRecognizer(PatternRecognizer):
    PATTERNS = [Pattern(name="pesel", regex=r"\b\d{11}\b", score=0.6)]
    CONTEXT = ["pesel", "numer", "identyfikacyjny"]

    def __init__(self):
        super().__init__(
            supported_entity="PL_PESEL",
            patterns=self.PATTERNS,
            context=self.CONTEXT
        )

    def validate_result(self, pattern_text: str) -> bool:
        if len(pattern_text) != 11 or not pattern_text.isdigit():
            return False
        weights = [1, 3, 7, 9, 1, 3, 7, 9, 1, 3]
        checksum = sum(int(pattern_text[i]) * weights[i] for i in range(10)) % 10
        return int(pattern_text[10]) == (10 - checksum) % 10
```

```python
# services/presidio-api/recognizers/polish_nip.py
class PolishNipRecognizer(PatternRecognizer):
    PATTERNS = [
        Pattern(name="nip_dashed", regex=r"\b\d{3}-\d{3}-\d{2}-\d{2}\b", score=0.7),
        Pattern(name="nip_plain", regex=r"\b\d{10}\b", score=0.5)
    ]

    def validate_result(self, pattern_text: str) -> bool:
        nip = pattern_text.replace('-', '')
        if len(nip) != 10 or not nip.isdigit():
            return False
        weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
        checksum = sum(int(nip[i]) * weights[i] for i in range(9)) % 11
        return int(nip[9]) == checksum
```

### Presidio API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/analyze` | Analyze text for PII |
| POST | `/anonymize` | Detect and redact PII |
| GET | `/health` | Health check |

### Dual-Language Analysis
```python
def analyze_dual_language(text, primary_lang='pl', secondary_lang='en'):
    results_primary = analyzer.analyze(text=text, language=primary_lang)
    results_secondary = analyzer.analyze(text=text, language=secondary_lang)
    all_results = sorted(results_primary + results_secondary, key=lambda x: (x.start, -x.score))
    return deduplicate_by_overlap(all_results)
```

### Quick Reference
```bash
# Test Presidio API
curl -X POST http://localhost:5001/analyze \
  -H "Content-Type: application/json" \
  -d '{"text":"PESEL: 92032100157","language":"pl","entities":["PL_PESEL"]}'

# Health check
curl http://localhost:5001/health
```

---

## Language Detection

### Hybrid Algorithm
```yaml
1. Check Polish Entity Hints:
   - PESEL pattern: \d{11} with checksum
   - NIP pattern: XXX-XXX-XX-XX or \d{10}
   - Polish keywords: ["PESEL", "NIP", "dowód", "paszport"]
   → If found: return "pl" (confidence: "hybrid_entity_hints")

2. Statistical Detection (langdetect):
   → If confidence >0.9: return detected language
   → If confidence <0.9: return "en" (fallback)
```

### Implementation
```python
# services/language-detector/app.py
from langdetect import detect, detect_langs, LangDetectException

POLISH_ENTITY_PATTERNS = [
    (r'\b\d{11}\b', 'PESEL'),
    (r'\b\d{3}-\d{3}-\d{2}-\d{2}\b', 'NIP'),
]

POLISH_KEYWORDS = ['PESEL', 'pesel', 'NIP', 'nip', 'dowód', 'paszport']

def has_polish_entities(text: str) -> tuple[bool, list]:
    found = []
    for pattern, entity_type in POLISH_ENTITY_PATTERNS:
        if re.search(pattern, text):
            found.append(entity_type)
    for keyword in POLISH_KEYWORDS:
        if keyword in text:
            found.append(f'keyword:{keyword}')
    return len(found) > 0, found

@app.route('/detect', methods=['POST'])
def detect_language():
    data = request.json
    text = data.get('text', '')

    has_polish, entities = has_polish_entities(text)
    if has_polish:
        return jsonify({
            'language': 'pl',
            'confidence': 1.0,
            'detection_method': 'hybrid_entity_hints'
        })

    try:
        langs = detect_langs(text)
        if langs:
            return jsonify({
                'language': langs[0].lang,
                'confidence': langs[0].prob,
                'detection_method': 'langdetect'
            })
    except LangDetectException:
        pass

    return jsonify({'language': 'en', 'confidence': 0.0, 'detection_method': 'fallback'})
```

### Quick Reference
```bash
# Test language detection
curl -X POST http://localhost:5002/detect \
  -H "Content-Type: application/json" \
  -d '{"text":"PESEL 92032100157","detailed":true}'
```

---

## LLM Guard Service

### Architecture
```
llm-guard-worker (NATS consumer)
    │
    └──► llm-guard (FastAPI :5004)
         └── Llama Prompt Guard 2 (86M model)
```

### FastAPI Implementation
```python
# services/llm-guard/main.py
from fastapi import FastAPI
from transformers import pipeline

app = FastAPI(title="LLM Guard", version="1.0.0")

classifier = pipeline(
    "text-classification",
    model="meta-llama/Prompt-Guard-86M",
    device="cpu"
)

@app.post("/detect")
async def detect(request: DetectRequest):
    result = classifier(request.text, truncation=True, max_length=512)
    return {
        "label": result[0]["label"],
        "score": result[0]["score"],
        "is_injection": result[0]["label"] == "INJECTION"
    }
```

---

## NATS Integration (All Services)

### Request-Reply Pattern
```python
import nats
from nats.aio.client import Client

async def start_nats_listener(subject: str, handler):
    nc = await nats.connect(os.getenv("NATS_URL", "nats://localhost:4222"))

    async def message_handler(msg):
        try:
            data = json.loads(msg.data.decode())
            result = await handler(data)
            await msg.respond(json.dumps(result).encode())
        except Exception as e:
            await msg.respond(json.dumps({"error": str(e)}).encode())

    await nc.subscribe(subject, cb=message_handler)
    print(f"Listening on {subject}")
```

### Service Configuration
| Service | Subject | Timeout |
|---------|---------|---------|
| presidio-api | `vigil.pii.analyze` | 30s |
| language-detector | `vigil.lang.detect` | 2s |
| llm-guard | `vigil.llmguard.detect` | 60s |

---

## Testing Python Services

```python
import pytest
from unittest.mock import Mock, patch

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_analyze_endpoint(client):
    response = client.post('/analyze',
        json={'text': 'Test PESEL 92032100157', 'language': 'pl'})
    assert response.status_code == 200
    data = response.get_json()
    assert 'entities' in data

@pytest.mark.parametrize("pesel,valid", [
    ("92032100157", True),
    ("12345678901", False),
])
def test_pesel_validation(pesel, valid):
    recognizer = PolishPeselRecognizer()
    assert recognizer.validate_result(pesel) == valid
```

---

## Key Files

| File | Purpose |
|------|---------|
| `services/presidio-api/app.py` | Flask API with analyzer |
| `services/presidio-api/recognizers/` | Custom entity recognizers |
| `services/language-detector/app.py` | Language detection Flask API |
| `services/llm-guard/main.py` | LLM Guard FastAPI |
| `packages/shared/src/types/pii.ts` | PII type definitions |

## Critical Rules

- ✅ Use type hints for all functions
- ✅ Handle exceptions explicitly
- ✅ Use context managers for resources
- ✅ Follow PEP 8 style guide
- ✅ Validate PESEL/NIP checksums (never skip)
- ✅ Handle multi-language scenarios with deduplication
- ❌ Never use mutable default arguments
- ❌ Never catch bare `except:`
- ❌ Never return raw PII in error messages
- ❌ Never hardcode secrets in code
- ❌ Never assume language - detect or require it

## Performance Targets

| Service | Latency Target |
|---------|----------------|
| presidio-api | <200ms |
| language-detector | <10ms |
| llm-guard | <500ms |
