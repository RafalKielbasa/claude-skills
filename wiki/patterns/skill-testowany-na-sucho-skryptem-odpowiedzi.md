# skill-testowany-na-sucho-skryptem-odpowiedzi

- **Skill:** superpowers:writing-skills
- **Typ:** sukces
- **Status:** otwarty

## Opis
Skill interaktywny (bramka z pytaniami do użytkownika) sprawdzony bez użytkownika: subagent gra
skill na kopii artefaktów, zamiast `AskUserQuestion` drukuje kartę i listę `OPTIONS`, bierze
odpowiedzi ze skryptu (`[opcja] …`, `[other] …`, `[brak odpowiedzi]`, `[sesja przerwana]`),
a skrypt kontrolny porównuje stan plików i log z oczekiwaniem. RED na starej wersji skilla,
GREEN na nowej.

## Przyczyna źródłowa
Tekst skilla to instrukcja dla modelu, więc jedynym testem jest model, który ją wykonuje;
zastąpienie człowieka skryptem odpowiedzi i drukiem opcji czyni przebieg powtarzalnym
i sprawdzalnym maszynowo, a `MISMATCH` na odpowiedzi spoza opcji łapie złe zestawy przycisków.

## Dowody
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny), repo Baza wiedzy: bramka `/daily`
  i `/spotkanie` — 9 scenariuszy (A–E, g1–g4) na osobnych fixture'ach, część równolegle;
  baseline 30 i 10 FAIL na starych skillach; trzy uwagi z final review zreprodukowane jako RED
  i domknięte jako GREEN; dwie się nie zreprodukowały i zostały oznaczone jako takie.

## Rozwiązanie
Zachować przy zmianach bramek: osobny fixture na scenariusz (pozwala na równoległe przebiegi),
runner bez `AskUserQuestion` z drukiem `OPTIONS` i `MISMATCH`, kontrole mechaniczne zamiast
oceny logu na oko, a zapisy zewnętrzne wypisywane, nie wykonywane
(zob. klasyfikator-blokuje-zapisy-dry-run-w-subagencie).
