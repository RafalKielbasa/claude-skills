# PURPOSE — daily

## Pochodzenie

Skill powstał 2026-09-27 (`73a76629`, `feat(skills): daily processes a standup transcript into a note and two queues`). Przeniósł obróbkę porannego daily z n8n do repo: z transkryptu powstaje notatka i dwie kolejki do przeglądu, `wpisy.yaml` z kandydatami do bazy wiedzy i `zadania.yaml` z kandydatami na tablicę. Dopiero po zatwierdzeniu przez Rafała idą indeksowanie, issues i publikacja na Slacku. Projekt opisuje `docs/superpowers/specs/2026-09-25-meeting-processing-in-repo-design.md`, a plany to `docs/superpowers/plans/2026-09-26-meeting-processing-repo-side.md` (strona repo), `2026-09-26-meeting-processing-n8n-side.md` (webhooki) i `2026-09-27-meeting-processing-decommissioning.md` (wygaszenie starego toru w n8n).

Schemat kolejek, bramka, kolejność wykonania i reguły deduplikacji są od początku zapisane raz, we wspólnym kontrakcie `docs/spotkania-kolejki.md`, z którego korzysta też `/spotkanie`. Skill streszcza kontrakt i odsyła do niego (`1e302e27`: progi czytane na bieżąco z sekcji „Thresholds”).

Kolejne zmiany szły poza `evolve-skill`, ze speców:
- `ad7ec62d`, `3c5d7d7d`: poprawki ścieżek, bramki notatki i hooka po review planu;
- `39c4482f`: `docs/ticket-conventions.md` i reguła przydziału `assignee`;
- `1ac982cb`, `ea378033`: bramka punkt po punkcie, spec `docs/superpowers/specs/2026-10-08-meeting-gate-walkthrough-design.md`;
- `80711b46`: pobieranie transkryptu przez `kb-client transcript`, spec `docs/superpowers/specs/2026-10-14-meeting-transcript-webhook-design.md`.

## Adresowane wzorce

- [kolejka-bez-slownika-statusow](../../wiki/patterns/kolejka-bez-slownika-statusow.md) — krok 7: bramka punkt po punkcie (2026-10-08, poza `evolve-skill`, przez spec)
- [update-z-deduplikacji-trafia-w-caly-dokument](../../wiki/patterns/update-z-deduplikacji-trafia-w-caly-dokument.md) — deduplikacja wiedzy (2026-10-16, `evolve-skill`): `update` tylko dla korekty wpisu spotkania na ten sam temat

## Historia ewolucji

- 2026-09-27 — utworzenie skilla. Notatka z daily, kolejki `wpisy.yaml` i `zadania.yaml`, deduplikacja przed bramką, bramka Rafała, wykonanie i publikacja.
  - powód: przeniesienie obróbki daily z n8n do repo, gdzie każda zmiana przechodzi przegląd przed zapisem;
  - wynik: wprowadzona ręcznie;
  - źródło: `73a76629`, spec `docs/superpowers/specs/2026-09-25-meeting-processing-in-repo-design.md`.
- 2026-10-08 — krok 7: bramka punkt po punkcie. Karty `AskUserQuestion`, jedno „Akceptuj i wykonaj” na ekranie końcowym, powrót do bramki bez przebudowy i znacznik `**Opublikowano:**`.
  - powód: prośba Rafała („forma przedstawiania mi treści do zaakceptowania jest dość toporna”);
  - wynik: wprowadzona ręcznie przez spec;
  - źródło: `1ac982cb`, `ea378033`, wpis 2026-10-08 — daily w `.claude/wiki/skill-impact.md`.
- 2026-10-14 — transkrypt pobierany przez `kb-client transcript` (webhook n8n `41_meeting_transcript`) zamiast konektora Drive.
  - powód: konektor Drive nie widzi dysku współdzielonego `meetings`;
  - wynik: wprowadzona ręcznie;
  - źródło: `80711b46`.
- 2026-10-16 — deduplikacja wiedzy. Trafienie w progu daje `action: update` tylko wtedy, gdy jest wpisem spotkania (`planning/`) na ten sam temat, a kandydat jawnie koryguje w nim fakt. Każde inne trafienie (fragment dokumentu z `knowledge-base/*.md`, wpis o innym temacie, wpis, który kandydat tylko uzupełnia) daje `action: new` z komentarzem `#` nad blokiem. Reguła stoi w `docs/spotkania-kolejki.md` („Deduplication before the gate”), więc obejmuje też `/spotkanie`.
  - powód: wzorzec `update-z-deduplikacji-trafia-w-caly-dokument`, 5 dowodów z 5 sesji, w trzech ostatnich bramkach przy 19 kartach `update` ani razu „Nadpisz istniejący”;
  - wynik: zaakceptowana przez `/evolve-skill` („A”);
  - źródło: wpis 2026-10-16 — daily w `.claude/wiki/skill-impact.md`.
