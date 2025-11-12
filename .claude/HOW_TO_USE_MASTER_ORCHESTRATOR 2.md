# Jak Używać Master Orchestrator - Przewodnik Praktyczny

## 🚀 Szybki Start

### Podstawowa Zasada

**Master Orchestrator jest ZAWSZE aktywny** - nie musisz go explicite wywoływać. System automatycznie analizuje każde Twoje zadanie i kieruje je do odpowiednich agentów.

## 📋 Sposób Użycia

### 1. Naturalne Polecenia (Rekomendowane)

Po prostu opisz, co chcesz zrobić naturalnym językiem:

```
User: "Dodaj detekcję dla SQL injection z hex encoding"
User: "Sprawdź bezpieczeństwo aplikacji"
User: "Napraw false positive dla UUID"
User: "Zdeployuj nową wersję backendu"
```

Master Orchestrator automatycznie:
- ✅ Rozpozna typ zadania
- ✅ Wybierze odpowiednich agentów
- ✅ Wykona właściwy workflow
- ✅ Zwróci skoordynowaną odpowiedź

### 2. Explicite Wywołanie Workflow (Opcjonalne)

Jeśli chcesz konkretny workflow, użyj jego nazwy:

```
User: "Uruchom workflow PATTERN_ADDITION dla XSS"
User: "Wykonaj SECURITY_AUDIT"
User: "Zastosuj workflow FALSE_POSITIVE_FIX"
```

### 3. Bezpośrednie Wskazanie Agenta (Rzadkie)

Tylko gdy potrzebujesz konkretnego agenta:

```
User: "Użyj test-automation-agent do stworzenia fixture"
User: "Backend-api-agent: dodaj endpoint /api/stats"
```

## 🎯 Przykłady Użycia

### Przykład 1: Dodawanie Nowego Wzorca Detekcji

```
User: "Dodaj detekcję dla base64 encoded SQL injection"
```

**Co się dzieje automatycznie:**
1. Master rozpoznaje: zadanie typu PATTERN_ADDITION
2. Aktywuje workflow:
   - `test-automation-agent` → tworzy test fixture
   - `test-automation-agent` → uruchamia test (FAIL - TDD)
   - `workflow-business-logic-agent` → prowadzi przez dodanie wzorca
   - `test-automation-agent` → weryfikuje test (PASS)
   - `documentation-agent` → aktualizuje dokumentację (opcjonalnie)

**Otrzymujesz:**
- Kompletne instrukcje krok po kroku
- Utworzone pliki testów
- Wskazówki konfiguracji
- Podsumowanie zmian

### Przykład 2: Audyt Bezpieczeństwa

```
User: "Przeprowadź kompleksowy audyt bezpieczeństwa"
```

**Co się dzieje automatycznie:**
1. Master rozpoznaje: zadanie typu SECURITY_AUDIT
2. Wykonuje RÓWNOLEGLE:
   - npm audit
   - Skanowanie secretów
   - Sprawdzenie ReDoS
   - Przegląd autentykacji
   - Analiza XSS
3. Synteza wyników
4. Priorytetyzacja problemów

**Otrzymujesz:**
- Raport bezpieczeństwa z priorytetami
- Plan naprawczy
- Konkretne komendy do wykonania
- Czas: 2 minuty (vs 5 minut sekwencyjnie)

### Przykład 3: Dodanie Nowego Typu PII

```
User: "Dodaj detekcję polskiego numeru REGON"
```

**Co się dzieje automatycznie:**
1. Master rozpoznaje: zadanie typu PII_ENTITY_ADDITION
2. Koordynuje agentów:
   - `pii-detection-agent` → tworzy recognizer
   - `pii-detection-agent` → dodaje language hints
   - `backend-api-agent` → aktualizuje API
   - `frontend-ui-agent` → dodaje checkbox w UI
   - `infrastructure-deployment-agent` → rebuilduje Presidio
   - `test-automation-agent` → tworzy i uruchamia testy

**Otrzymujesz:**
- Kod recognizera
- Instrukcje deploymentu
- Testy weryfikacyjne
- Status wszystkich zmian

### Przykład 4: Naprawa False Positive

```
User: "Vigil blokuje legalne UUID w dokumentacji, napraw to"
```

**Co się dzieje automatycznie:**
1. Master rozpoznaje: zadanie typu FALSE_POSITIVE_FIX
2. Wykonuje workflow:
   - `test-automation-agent` → tworzy test dla false positive
   - `data-analytics-agent` → analizuje logi detekcji
   - `workflow-business-logic-agent` → identyfikuje problematyczny wzorzec
   - `workflow-business-logic-agent` → proponuje poprawkę
   - `test-automation-agent` → weryfikuje poprawkę

**Otrzymujesz:**
- Zidentyfikowany problematyczny wzorzec
- Propozycja poprawki
- Instrukcje implementacji
- Testy weryfikacyjne

## 🔧 Zaawansowane Użycie

### Wykonywanie Równoległe

Gdy masz wiele niezależnych zadań:

```
User: "Jednocześnie: sprawdź logi, uruchom testy i zrób backup"
```

Master wykona te zadania RÓWNOLEGLE używając różnych agentów.

### Workflow Wieloetapowy

```
User: "Najpierw sprawdź bezpieczeństwo, potem napraw krytyczne problemy, na końcu zdeployuj"
```

Master:
1. Wykona SECURITY_AUDIT
2. Poczeka na wyniki
3. Zastosuje poprawki przez odpowiednich agentów
4. Wykona SERVICE_DEPLOYMENT

### Zadania z Kontekstem

```
User: "Dodaj pattern dla SQL injection, ale upewnij się że nie złamie to istniejących testów dla dokumentacji technicznej"
```

