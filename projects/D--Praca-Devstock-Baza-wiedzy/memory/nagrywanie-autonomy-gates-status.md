---
name: nagrywanie-autonomy-gates-status
description: "Część nagrywanie-autonomy-gates (issue #735): spec S1, plan 1 wykonany w nocy 21/22.10 i odebrany przez Rafała 22.10 (D1–D4 A) na gałęzi nagrywanie-autonomy-gates-plan-1 (da750841, niescalona, bez pusha); czeka scalenie na rafal-kielbasa/17-10-2026 przy trzymanym koncie, sondy P-B–P-D, plany 2–3"
metadata:
  node_type: memory
  type: project
  originSessionId: 4bd53d28-0d05-40dd-bf31-94901ea828ea
  modified: 2026-10-22T11:39:29.989Z
---

Część `nagrywanie-autonomy-gates` (spec `docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`,
indeks `docs/superpowers/projects/nagrywanie.md`, issue devstock-org/devstock-team#735 DT-48). Spec zatwierdzony
2026-10-21 (S1 A), plan 1 zatwierdzony (S2 A) i wykonany w nocy 21/22.10 subagentami na gałęzi
`nagrywanie-autonomy-gates-plan-1` (od `rafal-kielbasa/17-10-2026` 3cb8c356, HEAD `da750841`, 20 commitów), pełne
testy `tools/nagrywanie` 717 passed. Rafał odebrał plan 1 rano 22.10 przez hub, D1–D4 wariant A: polityki resetu
n8n/arkusza/Pinecone potwierdzone (flagi `pending_confirmation` usunięte w `da750841`), `shared_state`/`recreate`
tylko dla lekcji z biletem, scalenie na `rafal-kielbasa/17-10-2026` bez pusha, poprawki specu przy starcie planu 2.
Gałąź NIE jest scalona i NIE jest wypchnięta; worktree `baza-wiedzy-nagrywanie-autonomia` z ledgerem orzeczeń
`.superpowers/sdd/2026-10-21-nagrywanie-autonomy-gates-plan-1/progress.md` zostaje do scalenia.

Tego samego dnia Rafał zatrzymał produkcję modułu 2 („wszystko na automacie”): lekcje 2.1–2.3 wracają dopiero w
trybie biletu po planach 2 i 3. Sekcja 9 specu przeszła do planu 2. Plan 2
(`docs/superpowers/plans/2026-10-22-nagrywanie-autonomy-gates-plan-2.md`, 12 zadań, `1917f3e6`, poprawki specu D4
w `6a82d131`) czeka na S2. Plan 3 to tylko sekcja 10 (Gmail, `send_mail`, warianty zgody) po sondach P-B–P-D.

Po południu 22.10: sondy P-B–P-D zrobione z Rafałem (raport `…-probes.md`, commit `03bab34f`). Drugie konto kursowe
(skrzynka live'ów, wolno z nim robić wszystko) siedzi w profilu kursu pod `/mail/u/1/`; logować je można tylko
w zwykłym Chrome na profilu kursu. **Uwaga:** od tej chwili `oauth.js:157-158` zatrzymuje każde logowanie Google
w sesjach lekcji (dwa konta na liście) do zadania 1 planu 3; po P-D n8n nie ma dostępu do konta Google kursu,
credential arkusza wymaga nowej zgody. Plan 3 (`docs/superpowers/plans/2026-10-22-nagrywanie-autonomy-gates-plan-3.md`,
`2db0845c`) zatwierdzony (S2 A) razem z: oba konta zostają, warianty zgody w 2.1, G3 `connections` zatwierdzone,
nadawca jak w konspektach. Plan 2 realizowany na gałęzi `nagrywanie-autonomy-gates-plan-2` (ledger
`.superpowers/sdd/2026-10-22-nagrywanie-autonomy-gates-plan-2/progress.md`), plan 3 po nim; okno konta planu 3
(zadanie 10) tylko na słowo Rafała.

**Why:** sześć bramek (G1 bilet produkcyjny `video/ticket.yaml`, G2 poświadczenia, G3 polityka konta per usługa,
G4 zakres dydaktyczny, G5 `final.mp4` z kartą lekcji, G6 publikacja) zastępuje 24 miejsca, w których automat
czekał na Rafała 20–21.10. Przełącznik zgodności: lekcja bez biletu działa jak dziś (spec, sekcja 12), więc
lekcje w toku 1.4/2.1/2.2 po scaleniu nie zmieniają zachowania (D2 A).

**How to apply:** (1) scalenie robi sesja w głównym checkoucie (`D:\Praca\Devstock\Baza wiedzy`, gałąź
`rafal-kielbasa/17-10-2026`) przy koncie kursu trzymanym przez `station-wait … --purpose other`, potem
`git merge --no-ff nagrywanie-autonomy-gates-plan-1`, pełne testy, `station-release`; z worktree `git -C` blokuje
klasyfikator; gałąź dnia 17-10 ma po bazie tylko 4 commity lekcji 1.4 (dokumenty i jej `nagrywanie.yaml`), bez
wspólnych plików z gałęzią wykonania. (2) Sondy P-B (`mail_age` prowizoryczny do czasu P-B), P-C, P-D tylko na
słowo Rafała „jestem gotowy klikać” w sesji (raport `…-probes.md`). (3) Plan 2 (samoweryfikacja przebiegu
i nagrania, karta lekcji) zaczyna się od poprawek specu z D4: wzór budżetu `executions` przy G1 (sekcja 12),
`preparation` per lekcja (sekcja 3); rozgrzewka: nieważny bilet bez ostrzeżenia w komendach tylko do odczytu,
„Pominięte w deklaracji” z wszystkimi credentialami, kopia strażnika w `sondy.js`, zdanie o 2-minutowej karencji
w skillu, przestarzałe „dziś n8n, arkusz i pinecone” w `SKILL.md` linia 33 (klasyfikator zablokował edycję skilla
22.10). Plan 3 (wideo, montaż, Gmail, warianty zgody) nienapisany. Bramka pierwszego ujęcia zostaje do planu 2
także dla lekcji z biletem. Powiązane: [[board-tracker-status]], [[kolejka-konta-kursu-status]],
[[skrzynka-kursu-agenty-ai]].
