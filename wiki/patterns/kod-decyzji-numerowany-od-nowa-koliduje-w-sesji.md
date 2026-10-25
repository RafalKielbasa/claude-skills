# kod-decyzji-numerowany-od-nowa-koliduje-w-sesji

- **Skill:** ogólny (format odpowiedzi z `CLAUDE.md`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
W jednej sesji ten sam kod znaczył trzy różne rzeczy: „D1” to decyzja „Fundament przed
komponentami” z planu pracy, strumień pracy „dane CMS” (obok strumienia „P1”, pakietu ekranów)
i w późniejszej turze „Klucz i zakres projektu”. Gołe kody w odpowiedziach i w nazwach plików
roboczych (`d1-cms-data-draft.md`, `p1/`) wymagały potem wyjaśniania, który „D1” jest który.

## Przyczyna źródłowa
Format „Recommendation-First” numeruje decyzje `D1`, `D2`… w obrębie jednej wiadomości, więc
numeracja startuje od nowa w każdej turze z decyzjami, a nic nie każe sprawdzić, czy kod ma już
znaczenie w sesji. Etykiety strumieni pracy wzięły litery z tej samej puli (D, P), bo były pod
ręką. Reguła „kod nigdy nie stoi sam” (sekcja „Indeks projektu”) usuwa objaw w miejscu użycia,
ale nie zapobiega kolizji.

## Dowody
- 2026-10-16, sesja 7875e423-9ae8-4e55-a56b-31766c608f4e (id claude.ai niedostępny): plan pracy
  z decyzjami D1–D5 („ok” = wszystkie [A]), strumienie „D1” (dane CMS) i „P1” (pakiet ekranów)
  jako subagenci w tle i foldery robocze, pytania specu jako „pytanie 1/2”, potem propozycja
  indeksu z nowymi D1–D3. Claude sam wskazał kolizję w propozycji indeksu („„D1” znaczyło raz
  decyzję, raz strumień danych CMS”); w `docs/superpowers/projects/kodozercy-platform.md`
  decyzje zapisane samymi nazwami, bez kodów.
- 2026-10-24, sesja session_01UTQuE3EwUpLuJMEs83YJwD (lokalnie 362d75a8-47e4-4b51-a94a-5c747a21b5c6), wiadomość bramki W1: decyzje D1–D3 (kolory jasnego motywu, stan aktywacji na arkuszu, wyciszenie tagów analitycznych) w sesji, w której spec ma D1–D12 („D1 Mobile release”, „D5 fallback #1647”), a raport pętli bramki D1–D6 o innych znaczeniach. Każdy kod opatrzyłem nazwą, ale trzy numeracje „D” były w jednym oknie naraz.

## Rozwiązanie
Etykiety strumieni, plików roboczych i subagentów nazywaj słowami (`cms-data`, `screens-package`),
nigdy literą z numerem z puli kodów decyzji. Decyzja zawsze ma nazwę, a kod stoi tylko obok niej
(„Meta projektu (D2)”). Gdy kod z bieżącej wiadomości znaczył wcześniej w tej sesji coś innego,
pomiń kod i podaj samą nazwę. W plikach (indeks, spec) zapisuj nazwy; kody tylko z jednego
trwałego słownika projektu.
