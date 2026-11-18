---
name: code-review-master-blind-spots
description: "2026-11-18 PR 217 — automat dał 0 uwag przy realnym Blocking; przyczyny naprawione w skillu tego samego dnia (Z1–Z6 + domknięcie), przy pierwszych przebiegach sprawdzić trzy niepotwierdzone rzeczy"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 0aaba947-0230-4e7a-bac1-4c6ab7da27b3
  modified: 2026-11-18T13:09:25.555Z
---

PR #217 (CP-101, 2026-11-18): przebieg `20261118-122231-zty1` dał 0 uwag, a ręcznie znalazłem Blocking (kłódka bez warunku dostępu w `course-section-accordion.tsx:178`, zmiana spoza zakresu #181). Rafał uznał to za sprzeczne z celem skilla („ma maksymalnie weryfikować kod”).

Przyczyny sprawdzone w transkryptach i kodzie skilla:
- `prompts/axis.md` i `prompts/codex-find.md`: „against this checklist and nothing else … outside your checklist is noise”; żadna z 14 osi `config.md` nie obejmuje regresji zachowania, zgodności z issue, zakresu ani Figmy. Agent web-frontend widział diff akordeonu i zwrócił `[]`.
- Brief wskazał dokładnie ten błąd w `risks`, ale skill przekazuje dalej tylko `summary` (`risks` nie konsumuje nic).
- Każdy agent osi: 1 wywołanie Bash (sam `git diff`/grep), code-quality bez `git grep` mimo blokującej pozycji o duplikatach. `[]` jest akceptowane bez dowodu pracy.
- Treść issue nie trafia do żadnego agenta (brak `closingIssues` w kodzie skilla).

Wynik: review 5957188542 CHANGES_REQUESTED (R1 Blocking kłódka, R2 Suggestion `firstFreeLesson` może być quizem), POST przez `!` Rafała, karta #181 Second review → To be fixed. Naprawa skilla (Z1–Z5: osie `correctness` i `issue-conformance`, `risks` z briefu do agentów, dowód pracy przy `[]`, nazwany typ agenta) zlecona osobnej sesji przez hub; brief w scratchpadzie sesji 0aaba947.

**Why:** pusty raport wygląda jak czysty kod; Rafał opiera na nim decyzję o merge.

**Stan od 2026-11-18 (sesja 51ae2c74 w vaultcie):** skill obejmuje to sam — oś `correctness`, oś `issue-conformance` z treścią issue z `crm plan` (`pr`, `branch --issue`), krok 5 „Issue” w `recheck`, Figma w Kroku 4b robiona przez sesję, typ agenta `general-purpose` i zakaz preambuły w `SKILL.md`, weryfikator z checklistą, issue i komendą diffu, lista uwag spod progu w Kroku 10. Przebieg kontrolny `20261118-134455-ev71` na tym samym commicie zgłosił kłódkę (92) i cztery uwagi zakresu i Figmy (90–92).

**How to apply:** prowadzę przebieg wg `SKILL.md` bez ręcznego dublowania kryteriów issue i zakresu. Przy pierwszych przebiegach `pr` i `recheck` po zmianie sprawdzam jednak trzy rzeczy, których jeszcze nie potwierdził żaden prawdziwy przebieg: czy agent `issue-conformance` przeczytał pliki (pole `read`; w obu kontrolnych zgłosił uwagi po samym `git diff` — „Reguła głębokości czytania (D3)” odłożona przez Rafała), czy weryfikator z komendą diffu daje 0 uwagom o kodzie sprzed PR-a (wcześniej `f-05` 90, `f-11` 85), i czy `recheck` wypisuje drugą tabelę z elementami issue. Zob. [[feedback-unmet-issue-element-blocking]], [[feedback-foreign-task-changes-blocking]], [[feedback-verify-issue-views-in-figma]].

**Pierwszy prawdziwy przebieg po naprawie (2026-11-18, `pr 219`):** `issue-conformance` przeczytał 2 z 3 plików (bez `app.module.ts`), osie pracowały płytko (2–5 wywołań narzędzi). Weryfikator dał 80 uwadze o niespełnionym zdaniu scenariusza z OPISU issue („student zapisuje się na kurs”), bo „lista kryteriów nie nazywa zapisu” — wbrew checklistcie (opis też jest wymaganiem), więc realny Blocking spadł pod próg i wrócił dopiero z mojej oceny. Przy każdym `pr` czytam `belowThreshold` z `issue-conformance` sam.
