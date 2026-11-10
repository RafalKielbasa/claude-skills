# weryfikacja-pr-z-listy-kontrolnej-zamiast-z-relacji

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Pisząc sekcję „Verification” PR-a po ręcznym przeglądzie użytkownika, wpisałem zakres przeglądu
z listy kontrolnej, którą sam przygotowałem, a nie z tego, co użytkownik zgłosił. Rafał odpowiedział
tylko „Akceptuję bramki”, a w szkicu stało, że sprawdził też przypadek wymagający mojej akcji, której
nigdy nie zlecił. Złapane przy czytaniu szkicu przed `gh pr create`.

## Przyczyna źródłowa
Sekcja weryfikacji ma znany kształt (co sprawdzono, na czym, z jakim wynikiem), a lista kontrolna
z poprzedniej tury podsuwa gotową treść. Krótka akceptacja nie mówi, co zostało przejrzane, więc
lukę wypełnia plan zamiast relacji. Ten sam mechanizm co pole raportu wypełnione „z wyglądu”
([hash-commita-w-raporcie-spoza-wyniku-narzedzia](hash-commita-w-raporcie-spoza-wyniku-narzedzia.md)).

## Dowody
- 2026-11-10, sesja 2755dabd-6161-454c-a435-d571c7e46f91 (id claude.ai niedostępny; PR #1742
  `kodozercy/code-busters`): szkic miał „Manual review in a browser by Rafał on a local CMS (signed
  in and as a guest, desktop and narrow), including the gift CTA with the CMS restarted on another
  `SESSION_SECRET`: accepted”. Rafał nie napisał „przełącz sekret”, więc CMS z innym sekretem nigdy
  nie działał. Przed wysłaniem zmienione na „Manual review in a browser by Rafał against a local CMS:
  accepted.”, a w raporcie dopisane, że zakresu przeglądu nie znam.

## Rozwiązanie
W opisie weryfikacji wykonanej przez użytkownika wpisuj tylko to, co sam zgłosił, jego słowami.
Krótka akceptacja („ok”, „akceptuję”) daje „przegląd ręczny: zaakceptowany”, bez wyliczania punktów
listy. Punkt listy, który wymagał akcji sesji (restart, przełączenie, dane testowe), a tej akcji
nie było, jest „nie sprawdzony”.
