# symulacja-doboru-osi-przed-bramka-zatwierdzenia

- **Skill:** code-review-master
- **Typ:** sukces
- **Status:** otwarty

## Opis
W trybie `init` szkic `.claude/review/config.md` przechodzi przez własny parser
skilla (`parseConfigDoc` + `mergeConfig` z `global.md` + `validateConfig`) i przez
`selectAxes` na trzech reprezentatywnych zestawach plików, zanim trafi do
użytkownika. Symulacja pokazała dwa defekty doboru, których nie widać z lektury
szkicu: grupę `web` odkładaną za globalnym `debug-leftovers` na PR-ze webowym
i `auth-session` budzącą się na każdej stronie apeksu przez glob `(apex)/**`.
Oba poprawione przed bramką; użytkownik zatwierdził szkic bez poprawek.

## Przyczyna źródłowa
Config jest oceniany jak dokument, a działa jak program. `selectAxes` na zimnym
kursorze szereguje osie `rotate` kolejnością wstawienia do mapy, w której osie
globalne stoją przed repo-osiami, więc wąska oś na dotknięcie z `rank: rotate`
przegrywa z globalnym `debug-leftovers`; szerokość globu widać dopiero po
zderzeniu z realną listą plików. Ten sam mechanizm co w
`kod-referencyjny-planu-nigdy-nie-uruchomiony`, tylko od strony sukcesu.

## Dowody
- 2026-09-07, sesja session_01YYxVxgP1QYqdEoh63ozDfs: `validate-config.mjs`
  w scratchpadzie importował `lib/config.mjs` i `lib/axes.mjs`; pierwsza
  symulacja: PR web → `deferred: web-frontend, web-design-system`, PR lessons →
  `deferred: nestjs-architecture, landing-visibility`. Po zmianach (`rank: always`
  dla osi na dotknięcie, `nestjs-architecture` w grupie `api-core` z
  `performance-database`, glob zawężony do `(apex)/(public)/**` i
  `(apex)/auth/**`) PR web → `deferred: —`; parser `problems: []` przed i po.
  Osobno: po kroku 6 (redukcja `docs/review-guide.md` do wskaźnika) linie
  `Source: docs/review-guide.md §N` w configu wisiały w powietrzu i wymagały
  przepisania na „former docs/review-guide.md §N".

## Rozwiązanie
Do trybu `init`, przed krokiem 4 („Show the user the complete drafted
config.md"): „Before showing the draft, parse it with `lib/config.mjs`
(`parseConfigDoc`, `mergeConfig` against the global doc, `validateConfig`) and
run `lib/axes.mjs#selectAxes` with an empty state on three representative file
sets — an api change, a web change, a docs-only change. Show the resulting
selection table next to the draft. An on-touch axis that must run whenever its
files are touched needs `rank: always`: with `rotate` it queues behind the
global rotate axes on a cold cursor." Do kroku 6: „When the source document is
reduced to a pointer, rewrite the config's `Source:` lines that cite its
sections (`former docs/review-guide.md §4`) in the same step."
