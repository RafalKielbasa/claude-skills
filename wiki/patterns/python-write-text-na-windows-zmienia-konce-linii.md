# python-write-text-na-windows-zmienia-konce-linii

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skrypt Pythona dopisujący kilka linii do pliku repo dał diff całego pliku, bo zmienił końce
linii. Przy wygenerowanym HTML ten sam mechanizm zamienił 22 linie zmiany w 2214 linii diffu.

## Przyczyna źródłowa
`Path.read_text()` normalizuje `\r\n` do `\n`, a `write_text()` bez `newline=` w trybie
tekstowym na Windowsie zapisuje `\n` jako `\r\n`. Plik w LF wraca jako CRLF; plik w CRLF
przepuszczony przez narzędzie piszące LF wraca jako LF. `git diff` pokazuje wtedy każdą linię.

## Dowody
- 2026-10-14, sesja e61003ff (id claude.ai niedostępny; Baza wiedzy, bramka do `platforma/`):
  `zadania.js` (+11 linii) wyszedł w diffie w całości. Naprawione `write_text(..., newline=chr(10))`
  po sprawdzeniu, że repo trzyma te pliki w LF. Później `makieta.html`: HEAD w CRLF, nowa wersja
  w LF, `git diff --ignore-cr-at-eol` pokazał 22 linie; plik ujednolicony do CRLF przed commitem.

## Rozwiązanie
Przed zapisem pliku repo skryptem sprawdź jego końce linii (`grep -c $'\r'`) i zapisuj tym samym
stylem: `write_text(s, encoding='utf-8', newline='\n')` dla LF albo bajtowo dla CRLF. Przed
commitem `git diff --stat` — liczba zmienionych linii nieproporcjonalna do zmiany to sygnał
końców linii.
