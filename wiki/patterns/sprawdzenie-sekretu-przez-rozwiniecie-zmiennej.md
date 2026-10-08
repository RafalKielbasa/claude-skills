# sprawdzenie-sekretu-przez-rozwiniecie-zmiennej

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sprawdzając, czy zmienna środowiskowa z sekretem jest ustawiona, napisałem
`echo "GH_TOKEN set: ${GH_TOKEN:+yes}${GH_TOKEN:-no}"`. Gdyby zmienna była ustawiona, druga
połowa wypisałaby token do wyniku narzędzia, czyli do kontekstu i transkryptu. Zmienna była pusta,
więc wyszło `no` — skończyło się na near-missie.

## Przyczyna źródłowa
`${VAR:-default}` czyta się jak „wartość domyślna", a to jest „wartość ALBO domyślna"; w parze z
`${VAR:+yes}` daje wrażenie symetrycznego testu tak/nie. Skupienie było na tym, żeby nie czytać
pliku z tokenem, więc komenda na zmiennych nie przeszła tej samej kontroli.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: diagnoza „gdzie jest zapisany
  token GitHub"; w tej samej komendzie `grep -c 'oauth_token'` na `hosts.yml` (bez wypisania
  treści) i `cmdkey /list` filtrowane do nazw celów — oba bezpieczne. Wyciekłaby tylko linia z
  rozwinięciem zmiennej, gdyby `GH_TOKEN` był ustawiony.

## Rozwiązanie
Istnienie sekretu sprawdzać testem bez rozwinięcia wartości: `[ -n "$GH_TOKEN" ] && echo yes ||
echo no` (PowerShell: `[bool]$env:GH_TOKEN`). Nigdy `${VAR:-…}`, `echo $VAR` ani `printenv` dla
nazw zawierających TOKEN/KEY/SECRET/PASSWORD — także „tylko żeby sprawdzić".
