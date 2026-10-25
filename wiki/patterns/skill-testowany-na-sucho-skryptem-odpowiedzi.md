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
- 2026-10-23, sesja 826a9cc6-adba-478b-b4db-47f6fa35bb62 (id claude.ai niedostępny): przebudowa
  `nauka-z-claude`, skilla dialogowego bez przycisków.
  - Przygotowanie: 4 scenariusze na osobnych fixture'ach w tmp joba. Subagent czyta skill z pliku
    (dla RED: kopia starej wersji) i nie wywołuje `Skill`, a ścieżkę pliku postępu ma podmienioną
    na fixture. Skrypt odpowiedzi ma warunki („jeśli A1 kończy się pytaniem → U2 = «Nie wiem.»”).
    Na koniec subagent wypisuje sekcję NOTES: która sekcja skilla zdecydowała o każdej turze.
  - Wyniki: RED 4/4 FAIL, GREEN 4/4 w głównym zachowaniu. GREEN S2 wykrył nową lukę: pojedynczy
    błąd uruchamiał test fundamentu i zatrzymywał krok. Po poprawce powtórka S2 przeszła.
  - NOTES dały racjonalizacje słowo w słowo („samo «Nie wiem.» to nie «nie wiem, wytłumacz»”),
    które weszły do „Red flags”.
  - Słabość: ocena na oko z transkryptu, bez skryptu kontrolnego.

## Rozwiązanie
Zachować przy zmianach bramek: osobny fixture na scenariusz (pozwala na równoległe przebiegi),
runner bez `AskUserQuestion` z drukiem `OPTIONS` i `MISMATCH`, kontrole mechaniczne zamiast
oceny logu na oko, a zapisy zewnętrzne wypisywane, nie wykonywane
(zob. klasyfikator-blokuje-zapisy-dry-run-w-subagencie). W skillu dialogowym: skrypt odpowiedzi
z warunkami zależnymi od poprzedniej tury i sekcja NOTES „która sekcja skilla zdecydowała”,
bo z niej pochodzą racjonalizacje do „Red flags”.
