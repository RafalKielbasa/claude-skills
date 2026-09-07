# cd-w-komendzie-bash-przestawia-katalog-kolejnych-wywolan

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
`cd <katalog> && <komenda>` w narzędziu Bash zmienia katalog roboczy nie tylko
tej komendy, ale wszystkich następnych wywołań w sesji. Kolejne ścieżki
względne trafiają w zły katalog, a harness zgłasza zmianę dopiero po fakcie,
komunikatem „Environment update — Primary working directory".

## Przyczyna źródłowa
Katalog roboczy powłoki trwa między wywołaniami narzędzia (opis narzędzia mówi
to wprost), a `cd … && …` pisze się odruchowo, żeby skrócić ścieżki w jednej
komendzie. Efekt uboczny nie jest widoczny w wyniku tej komendy i ujawnia się
dopiero, gdy następna komenda dostanie ścieżkę względną.

## Dowody
- 2026-09-06/07, sesja session_01T6FrJW1rs56KS6EsPB5agM:
  `cd .claude/skills/idea-engine && for f in lib/*.mjs …` przestawiło cwd
  sesji na katalog skilla; dwie kolejne partie komend musiały wracać przez
  `cd /e/Praca/agent-biznes && …`, co przestawiało cwd z powrotem — dwa
  komunikaty „Environment update" w jednej sesji, a wszystkie późniejsze
  komendy pisane już na ścieżkach bezwzględnych.

## Rozwiązanie
W komendach narzędzia Bash nie używaj `cd`. Ścieżki podawaj bezwzględnie, a
gdy komenda musi biec z innego katalogu, opakuj ją w podpowłokę:
`( cd <katalog> && <komenda> )` — podpowłoka kończy się razem z komendą i cwd
sesji zostaje nietknięte.
