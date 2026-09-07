# reczne-dopiski-autora-w-drzewie-przed-redakcja

- **Skill:** kurs-redakcja
- **Typ:** sukces
- **Status:** otwarty

## Opis
Przed uruchomieniem agentów `git status` i `git diff` plików lekcji pokazały
niezacommitowane ręczne zmiany Rafała w scenariuszu. Zostały nazwane w bramce
wejścia i przekazane agentowi wprost jako treść do zachowania z językiem do
poprawy, zamiast trafić do redakcji anonimowo, jak reszta tekstu.

## Przyczyna źródłowa
Dopiski robione podczas klikania w n8n są najbardziej zweryfikowaną merytoryką
lekcji (`kursy/_wspolne/redakcja.md` → „Scenariusz jest źródłem prawdy"), ale
są pisane szybko: literówki, brak interpunkcji, zapis fonetyczny z głowy
(„kanseld", „Qied", „szift"), bez wpisu w `wymowa.md`. Agent bez tego sygnału
widzi fragment odstający jakością od reszty i może go „poprawić" do brzmienia
sprzed dopisku albo potraktować literówkę jako decyzję autora. Dopiski są też
jedynym miejscem, o którym z góry wiadomo, że artykuł się z nim rozjechał.

## Dowody
- 2026-09-07, sesja session_01BFVYzhLh64ykBPjopBZyHU: `git diff` M00L01 przed
  startem — dwie linie Rafała: „Kontrol plus zet cofa ostatnią zmianę na kanwie
  a kotrol plus szift plus zet deje cofa cofnięcie." oraz lista sześciu
  statusów z „"kanseld" czyli anulowane i Qied czyli zakolejkowane" bez kropki.
  Prompt agenta B nazwał oba miejsca: „treść merytoryczna ZOSTAJE, do poprawy
  język i zapis", z poleceniem decyzji fonetycznej dla Shift, Canceled, Queued
  i wpisu do `wymowa.md`. Wynik: oba fragmenty czyste, 4 nowe wiersze wymowy
  (`szift`, `"zet"`, `"Kanseld"`, `"Kjud"`), a rozjazd z artykułem (cztery
  statusy, brak Ctrl+Shift+Z) zgłoszony niezależnie przez oba agenty
  i domknięty w bramce decyzją Rafała („dopisz").

## Rozwiązanie
W kroku 1 skilla: `git diff` plików lekcji przed redakcją. Każdy
niezacommitowany fragment wymienić w planie (krok 3) i w prompcie agenta jako
„zweryfikowana merytoryka, zachować; język, interpunkcja i zapis fonetyczny do
poprawy; nowe nazwy do `wymowa.md`". W raporcie bramki osobno pokazać, które
dopiski scenariusza trzeba dopisać do artykułu.
