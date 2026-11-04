# paczka-review-z-wygenerowanym-plikiem-zalewa-recenzenta

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Zadanie dodało wygenerowany moduł z fontem w base64 (153 KB w jednej linii). Paczka review ze skryptu `review-package` objęłaby go w całości; kontroler złożył paczkę ręcznie z pathspec `':!lib/theme/code-font-data.ts'` i pierwszymi oraz ostatnimi bajtami pliku, a w dispatchu napisał recenzentowi, żeby pliku nie czytał.

## Przyczyna źródłowa
`review-package` przyjmuje tylko zakres commitów, bez wykluczeń ścieżek, a wygenerowany artefakt w diffie zajmuje kontekst recenzenta, niczego nie wnosząc do oceny.

## Dowody
- 2026-11-04, sesja session_01WryF5UuECUFMWTUWLoBKsJ (lokalnie 78e3ca27-9604-4e3b-ad0b-1d0f66a80e7a) (code-busters-mobile, zadanie 11 planu ekranów wydania): ręczna paczka 31 KB zamiast ~185 KB; recenzent sprawdził nagłówek wygenerowanego pliku i skrypt generujący (determinizm), resztę z diffu. Tak samo przegląd końcowy całej gałęzi (500 KB bez modułu base64).

## Rozwiązanie
Gdy zadanie dodaje lub zmienia plik wygenerowany albo binarny, składać paczkę review z pathspec wykluczającym ten plik (`git diff BASE..HEAD -- . ':!<plik>'`) plus jego nagłówek i rozmiar, a w dispatchu recenzenta napisać, czego nie czytać i jak sprawdzić determinizm generatora. Kandydat na opcję `--exclude` w `review-package`.
