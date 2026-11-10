# metro-w-tle-z-ci-bez-przeladowania

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Metro do przeglądu na telefonie uruchomiłem w zadaniu tła z `CI=1`, żeby `expo start` nie czekał na
klawisze. Expo w trybie CI wyłącza obserwowanie plików („Metro is running in CI mode, reloads are
disabled”), więc poprawka w trakcie przeglądu nie trafiłaby na telefon bez restartu Metro. Restart
wymaga zabicia procesu, a to bywa blokowane.

## Przyczyna źródłowa
`CI=1` traktowałem jak przełącznik „bez interakcji”, a Expo czyta go jako „środowisko CI” i wyłącza
też watch mode. Zadanie tła i tak nie ma TTY, więc `expo start` bez `CI` nie zawiesza się na
klawiszach: wcześniejsze sesje uruchamiały Metro w tle przez `pnpm dev` bez tego przełącznika.

## Dowody
- 2026-11-10, sesja 2755dabd-6161-454c-a435-d571c7e46f91 (id claude.ai niedostępny; przegląd DT-93):
  `CI=1 npx expo start --dev-client --lan --port 8081`; w logu linia o wyłączonych przeładowaniach.
  `TaskStop` nie zabił `node` (PID 34740, zob.
  [taskstop-nie-zabija-procesu-potomnego-na-windows](taskstop-nie-zabija-procesu-potomnego-na-windows.md)),
  a `Stop-Process` odrzucił klasyfikator, więc przegląd szedł na Metro bez przeładowania. Poprawki nie
  były potrzebne, więc nic nie zepsuło przeglądu, ale gotowość do poprawek była pozorna.

## Rozwiązanie
Metro do przeglądu na urządzeniu uruchamiaj w zadaniu tła bez `CI=1`, jako goły
`node node_modules/expo/bin/cli start --dev-client --lan` (bez `npx`/`pnpm`, żeby `TaskStop` je
zatrzymał). Po starcie sprawdź w logu, że nie ma linii „reloads are disabled”.