Master uwzględni kontekst i:
- Doda pattern z test-automation-agent
- Sprawdzi false positive z workflow-business-logic-agent
- Zweryfikuje wszystkie testy

## 📊 Dostępne Workflow Templates

| Nazwa | Trigger | Opis |
|-------|---------|------|
| **PATTERN_ADDITION** | "dodaj detekcję", "wykrywaj" | Dodawanie nowych wzorców TDD |
| **PII_ENTITY_ADDITION** | "dodaj PII", "wykrywaj [entity]" | Dodawanie typów PII |
| **SECURITY_AUDIT** | "audyt", "sprawdź bezpieczeństwo" | Kompleksowy audyt |
| **FALSE_POSITIVE_FIX** | "false positive", "błędnie blokuje" | Naprawa nadmiernej detekcji |
| **SERVICE_DEPLOYMENT** | "deploy", "restart", "uruchom" | Deployment serwisów |
| **MORNING_CHECK** | "status", "sprawdź stan" | Codzienny health check |
| **API_ENDPOINT_ADDITION** | "dodaj endpoint", "nowe API" | Dodawanie API |

## 🎮 Interaktywny Tryb

Master może zadawać pytania gdy potrzebuje więcej informacji:

```
User: "Dodaj nowy pattern"
Master: "Dla jakiego typu ataku chcesz dodać pattern?"
User: "XSS w atrybutach HTML"
Master: [Wykonuje PATTERN_ADDITION dla XSS]
```

## ⚙️ Konfiguracja Master Orchestrator

### Ustawienia Domyślne

Master Orchestrator ma domyślne ustawienia w:
`.claude/master-orchestrator/SKILL.md`

### Priorytet Agentów

Gdy konflikt, Master używa priorytetu:
1. security-compliance-agent (bezpieczeństwo)
2. workflow-business-logic-agent (logika biznesowa)
3. test-automation-agent (testy)
4. Pozostałe agenty

### Tryb Debug

Aby zobaczyć proces decyzyjny:

```
User: "DEBUG: Dodaj pattern SQL injection"
```

Master pokaże:
- Analiza zadania
- Wybór agentów
- Kolejność wykonania
- Stan workflow

## 🚨 Kiedy Master NIE Jest Potrzebny

### Proste, Jednoagentowe Zadania

Dla bardzo prostych zadań możesz bezpośrednio:

```
User: "docker ps"  # Bezpośrednia komenda
User: "Pokaż plik README.md"  # Proste odczytanie
```

### Szybkie Sprawdzenia

```
User: "Jaka jest aktualna wersja?"
User: "Ile testów przechodzi?"
```

Te pytania są zbyt proste dla orkiestracji.

## 📈 Monitorowanie Skuteczności

### Metryki Master Orchestrator

Master śledzi:
- Accuracy: Czy wybrał właściwych agentów
- Completion: Czy workflow się zakończył
- Time: Jak szybko wykonał zadanie
- Satisfaction: Czy rezultat był pomocny

### Feedback

Jeśli Master źle zrozumiał zadanie:

```
User: "Nie to miałem na myśli, chodziło mi o [wyjaśnienie]"
```

Master się uczy i poprawia routing.

## 💡 Najlepsze Praktyki

### DO:
- ✅ Używaj naturalnego języka
- ✅ Opisuj cel, nie implementację
- ✅ Podawaj kontekst gdy istotny
- ✅ Pozwól Masterowi koordynować

### DON'T:
- ❌ Nie wymuszaj konkretnych agentów bez potrzeby
- ❌ Nie przerywaj workflow w trakcie
- ❌ Nie ignoruj sugestii Mastera
- ❌ Nie komplikuj prostych zadań

## 🆘 Troubleshooting

### Problem: Master nie rozpoznaje zadania

**Rozwiązanie:**
```
User: "Chcę [wyjaśnij dokładniej co chcesz osiągnąć]"
```

### Problem: Wybrał złych agentów

**Rozwiązanie:**
```
User: "Użyj workflow PATTERN_ADDITION zamiast tego"
```

### Problem: Workflow się zawiesił

**Rozwiązanie:**
```
User: "ABORT workflow i zacznij od nowa"
```

## 📚 Przykłady Zaawansowane

### Kompleksowa Aktualizacja Systemu

```
User: "Przygotuj system do wersji 2.0: sprawdź kompatybilność,
       zaktualizuj dependencies, uruchom testy, napraw problemy,
       zaktualizuj dokumentację i przygotuj release notes"
```

Master skoordynuje:
1. `security-compliance-agent` → sprawdzenie dependencies
2. `infrastructure-deployment-agent` → aktualizacja
3. `test-automation-agent` → testy
4. Różni agenci → naprawy problemów
5. `documentation-agent` → dokumentacja i release notes

### Incident Response

```
User: "ALERT: Serwis presidio nie odpowiada, diagnozuj i napraw"
```

Master natychmiast:
1. `infrastructure-deployment-agent` → sprawdza status
2. `data-analytics-agent` → analizuje logi
3. `infrastructure-deployment-agent` → restart serwisu
4. `test-automation-agent` → weryfikuje działanie
5. Synteza → raport incydentu

---

## Podsumowanie

**Master Orchestrator to Twój inteligentny asystent**, który:
- 🎯 Automatycznie rozumie intencje
- 🚀 Koordynuje wielu agentów
- ⚡ Wykonuje zadania równolegle gdy możliwe
- 📊 Syntetyzuje wyniki w czytelną formę

**Używaj go naturalnie** - opisz czego potrzebujesz, a system zajmie się resztą!

---

**Pro Tip:** Im bardziej precyzyjnie opiszesz cel (nie implementację), tym lepiej Master Orchestrator dobierze agentów i workflow. Zaufaj systemowi - został zaprojektowany, aby maksymalnie uprościć Twoją pracę!