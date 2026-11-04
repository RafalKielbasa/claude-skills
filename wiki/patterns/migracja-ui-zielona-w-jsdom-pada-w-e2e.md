# migracja-ui-zielona-w-jsdom-pada-w-e2e

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Zmiana struktury elementu interaktywnego przechodzi testy jednostkowe i przegląd zrzutów, a e2e w przeglądarce
pada. Element jest zasłonięty albo selektor wskazuje stary markup. Zdarza się w dwóch sytuacjach:
- przy własnej migracji komponentu;
- przy scaleniu `main`, który wnosi e2e pisane pod starą wersję ekranu.

## Przyczyna źródłowa
Trzy rodzaje weryfikacji nie widzą tych defektów:
- **jsdom.** Nie liczy układu i nie robi hit-testu, więc `userEvent.click` na `input` `sr-only` wewnątrz `label`
  przechodzi. Playwright przed `.check()` sprawdza, czy punkt środka elementu dostaje zdarzenie, i zgłasza
  „label intercepts pointer events”.
- **Scalenie gita.** Selektory e2e łączą się bez konfliktu tekstowego z gałęzią, która zmieniła markup, więc
  konflikt jest semantyczny.
- **Zrzut ekranu.** Pokazuje wygląd, nie klikalność.

Klikalność i aktualność selektorów sprawdza tylko e2e w prawdziwej przeglądarce.

## Dowody
- 2026-11-03, sesja 9b10f517-b92d-49ad-8df9-1d567ac06e20 (id claude.ai niedostępny; code-busters-v2, DT-52
  #741). Oba przypadki wyszły w przebiegu `e2e/chat` i `e2e/terms` uruchomionym w ramach przeglądu po merge'u.
  - **Własna migracja.** `ReportDialog` po migracji w `4bfa9ff14` ma radio `sr-only` w etykiecie. Przeszedł
    vitest (361 plików, 2742 testy) i przegląd 45 zrzutów. `e2e/chat` padł na `.check()` radia „Spam”.
  - **Merge.** `e2e/terms/termsIntegrations.ts` ze scalonego `main` (#1671) szukał `label[for="terms"]`, a
    `ds` `Checkbox` nadaje id przez `useId`. Po poprawce selektora `.check()` padł tak samo na `sr-only`.

## Rozwiązanie
Uruchom e2e obszarów, których dotyka zmiana:
- po zmianie struktury elementu interaktywnego (input w `label`, `sr-only`, nowy komponent pola);
- po każdym scaleniu `main` do gałęzi, która przebudowuje UI.

Obszary znajdziesz przez `git grep` po roli i nazwie elementu w katalogu e2e. W „Weryfikacji” podawaj wynik e2e
osobno od vitest, bo zielony vitest nie mówi nic o klikalności.
