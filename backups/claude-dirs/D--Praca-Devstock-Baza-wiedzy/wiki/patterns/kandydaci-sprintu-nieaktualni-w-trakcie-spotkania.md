# kandydaci-sprintu-nieaktualni-w-trakcie-spotkania

- **Skill:** sprint
- **Typ:** porażka
- **Status:** otwarty

## Opis
Karty `/sprint` pokazują stan tablicy zapisany w kroku 1 (`candidates.json`). Na spotkaniu zespół zmienia tablicę na bieżąco: zamyka zadania i zakłada nowe karty. Karty sprintu podają więc pozycje już zamknięte i nie widzą nowych. Pozycja zamknięta po odczycie przechodzi przez `--check`, a pada dopiero przy `sprint-apply`.

## Przyczyna źródłowa
Skill czyta tablicę raz, w kroku 1. Ponowny odczyt przewiduje tylko przy wejściu w przerwany przebieg (Re-entry). Do tego `sprint-apply --check` nie sprawdza, czy pozycja z `items` stoi w Done. Pierwsza operacja przebiegu (`archive:<board>`) archiwizuje wszystko z Done, więc taka pozycja znika z tablicy, zanim wykona się na niej operacja `sprint:<ref>`. Karta tablicy przeżywa też skasowanie swojego issue, a `sprint-candidates` dalej ją zwraca.

## Dowody
- 2026-11-09, sesja 3633cf62-9947-4cd6-8645-95bc257b4e9c (id claude.ai niedostępny; pierwszy realny przebieg, sprint 09.11–15.11):
  - #870 i #844 były „in_progress” w `candidates.json`, a `sprint-issues` przy karcie celu 1 zwrócił `closed=true`.
  - #900–#904 (kurs Claude Grzegorza) powstały w trakcie spotkania. Rafał: „Brakuje tu zadań grzegorza odnośnie kursu Claude”. Trzeba było ponownie uruchomić `sprint-candidates`.
  - #308 zamknięto o 12:36 jako COMPLETED, po karcie Wiktora. `--check` zwrócił `ok: true`, potem `archive:devstock-org#3` zarchiwizował #308, a `sprint-apply` padł: `failed: "sprint:devstock-org/devstock-team#308"`, `error: "gh: The item is archived and cannot be updated"`. Sprint dokończyła karta odzysku „Usuń tę pozycję i wznów”.
  - #556 DT-1 było w `candidates.json` jako Backlog, a `gh api …/issues/556` zwróciło `410 This issue was deleted`.

## Rozwiązanie
- Przed ekranem końcowym (krok 8) skill ponownie uruchamia `BT sprint-candidates` i `BT sprint-issues` dla refów z `items`. Pozycję zamkniętą albo nieistniejącą usuwa z `items` i podaje jedną linią na ekranie końcowym.
- `sprint-apply --check` zgłasza w `validate` każdą pozycję z `items`, której status na tablicy mapuje się na Done albo której issue nie istnieje.
- `sprint-candidates` pomija karty, których issue zwraca 410.
