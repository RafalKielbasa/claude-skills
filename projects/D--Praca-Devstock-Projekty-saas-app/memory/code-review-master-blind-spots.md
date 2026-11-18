---
name: code-review-master-blind-spots
description: "2026-11-18 PR 217 — automat dał 0 uwag przy realnym Blocking; przyczyny strukturalne skilla + moje błędy orkiestracji (Explore, preambuła z git diff)"
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

**How to apply:** przy dispatchu osi nie używam `Explore` (opis: „locates code; it doesn't review”) i nie dopisuję preambuły z komendą `git diff` — tylko korzeń repo i „czytaj pliki Read w całości”. W `pr` zawsze robię ręcznie kryteria issue + zakres + Figmę, dopóki skill tego nie obejmuje. Zob. [[feedback-unmet-issue-element-blocking]], [[feedback-foreign-task-changes-blocking]], [[feedback-verify-issue-views-in-figma]].
