# kotwica-konca-linii-gubi-pliki-crlf

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Wyszukiwanie z kotwicą `$` (`git grep "…from '@devstock/ui'$"`) po cichu pomija pliki, które w drzewie
roboczym mają końce linii CRLF. Wynik wygląda na komplet, więc zakres codemodu albo inwentaryzacji jest
za mały bez żadnego błędu, a stara wersja kodu zostaje w pominiętych plikach.

## Przyczyna źródłowa
Część plików repo ma w drzewie CRLF, a w indeksie LF (`git ls-files --eol`: `i/lf w/crlf`), przy
`core.autocrlf` nieustawionym. `git grep` i `grep` czytają drzewo, a `$` dopasowuje się tylko przed `\n`,
więc linia kończąca się `'\r` nie pasuje. `git status` tych plików nie pokazywał jako zmienionych.
Zakładam (niesprawdzone): dane stat w indeksie pochodzą z checkoutu z innym ustawieniem końców linii,
więc git nie czyta treści, a plik wygląda na czysty.

## Dowody
- 2026-11-03, sesja 9b10f517-b92d-49ad-8df9-1d567ac06e20 (id claude.ai niedostępny; code-busters-v2,
  toasty na `ds` `Alert`, #741): `git grep -lE "import \{[^}]*\bAlert\b[^}]*\} from '@devstock/ui'$"`
  zwrócił 31 plików i ta liczba przeszła bez pytania. Inwentaryzacja skryptem Node z innym regexem dała 36.
  Dry run codemodu (ten sam `$`) pominął `useActivity.tsx`, `javascriptTest.tsx`, `useJsTask.tsx`,
  `useCodeBlockTask.tsx` i `useCategorizeTask.tsx`. Złapane przez `comm -23` obu list, a potwierdzone
  przez `file` („with CRLF line terminators”) i `git ls-files --eol`. Bez drugiego detektora codemod
  przepiąłby 30 z 35 plików. Pliki zapisane z LF, więc diff pokazał tylko zmianę toastów.

## Rozwiązanie
Przy wyszukiwaniu, które wyznacza zakres zmian w repo na Windowsie, nie kotwicz wzorca na `$`: użyj `\r?$`
albo pomiń kotwicę. Przed codemodem uruchom `git ls-files --eol <zakres> | grep w/crlf`. Zakres ustal
dwoma niezależnymi detektorami i porównaj listy przez `comm`. Plik `i/lf w/crlf` zapisz z LF, wtedy diff
pokazuje tylko zmianę. Zob. [[python-write-text-na-windows-zmienia-konce-linii]] (strona zapisu tego
samego problemu) i [[skrypt-z-asercja-zamiast-serii-edycji]].
