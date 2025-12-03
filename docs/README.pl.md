# Vigil-Code: Technology Expert Agent System v3.1

**Praktyczny framework agentów-ekspertów technologicznych dla Claude Code. System umożliwia tworzenie wyspecjalizowanych asystentów AI z wiedzą domenową, dostępem do dokumentacji i protokołami odtwarzania stanu.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Code](https://img.shields.io/badge/Claude-Code-blue.svg)](https://claude.ai/code)
[![Experts: 14](https://img.shields.io/badge/Experts-14-green.svg)](#eksperci-technologiczni-14)
[![Version: 3.1](https://img.shields.io/badge/Version-3.1-brightgreen.svg)]()

---

## Spis treści

1. [Co to jest i do czego służy](#co-to-jest-i-do-czego-służy)
2. [Szybki start](#szybki-start)
3. [Architektura systemu](#architektura-systemu)
4. [Jak działa routing do ekspertów](#jak-działa-routing-do-ekspertów)
5. [Protokół OODA](#protokół-ooda)
6. [Anatomia eksperta](#anatomia-eksperta)
7. [Tworzenie własnego eksperta](#tworzenie-własnego-eksperta)
8. [Slash commands](#slash-commands)
9. [Skills (kontekst domenowy)](#skills-kontekst-domenowy)
10. [Stan workflow i checkpointy](#stan-workflow-i-checkpointy)
11. [Obsługa błędów](#obsługa-błędów)
12. [Optymalizacja tokenów](#optymalizacja-tokenów)
13. [Adaptacja do własnego projektu](#adaptacja-do-własnego-projektu)
14. [Przykłady użycia](#przykłady-użycia)
15. [Rozwiązywanie problemów](#rozwiązywanie-problemów)

---

## Co to jest i do czego służy

### Problem

Claude Code jest potężnym narzędziem, ale:
- Nie zna specyfiki technologii (n8n, Presidio, ClickHouse)
- Nie pamięta kontekstu między sesjami
- Nie ma struktury dla złożonych, wielokrokowych zadań
- Może zgadywać zamiast sprawdzać dokumentację

### Rozwiązanie

Vigil-Code wprowadza system **ekspertów technologicznych** - wyspecjalizowanych agentów z:

1. **Wiedzą domenową** - każdy ekspert zna swoją technologię (React, Docker, Vitest...)
2. **Dostępem do dokumentacji** - 3-poziomowy model wiedzy (pamięć → docs → community)
3. **Protokołem decyzyjnym** - OODA loop zapewnia przemyślane działania
4. **Stanem workflow** - `progress.json` śledzi postęp wielokrokowych zadań
5. **Odtwarzaniem po błędach** - checkpointy umożliwiają powrót do poprzedniego stanu

### Filozofia

```
STARY MODEL: Agent zna szczegóły projektu (hardcoded knowledge)
NOWY MODEL:  Agent jest ekspertem technologii + czyta kontekst z plików
```

**Korzyści:**
- **Reużywalność** - ci sami eksperci działają w każdym projekcie
- **Łatwość utrzymania** - aktualizujesz wiedzę technologiczną, nie projektową
- **Specjalizacja** - każdy ekspert jest głęboko wyspecjalizowany
- **Skalowalność** - dodajesz nowych ekspertów w minuty

---

## Szybki start

### Instalacja

```bash
# Sklonuj repozytorium
git clone https://github.com/tbartel74/vigil-code.git
cd vigil-code

# Skopiuj do swojego projektu
cp -r .claude /path/to/your/project/

# Opcjonalnie: skopiuj CLAUDE.md jako przykład instrukcji projektowych
cp CLAUDE.md /path/to/your/project/
```

### Struktura po instalacji

```
your-project/
├── .claude/
│   ├── agents/           # 14 ekspertów technologicznych
│   ├── commands/         # 23 komendy slash
│   ├── skills/           # 18 kontekstów domenowych
│   ├── core/             # Protokoły i schematy
│   │   ├── protocols.md  # OODA, checkpointy, błędy
│   │   └── tool-schema.md # Kategorie narzędzi
│   ├── state/            # Stan runtime (gitignore)
│   └── README.md         # Dokumentacja systemu
├── CLAUDE.md             # Twoje instrukcje projektowe
└── [reszta projektu]
```

### Pierwsze użycie

```
/expert Jak utworzyć custom recognizer w Presidio?
```

Claude Code:
1. Parsuje zapytanie
2. Dopasowuje triggery → `presidio-expert`
3. Ładuje wiedzę z `.claude/agents/presidio-expert/AGENT.md`
4. Odpowiada z referencją do dokumentacji

---

## Architektura systemu

```
                         EKSPERCI TECHNOLOGICZNI
                    (każdy z własnym AGENT.md)

    +-----------+  +-----------+  +-----------+  +-----------+
    | n8n       |  | React     |  | Express   |  | Docker    |
    | (sonnet)  |  | (sonnet)  |  | (sonnet)  |  | (sonnet)  |
    +-----+-----+  +-----+-----+  +-----+-----+  +-----+-----+
          |              |              |              |
          +--------------+--------------+--------------+
                                |
                                v
                  +---------------------------+
                  |    Orchestrator (opus)    |
                  |   - routuje zadania       |
                  |   - planuje workflow      |
                  |   - koordynuje ekspertów  |
                  +---------------------------+
                                |
                                v
                  +---------------------------+
                  |     Kontekst Projektu     |
                  |  - CLAUDE.md (instrukcje) |
                  |  - progress.json (stan)   |
                  |  - protocols.md           |
                  +---------------------------+
```

### Komponenty

| Komponent | Lokalizacja | Opis |
|-----------|-------------|------|
| **Agents** | `.claude/agents/*/AGENT.md` | Eksperci z wiedzą technologiczną |
| **Commands** | `.claude/commands/*.md` | Slash commands (`/expert`, `/vg`) |
| **Skills** | `.claude/skills/*/SKILL.md` | Kontekst domenowy projektu |
| **Protocols** | `.claude/core/protocols.md` | OODA, checkpointy, obsługa błędów |
| **Tool Schema** | `.claude/core/tool-schema.md` | Kategorie narzędzi (Core/Extended/Deferred) |
| **State** | `.claude/state/progress.json` | Stan aktualnego workflow |

---

## Eksperci technologiczni (14)

Każdy ekspert to plik `.claude/agents/[nazwa]/AGENT.md` z YAML frontmatter + treścią Markdown.

| Ekspert | Model | Primary Triggers | Specjalizacja |
|---------|-------|------------------|---------------|
| `orchestrator` | **opus** | multi-step, coordinate | Routing, planowanie, koordynacja |
| `n8n-expert` | sonnet | n8n, workflow, Code node | Workflows, webhooks, automatyzacja |
| `react-expert` | sonnet | react, component, hook | Komponenty, state, hooks |
| `express-expert` | sonnet | express, API, middleware | REST APIs, auth, routing |
| `vitest-expert` | sonnet | test, vitest, TDD | Testing, fixtures, mocking |
| `clickhouse-expert` | sonnet | clickhouse, analytics, SQL | Analytics DB, schema |
| `docker-expert` | sonnet | docker, container, compose | Kontenery, networking |
| `presidio-expert` | sonnet | presidio, PII, entity | Detekcja PII, NLP |
| `security-expert` | sonnet | security, OWASP, auth | Podatności, audyty |
| `git-expert` | sonnet | git, commit, branch | Version control, PRs |
| `python-expert` | sonnet | python, flask, fastapi | Python APIs |
| `tailwind-expert` | sonnet | tailwind, CSS, styling | Utility CSS, responsive |
| `kubernetes-expert` | sonnet | kubernetes, k8s, kubectl, pod | Operacje klastrów, deployments, RBAC |
| `helm-expert` | sonnet | helm, chart, values.yaml | Charts, releases, templating |

---

## Jak działa routing do ekspertów

### Krok 1: Parsowanie zapytania

```
Użytkownik: /expert Add health check to Express API
```

### Krok 2: Dopasowanie triggerów

Każdy ekspert ma zdefiniowane triggery w YAML frontmatter:

```yaml
# .claude/agents/express-expert/AGENT.md
triggers:
  primary:    # +10 punktów za każde trafienie
    - "express"
    - "api"
    - "middleware"
  secondary:  # +5 punktów za każde trafienie
    - "endpoint"
    - "route"
    - "backend"
```

**Scoring:**
- "Express" → +10 (primary)
- "API" → +10 (primary)
- **Suma: 20 punktów → express-expert**

### Krok 3: Wybór strategii

| Strategia | Kiedy | Token Budget |
|-----------|-------|--------------|
| **single** | Jeden ekspert wystarczy | 10K |
| **sequential** | Eksperci zależą od wyników poprzedników | 25K |
| **parallel** | Eksperci mogą pracować niezależnie | 30K |

### Krok 4: Invokacja eksperta

```javascript
Task(
  prompt: `Jesteś express-expert, światowej klasy ekspertem Express.js.

           Przeczytaj .claude/agents/express-expert/AGENT.md dla bazy wiedzy.
           Przeczytaj .claude/state/progress.json dla kontekstu workflow.

           Wykonaj: Add health check endpoint

           Postępuj według OODA:
           1. OBSERVE: Zbadaj istniejące routes
           2. ORIENT: Rozważ podejścia
           3. DECIDE: Wybierz akcję z uzasadnieniem
           4. ACT: Wykonaj i zaktualizuj progress.json`,
  subagent_type: "general-purpose",
  model: "sonnet"
)
```

### Wymuszenie konkretnego eksperta

Użyj nawiasów kwadratowych:

```
/expert [docker] Dlaczego port 5678 nie jest dostępny?
/expert [security] Przejrzyj ten flow autentykacji
```

---

## Protokół OODA

Każdy ekspert stosuje pętlę OODA przed każdą akcją:

### OBSERVE (Obserwuj)

```
- Przeczytaj progress.json (stan workflow)
- Zbadaj relevantne pliki
- Zidentyfikuj co istnieje vs czego brakuje
- Zanotuj blokery lub zależności
```

### ORIENT (Oceń)

```
- Rozważ 2+ alternatywne podejścia
- Oceń poziom pewności (HIGH/MEDIUM/LOW)
- Zidentyfikuj potencjalne tryby awarii
- Wybierz narzędzia do użycia
```

### DECIDE (Zdecyduj)

```
- Wybierz konkretną akcję z uzasadnieniem
- Zdefiniuj oczekiwany wynik
- Określ kryteria sukcesu
- Zaplanuj fallback w razie niepowodzenia
```

### ACT (Działaj)

```
- Wykonaj wybrane narzędzie
- Przechwytuj pełny output
- Zaktualizuj progress.json ze stanem OODA
- Oceń wyniki
```

### Przykład OODA w progress.json

```json
{
  "steps": [{
    "expert": "vitest-expert",
    "ooda": {
      "observe": "Brak testów SQL injection w tests/. Sprawdzono rules.config.json - brak kategorii SQL_INJECTION.",
      "orient": "Wymagane TDD. Opcje: 1) Najpierw fixture (zalecane), 2) Najpierw pattern (ryzykowne). Confidence: HIGH dla opcji 1.",
      "decide": "Utworzę fixture w tests/fixtures/malicious/sql-injection.json z payloadami UNION SELECT, OR 1=1, DROP TABLE. Sukces: plik z 5+ payloadami.",
      "act": "Użyję Write tool do utworzenia fixture."
    }
  }]
}
```

### Poziomy pewności

| Poziom | Opis | Akcja |
|--------|------|-------|
| **HIGH** | Podstawowa wiedza, używana codziennie | Odpowiedz bezpośrednio |
| **MEDIUM** | Znam koncept, niepewny szczegółów | Najpierw sprawdź docs |
| **LOW** | Nieznane lub edge case | Zbadaj dokładnie |

---

## Anatomia eksperta

### Struktura YAML Frontmatter

```yaml
---
# === TOŻSAMOŚĆ ===
name: express-expert
version: "3.1"
description: |
  Express.js i Node.js backend expert. Głęboka wiedza o REST API,
  middleware, autentykacji, routingu i best practices bezpieczeństwa.

# === KONFIGURACJA MODELU ===
model: sonnet  # sonnet (szybki) | opus (złożone zadania)
thinking: extended  # extended | standard | minimal

# === KONFIGURACJA NARZĘDZI ===
tools:
  core:      # Zawsze załadowane (~850 tokenów)
    - Read
    - Edit
    - Glob
    - Grep
  extended:  # Ładowane na żądanie (~950 tokenów)
    - Write
    - Bash
  deferred:  # Ładowane przy discovery (~1050 tokenów)
    - WebFetch
    - WebSearch

# === PRZYKŁADY NARZĘDZI ===
tool-examples:
  Read:
    - description: "Przeczytaj plik serwera Express"
      parameters:
        file_path: "services/backend/src/server.ts"
      expected: "Express app z routes, middleware, JWT auth"
  Grep:
    - description: "Znajdź definicje routes"
      parameters:
        pattern: "app\\.(get|post|put|delete)\\("
        path: "services/backend/"
        output_mode: "content"
      expected: "Wszystkie handlery Express routes"

# === ROUTING ===
triggers:
  primary:    # Wysoka pewność (+10 pkt)
    - "express"
    - "api"
    - "middleware"
  secondary:  # Średnia pewność (+5 pkt)
    - "endpoint"
    - "route"
    - "backend"

# === SCHEMAT OUTPUTU ===
output-schema:
  type: object
  required: [status, findings, actions_taken, ooda]
  properties:
    status:
      enum: [success, partial, failed, blocked]
    ooda:
      type: object
---
```

### Struktura treści Markdown

```markdown
# Nazwa Expert Agent

Opis roli eksperta.

## OODA Protocol

Instrukcje dla każdej fazy OODA.

## Core Knowledge (Tier 1)

Fundamentalna wiedza - dostępna natychmiast.
[kod, wzorce, best practices]

## Documentation Sources (Tier 2)

| Źródło | URL | Użycie |
|--------|-----|--------|
| Oficjalne Docs | https://... | Core concepts |

### Kiedy pobierać dokumentację

- [ ] Specyficzne nazwy parametrów
- [ ] Składnia wyrażeń

## Community Sources (Tier 3)

| Źródło | URL | Użycie |
|--------|-----|--------|
| GitHub Issues | https://... | Znane bugi |

## Common Tasks

### Zadanie 1
```code
przykład implementacji
```

## Response Format

[szablon odpowiedzi]

## Critical Rules

- ✅ Zawsze waliduj input
- ❌ Nigdy nie hardcoduj secrets
```

---

## Tworzenie własnego eksperta

### Krok 1: Utwórz katalog

```bash
mkdir -p .claude/agents/terraform-expert
```

### Krok 2: Utwórz AGENT.md

```yaml
---
name: terraform-expert
version: "3.1"
description: |
  Terraform i Infrastructure as Code expert. Głęboka wiedza o providers,
  modules, state management i best practices.

model: sonnet
thinking: extended

tools:
  core: [Read, Edit, Glob, Grep]
  extended: [Write, Bash]
  deferred: [WebFetch, WebSearch]

tool-examples:
  Bash:
    - description: "Planuj zmiany infrastruktury"
      parameters:
        command: "terraform plan -out=tfplan"
      expected: "Szczegółowy plan zmian"

triggers:
  primary:
    - "terraform"
    - "tf"
    - "hcl"
    - "provider"
  secondary:
    - "module"
    - "state"
    - "infrastructure"
    - "iac"

output-schema:
  type: object
  required: [status, findings, actions_taken, ooda]
---

# Terraform Expert Agent

Jesteś światowej klasy ekspertem Terraform i Infrastructure as Code.

## Core Knowledge (Tier 1)

### Provider Configuration
```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}
```

### Module Structure
```hcl
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"

  name = "my-vpc"
  cidr = "10.0.0.0/16"
}
```

## Documentation Sources (Tier 2)

| Źródło | URL |
|--------|-----|
| Terraform Docs | https://developer.hashicorp.com/terraform/docs |

## Critical Rules

- ✅ Zawsze używaj version constraints dla providers
- ❌ Nigdy nie commituj terraform.tfstate do repo
```

> **Uwaga:** Eksperci Kubernetes i Helm są już wbudowani w system. Zobacz `.claude/agents/kubernetes-expert/` i `.claude/agents/helm-expert/` dla pełnych implementacji.

### Krok 3: Ekspert automatycznie się rejestruje

System odczytuje triggery z frontmatter i routuje odpowiednie zapytania.

---

## Slash commands

Komendy slash to skróty do częstych operacji. Definicje w `.claude/commands/*.md`.

### Główne komendy

| Komenda | Opis | Użycie |
|---------|------|--------|
| `/expert [task]` | Routuj do eksperta | `/expert Jak użyć hooks w React?` |
| `/expert [nazwa] [task]` | Wymuś eksperta | `/expert [docker] Napraw networking` |
| `/orchestrate [task]` | Koordynacja wielu ekspertów | `/orchestrate Dodaj feature z testami` |
| `/vg [agent] [task]` | Uniwersalna invokacja | `/vg test-automation Uruchom testy` |

### Tworzenie własnej komendy

```bash
# .claude/commands/deploy-preview.md
```

```yaml
---
name: deploy-preview
description: Deploy preview environment for PR
---

# Deploy Preview

Wykonaj deployment preview dla bieżącego PR.

## Kroki

1. Zbuduj obraz Docker z aktualnego brancha
2. Deploy do preview namespace
3. Zwróć URL preview
```

Użycie:
```
/deploy-preview
```

---

## Skills (kontekst domenowy)

Skills to rozszerzenia dostarczające kontekst specyficzny dla projektu.

### Różnica: Expert vs Skill

| Aspekt | Expert | Skill |
|--------|--------|-------|
| Wiedza | Technologia (React, Docker) | Projekt (Twoje API, Twoja struktura) |
| Reużywalność | Uniwersalna | Specyficzna dla projektu |
| Lokalizacja | `.claude/agents/` | `.claude/skills/` |
| Invokacja | Automatyczna (triggery) | Manualna (Skill tool) |

### Struktura skill

```yaml
# .claude/skills/my-api-context/SKILL.md
---
name: my-api-context
description: Kontekst API mojego projektu
version: 1.0.0
allowed-tools: [Read, Glob, Grep]
---

# My API Context

## Struktura projektu

src/
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Database models
└── middleware/      # Express middleware

## Konwencje

- Controllers: `*.controller.ts`
- Services: `*.service.ts`

## Jak dodać endpoint

1. Utwórz controller
2. Utwórz service
3. Dodaj route
4. Dodaj test
```

---

## Stan workflow i checkpointy

### progress.json

Wielokrokowe zadania śledzą stan w `.claude/state/progress.json`:

```json
{
  "schema_version": "3.1",
  "workflow_id": "wf-20251202-abc123",
  "created_at": "2025-12-02T10:00:00Z",

  "task": {
    "original_request": "Dodaj detekcję SQL injection z testami",
    "summary": "TDD workflow: test → pattern → verify",
    "complexity": "medium"
  },

  "planning": {
    "strategy": "sequential",
    "thinking": "Wymagany TDD. Najpierw test, potem implementacja.",
    "risks": ["Pattern może powodować false positives"]
  },

  "classification": {
    "primary_expert": "vitest-expert",
    "supporting_experts": ["n8n-expert"],
    "execution_order": ["vitest-expert", "n8n-expert", "vitest-expert"]
  },

  "token_budget": {
    "allocated": 25000,
    "used": 8500,
    "remaining": 16500
  },

  "status": "in_progress",
  "current_step": 2,
  "total_steps": 3,

  "steps": [
    {
      "id": 1,
      "expert": "vitest-expert",
      "action": "create_fixture",
      "status": "completed",
      "ooda": {
        "observe": "Brak testów SQL injection",
        "orient": "TDD: najpierw fixture",
        "decide": "Utworzę fixture z 5 payloadami. Confidence: HIGH",
        "act": "Write fixture"
      },
      "artifacts": ["tests/fixtures/sql-injection.json"]
    }
  ],

  "checkpoints": [
    {
      "id": "cp-001",
      "step_id": 1,
      "type": "step_complete",
      "files_modified": ["tests/fixtures/sql-injection.json"],
      "restorable": true,
      "restore_command": "git checkout abc123 -- tests/fixtures/sql-injection.json"
    }
  ],

  "clean_state": {
    "all_tests_pass": false,
    "ready_to_merge": false
  }
}
```

### Recovery

```bash
# Przywróć plik z checkpointu
git checkout abc123 -- path/to/file.ts

# Pełny rollback
git reset --hard abc123
```

---

## Obsługa błędów

### Taksonomia błędów (19 kodów)

#### Recoverable (E0xx) - Retry z backoff

| Kod | Błąd | Strategia |
|-----|------|-----------|
| E001 | Network timeout | Exponential backoff (5s, 15s, 45s) |
| E002 | Rate limit | Wait + retry |
| E003 | File lock | Wait 5s, retry |

#### Soft Errors (E1xx) - Alternatywne podejście

| Kod | Błąd | Alternatywa |
|-----|------|-------------|
| E101 | File not found | Szukaj z Glob |
| E102 | Pattern not found | Rozszerz wyszukiwanie |
| E103 | WebFetch 404 | Spróbuj WebSearch |

#### Hard Errors (E2xx) - Eskaluj do użytkownika

| Kod | Błąd | Akcja |
|-----|------|-------|
| E201 | Permission denied | Halt + raport |
| E202 | Out of tokens | Zapisz stan, stop |
| E203 | Conflicting edits | Wymagaj rozwiązania |

#### Validation Errors (E3xx) - Napraw i retry

| Kod | Błąd | Akcja |
|-----|------|-------|
| E301 | Test failure | Analizuj + napraw |
| E302 | Lint failure | Auto-fix |
| E303 | Type error | Napraw typy |

---

## Optymalizacja tokenów

### Kategorie narzędzi

| Kategoria | Narzędzia | Tokeny | Ładowanie |
|-----------|-----------|--------|-----------|
| **Core** | Read, Edit, Glob, Grep | ~850 | Zawsze |
| **Extended** | Write, Bash, Task | ~950 | Na żądanie |
| **Deferred** | WebFetch, WebSearch | ~1050 | Discovery |

### Oszczędności

| Scenariusz | Tradycyjne | v3.1 | Oszczędność |
|------------|------------|------|-------------|
| Prosta edycja | 2850 | 850 | **70%** |
| Kod + test | 2850 | 1800 | **37%** |

### Batch operations

```bash
# ZŁE: 10 wywołań Read (~5000 tokenów)

# DOBRE: 1 wywołanie Bash (~800 tokenów)
for f in $(find src -name "*.ts" | head -10); do
  echo "=== $f ==="
  grep -n "pattern" "$f" | head -5
done
```

---

## Adaptacja do własnego projektu

### Krok 1: Skopiuj .claude

```bash
cp -r vigil-code/.claude /your/project/
```

### Krok 2: Usuń niepotrzebnych ekspertów

```bash
# Jeśli nie używasz n8n
rm -rf .claude/agents/n8n-expert
```

### Krok 3: Dodaj własnych ekspertów

Dla technologii specyficznych dla Twojego projektu.

### Krok 4: Dostosuj skills

```bash
# Usuń Vigil Guard skills
rm -rf .claude/skills/vg-*

# Dodaj własne
mkdir .claude/skills/my-project-context
```

### Krok 5: Utwórz CLAUDE.md

```markdown
# CLAUDE.md

Instrukcje dla Claude Code w tym projekcie.

## Struktura projektu
[opisz swoją strukturę]

## Konwencje
[opisz konwencje kodu]

## Ważne pliki
[wymień kluczowe pliki]
```

### Krok 6: Zaktualizuj .gitignore

```gitignore
# Agent state (runtime)
.claude/state/
.claude/settings.local.json
```

---

## Przykłady użycia

### Pytanie technologiczne

```
/expert Jak użyć useCallback w React?

react-expert (model: sonnet)
useCallback memorizuje funkcję callback...
Source: https://react.dev/reference/react/useCallback
```

### Implementacja z TDD

```
/expert Dodaj walidację email z testami

Task: Dodaj walidację email z testami
Strategy: sequential

Step 1/3: vitest-expert
   - Action: create_test
   - Completed (1.5s)

Step 2/3: express-expert
   - Action: create_middleware
   - Completed (1.2s)

Step 3/3: vitest-expert
   - Action: run_tests
   - Result: 5 passed

Task Completed in 4.7s
Clean State: Tests passing
```

### Parallel execution

```
/expert Stwórz endpoint API i komponent React

Strategy: parallel

express-expert (sonnet) -> Completed
react-expert (sonnet) -> Completed

Artifacts:
   - src/routes/users.ts
   - src/components/UserList.tsx
```

### Debug z dokumentacją

```
/expert [docker] Container nie może połączyć się z bazą

docker-expert (model: sonnet)

OBSERVE: Sprawdzam docker-compose.yml

ORIENT: Możliwe przyczyny:
1. Containers w różnych networks
2. Zły hostname

Fetching docs... (docker networking)
Source: https://docs.docker.com/network/

Solution:
Użyj nazwy service jako hostname, nie localhost.

Status: success
```

---

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| Zły ekspert wybrany | Użyj `[expert-name]` w nawiasach |
| Ekspert nie zna projektu | Zaktualizuj CLAUDE.md |
| Workflow zawiesza się | Sprawdź `.claude/state/progress.json` |
| Ekspert daje przestarzałe info | Poproś o "verify in documentation" |
| Za wolno | Użyj konkretnego eksperta zamiast orchestratora |
| Limit tokenów | Użyj batch operations |

### Debug workflow

```bash
# Sprawdź stan workflow
cat .claude/state/progress.json | jq '.status, .current_step'

# Sprawdź błędy
cat .claude/state/progress.json | jq '.errors'
```

### Reset workflow

```bash
rm .claude/state/progress.json
```

---

## Pliki referencyjne

| Plik | Opis |
|------|------|
| [.claude/README.md](../.claude/README.md) | Dokumentacja systemu agentów |
| [.claude/core/protocols.md](../.claude/core/protocols.md) | Wszystkie 13 protokołów |
| [.claude/core/tool-schema.md](../.claude/core/tool-schema.md) | Kategorie narzędzi |

---

## Licencja

MIT License - Zobacz plik [LICENSE](../LICENSE).

Copyright (c) 2025 Tomasz Bartel

---

**Status:** Production Ready
**Wersja:** 3.1.0
**Ostatnia aktualizacja:** 2025-12-02
