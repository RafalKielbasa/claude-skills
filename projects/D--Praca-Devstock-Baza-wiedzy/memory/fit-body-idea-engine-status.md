---
name: fit-body-idea-engine-status
description: "Fit Body (Bartek's gym/longevity business, Warsaw) in Rafał's idea-engine — state after 2026-11-10: form imported, market block researched (verdict 'podważa'), block status awaits Rafał; where every piece lives and how to resume"
metadata:
  node_type: memory
  type: project
  originSessionId: 57afcdd0-56df-4347-bc5c-f21b6763a3e1
  modified: 2026-11-10T10:32:17.619Z
---

Stan 2026-11-10 (#831, DT-91, **On hold** od 2026-11-10 na słowo Rafała; ustalenia w komentarzu sesji na #831; wznowienie: odpowiedzi Bartka na P1-P9, potem burza mózgów `offer`). Historia: 2026-10-30 nagranie spotkania przez idea-engine; 2026-11-01 Bartek oddał formularz jako plik w repo (nie w Claude Docs); 2026-11-03 Rafał zrobił ekonomię progu ręcznie (P1-P9 do Bartka); 2026-11-04 Mateusz zebrał `decisions/DO-DECYZJI.md`.

- **idea-engine** żyje w `E:\Praca\agent-biznes` (skill `idea-engine` tego repo, w sesji „Bazy wiedzy” niewidoczny — czytaj `.claude/skills/idea-engine/SKILL.md`, CLI `node .claude/skills/idea-engine/bin/ide.mjs … --json` z katalogu repo). Skill nie commituje.
- **`ingest` wymaga statusu `validated`** (`lib/modes/ingest.mjs:35`); `fit-body` jest `shortlisted`, więc dane właściciela wchodzą przez `import` drugiego dokumentu.
- **Drugi `import` kasuje stare twierdzenia** każdego wymiaru, do którego coś wnosi (`lib/claims.mjs:84-87`: zostają tylko confirmed/refuted/tier E albo podane ponownie tym samym zdaniem). Obejście użyte 2026-11-10 za zgodą Rafała: przed `import finish` dopisać do `import.json` wszystkie obecne twierdzenia dosłownie (`ref: keep-<id>`); sprawdzone próbą scalenia w pamięci (0 usuniętych).
- Runy 2026-11-10: `20261110-1028-import` (dokument `fit-body/Dane i ekonomia Fit Body 2026-11.md` = formularz + ekonomia; 143 nowe twierdzenia, razem 259, 13 sprzeczności z 30.10), `20261110-1057-vision` (klocek `market`, werdykt „podważa”: GenZen i EVOLVE Health Hub to bliscy konkurenci, ceny Fit Body w górze korytarza). Niezacommitowane.
- Klocek `market`: status „do rozmów” (decyzja Rafała 2026-11-10), teza przepisana według researchu, „Otwarte” = pytania z „Do rozmów” notatki. Pozostałe 10 klocków `pomysł`; następny krok to wybór klocka do burzy mózgów.
- Repo zespołu `D:\Praca\Devstock\fit-body-business` (`fit-body/fit-body-business`): research w `knowledge/2026-11-10-rynek-i-konkurencja.md` + wiersz w `knowledge/README.md`, niezacommitowane (repo bez konfiguracji commitów → commit na polecenie). Zasady repo: `AGENTS.md` (nagłówek dokumentu sekcja 4, bez długich myślników, agent nie zatwierdza cen).

**Why:** DT-91 prowadzi analizę biznesową Fit Body przez idea-engine; każdy research klocka to agent Opus.

**How to apply:** przed kolejnym badaniem klocka pytaj „Badamy klocki … Zaczynam?” i podaj koszt (import i ingest to też agenci Opus). Następny import do `fit-body` zawsze z listą `keep-`, inaczej ginie dorobek poprzednich importów. Zobacz też [[tryb-commitow-per-repo]].
