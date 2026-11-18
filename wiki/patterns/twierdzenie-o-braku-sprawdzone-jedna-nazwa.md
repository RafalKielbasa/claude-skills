# twierdzenie-o-braku-sprawdzone-jedna-nazwa

- **Skill:** github-tickets
- **Typ:** porażka
- **Status:** zaadresowany (2026-11-18, github-tickets)

## Opis
Treść ticketu stwierdza, że czegoś w repo nie ma („ds nie ma ikon”, „lista nie ma pola autora”), i na tym
buduje polecenie dla wykonawcy (dodaj ikony do ds, treść spoza CMS). Twierdzenie jest fałszywe: rzecz istnieje
pod inną nazwą albo w innej bibliotece. Self-check go nie łapie, łapie dopiero `codex`.

## Przyczyna źródłowa
Twierdzenie o braku sprawdzam jednym `grep` po jednej nazwie w jednym miejscu, a pusty wynik biorę za dowód.
Linia self-checku „każda ścieżka istnieje” dotyczy rzeczy wymienionych, a nie rzeczy, których brak ticket
ogłasza, więc brak nie przechodzi żadnej kontroli. Pokrewne: [rama-ticketu-z-grepa-przed-sprawdzeniem-per-element](rama-ticketu-z-grepa-przed-sprawdzeniem-per-element.md).

## Dowody
- 2026-11-18, sesja ad61063b-44ca-44a1-9bd6-fb37945d43c8 (id claude.ai niedostępny; paczka DT-195…DT-202 z uwag
  Bartka 17-23, devstock-org/devstock-team#1035–#1042): DT-197 mówił „design system nie ma ikon serwisów
  społecznościowych … brakujące ikony dodajesz do `packages/ui`”, sprawdzone tylko w `pixel-icons.js`; ikony są
  w `packages/ui/src/components/icons/socialmedia/` i `InstructorPanel`, `ProfileHero`, `LoyaltyTaskCard`
  używają ich przez `SocialmediaIcon` z `currentColor`. DT-198 mówił „lista `Course` nie ma pola autora”,
  sprawdzone `grep author`; pole to `instructor`, wyświetlane w `InstructorPanel`. Obie uwagi codexa trafne,
  wcielone przed bramką 2.

## Rozwiązanie
Linia w `references/self-check.md` (2026-11-18): twierdzenie, że czegoś nie ma, sprawdza się po znaczeniu:
synonimy (author, instructor, lecturer), każda biblioteka, którą repo trzyma (stara `packages/ui/src/components`
obok `ds`), i precedens, którego żywy kod już używa dla brakującej rzeczy.
