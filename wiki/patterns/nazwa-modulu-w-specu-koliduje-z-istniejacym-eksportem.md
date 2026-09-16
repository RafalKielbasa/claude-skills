# nazwa-modulu-w-specu-koliduje-z-istniejacym-eksportem

- **Skill:** superpowers:brainstorming
- **Typ:** porażka
- **Status:** otwarty

## Opis
Spec nadaje nowemu modułowi albo eksportowanej funkcji nazwę wziętą ze
słownika designu, a taka nazwa już istnieje w kodzie w innym znaczeniu.
Kolizja wychodzi dopiero przy pisaniu planu, gdy ktoś czyta eksporty
sąsiednich modułów, żeby podać sygnatury.

## Przyczyna źródłowa
Brainstorming operuje pojęciami domeny („konspekt", „plan"), nie
identyfikatorami repozytorium, a self-review specu sprawdza placeholdery,
spójność i zakres — nie porównuje nowych nazw z istniejącymi eksportami.
W repo, gdzie jedno słowo domeny ma już dwa znaczenia (konspekt nagrania
z toru B i konspekt bloku z sali), krótka nazwa jest zajęta.

## Dowody
- 2026-09-15, sesja session_01FP9aoLo5yuoCv411Gis6gR: spec toru stacjonarnego
  (sekcja 6.2) wprowadził `src/konspekt.js` z `parseKonspekt(text)`. Dopiero
  `grep "^export" src/plan-nagrania.js` przy pisaniu planu pokazał
  `export function parseKonspekt` z 2026-09-09 (parser `konspekt-nagrania.md`
  toru B). Spec przepisany na `konspekt-bloku.js` / `parseBlockKonspekt`
  w trzech miejscach, zanim plan użył nazwy. Gdyby plan powstał bez tego
  odczytu, implementer zadania 1 nadpisałby cudzy eksport albo zostawił dwie
  funkcje o tej samej nazwie w jednym pakiecie.

## Rozwiązanie
W self-review specu, dla każdego nowego modułu i każdej nowej eksportowanej
funkcji: `grep -rn "<nazwa>" <katalog src>` (dla funkcji także po `^export`).
Trafienie znaczy, że nazwa jest zajęta i spec dostaje inną, zanim plan ją
utrwali.
