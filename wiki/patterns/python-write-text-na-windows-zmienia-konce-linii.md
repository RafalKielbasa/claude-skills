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
- 2026-10-21, sesja 541cf3f0-bb8c-449a-92fd-d69e74d140fc (id claude.ai niedostępny; Baza wiedzy, krok wiki
  `podsumuj-sesja-claude`): drugi dowód. `io.open(p, 'w', encoding='utf-8')` przy dopisywaniu do `index.md`
  i `log.md` obu wiki zapisał CRLF w plikach trzymanych w LF. Commit `b2db7b58` pokazał „584 insertions(+),
  447 deletions(-)” zamiast kilkunastu linii. Wykryte dopiero po commicie, w `git show --stat`, a nie przed nim;
  naprawione bajtowo i commitem `c74b7fd`. **Kontrola z tej strony zawiodła:** w Git Bashu
  `git show … | grep -c $'\r'` zwrócił 0 dla pliku z 81 liniami CRLF, a `tr -cd '\r' | wc -c` zwrócił 81.

## Rozwiązanie
Przed zapisem pliku repo skryptem sprawdź jego końce linii przez `tr -cd '\r' < plik | wc -c`, nie
przez `grep -c $'\r'`, bo grep w Git Bashu potrafi dać 0 na pliku w CRLF. Zapisuj tym samym stylem:
`write_text(s, encoding='utf-8', newline='\n')` albo `io.open(..., newline='\n')` dla LF, bajtowo dla
CRLF. Przed commitem `git diff --stat`: liczba zmienionych linii nieproporcjonalna do zmiany to sygnał
końców linii.
