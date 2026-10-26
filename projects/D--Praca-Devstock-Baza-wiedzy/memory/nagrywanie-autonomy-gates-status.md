---
name: nagrywanie-autonomy-gates-status
description: "Część nagrywanie-autonomy-gates (#735): plany 1-4 w main (PR #762) i odebrane przez Rafała 2026-10-26 (raporty odbioru na gałęzi worktree-nagrywanie-acceptance-2026-10-25, niescalonej); bilet 2.2 tts_regenerations 2; dalej lekcja 2.2 w trybie biletu (S4)"
metadata:
  node_type: memory
  type: project
  originSessionId: 4bd53d28-0d05-40dd-bf31-94901ea828ea
  modified: 2026-10-25T10:51:19.763Z
---

Część `nagrywanie-autonomy-gates` (spec `docs/superpowers/specs/2026-10-21-nagrywanie-autonomy-gates-design.md`,
indeks `docs/superpowers/projects/nagrywanie.md`, issue devstock-org/devstock-team#735). Stan 2026-10-25:
- plany 1–4 wykonane, oba okna konta zrobione 24.10; od 2026-10-25 wszystko w `main`: PR #763 (gałąź dnia 17-10,
  `d6353dcb`) i PR #762 (22-10 z planami 1–4, `05f545e9`); pełne testy `tools/nagrywanie` na wyniku 994 passed,
  5 skipped;
- scalenie zrobiła sesja w worktree `baza-wiedzy-nagrywanie-autonomia` (gałąź pomocnicza, push na zdalną gałąź dnia),
  nie główny checkout; niedokończone scalenie Rafała w głównym checkoucie przerwane 25.10, checkout na
  `rafal-kielbasa/25-10-2026` od `main` `05f545e9`;
- okno planu 4: odczyt Gmaila tylko do odczytu działa (wariant A), F1–F3 potwierdzone, 10 maili 2.2 wysłanych raz
  (bilet 13/59); przeładowanie Wysłanych `page.reload` po „Wyślij” jeszcze niewidziane na prawdziwym Gmailu;
- `kursy/agenty-ai/_nagrywanie/google-grant.json` wyjęty z repo w `b8e90a5` (PR #775, w `main`); wcześniej wpadł
  w commicie `23-10-work`. 26.10 przejście głównego checkoutu na `main` (jeszcze śledzący plik) i pull z `b8e90a5`
  skasowały plik z dysku; przywrócony z `05f545e9` (145 B, ten sam zapis P-D), teraz ignorowany i lokalny.

**Why:** stan odbioru i spraw lekcji nie wynika z kodu; ledgery z orzeczeniami leżą tylko w worktree (poza gitem).

**How to apply:** (1) Odbiór planów 2–4 zrobiony 26.10 (wariant A); raporty `docs/superpowers/specs/2026-10-25-…-plan-{2,3,4}-acceptance.md` w `main` (PR #776, `e48de5ed`), główny checkout na `main`; poprawka markera `--plan-avatara` (plan 2, P27) przed 2.1 i 2.3 = #774 (DT-70); #735 zamknięte jako Done 26.10; 2.2 robi osobna sesja lekcji (#721) po „scal dzień” (ledgery w worktree, poza
gitem). (2) Lekcja 2.2 z biletem pierwsza: maile już są w skrzynce, `send-mail` 2.2 nie wyśle ich drugi raz
(rekordy w `<dane>/runs/*/send-mail/`). (3) Sprawy lekcji: 2.2 dopisuje część n8n deklaracji; konspekty 2.1/2.2
zamieniają adres nadawcy (`/kurs-uwagi`); 2.3 wpisuje na ekranie adres konta kursu - do rozstrzygnięcia w sesji 2.3.
Niesprawdzone na koncie: „Rozwiń wszystkie”, wersja robocza w rozmowie, czy licznik wierszy pomija kosz.
Powiązane: [[kolejka-konta-kursu-status]], [[skrzynka-kursu-agenty-ai]], [[commit-pathspec-wspolny-indeks]].
