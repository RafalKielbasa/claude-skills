# lekcja-demo-z-krokami-poza-zasiegiem-automatu

- **Skill:** kurs-lekcja (krok 3d, konspekt nagrania), dotyka kurs-nagrywanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Konspekt lekcji demo w kursie z `nagrywanie: { automat: true }` powstaje bez sprawdzenia, czy automat nagra jego kroki. Lekcja agenty-ai 4.1 miała dwie trzecie ekranu poza przeglądarką automatu: edytor tekstu na pulpicie, pobrany plik w folderze, czat Claude w nowej usłudze, formularz w nowej karcie. Wyszło to dopiero przy przejściu zgodności tuż przed nagraniem i zamieniło się w decyzję o sposobie nagrania (ręcznie albo silnik pulpitu z nieścalonej gałęzi) oraz w osobny spec.

## Przyczyna źródłowa
`/kurs-lekcja` pisze konspekt jako listę czynności dla człowieka i nie zna granic automatu: przeglądarka ma `acceptDownloads: false` (`tools/nagrywanie/src/profil.js:88`), nową kartę otwartą przez stronę straż blokuje (`src/ochrona.js:365`), schowek jest omijany (`src/dzialania.js:66`), a każda usługa spoza `kurs.yaml nagrywanie.uslugi` to jednorazowe przygotowanie. Te granice zna dopiero `/kurs-nagrywanie`, uruchamiany po zatwierdzeniu treści.

## Dowody
- 2026-11-12, sesja 62c8c4bb-8377-436d-a2b6-aea1aa8bd57b: lekcja 4.1 („Każdy przepływ n8n to obiekt JSON”, treść z 2026-09-22) - segmenty 2-8 w edytorze tekstu, krok 27 pobiera plik, krok 36 przełącza do Claude (usługi claude.ai nie ma w żadnym kursie), krok 40 otwiera formularz w nowej karcie. Raport subagenta: „(b) the text editor and (c) download / Explorer / editor would be manual retakes; (d) needs a new signed-in claude.ai service plus a spec”. Rafał wybrał nagranie automatem na silniku pulpitu z PR #841 (D1 A) i VS Code w filmie (D3 A); spec nagrania przesunięty po zatwierdzeniu treści.

## Rozwiązanie
W `/kurs-lekcja`, krok 3d, dla kursu z `nagrywanie.automat: true`: przed napisaniem konspektu przejdź jego kroki i przy każdym nazwij usługę z `kurs.yaml nagrywanie.uslugi`, która go wykona. Krok poza przeglądarką, pobranie pliku, nowa karta otwarta przez stronę albo usługa spoza listy idzie do tabeli przygotowania jako wiersz „Zasięg automatu” i do bramki jako pytanie: przeprojektować krok, dogrywka ręczna czy rozbudowa automatu. Treść nie powinna zakładać narzędzia, którego nagranie nie obsłuży, bez decyzji Rafała.
