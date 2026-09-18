---
typ: demo
---

<!--
Narracja do wideo instruktażowego prezentu z live'a <data wydarzenia>.
Tor B bez avatara: Rafał nagrywa ekran bez dźwięku, lektor idzie z paczki
`prezent/lektor/` wygenerowanej komendą `npm run lektor`, montaż finalny
robi Rafał sam w swoim edytorze.

Wzór: `live-events/2026-09-21-mail-z-zalacznikiem/prezent/narracja.md`.
Sierpniowy `2026-08-27-agenci-ai/prezent/narracja.md` jest starszy od reguły
z 18.09.2026 i pokazuje zakładanie credentiali — bierz z niego kształt
segmentu, nigdy strukturę.

Zasady tego pliku (parsuje go `tools/course-pipeline/src/scenariusz.js`,
dokładnie ten sam parser, którego używa `/kurs-video` dla toru B):

- NAGRANIE NIE POKAZUJE ZAKŁADANIA CREDENTIALA. Ani ekranu logowania, ani
  okna zgody, ani wklejania klucza. Zakładanie kont jest w `instrukcja.md`
  i tylko tam (SKILL.md §7, reguła Rafała z 18.09.2026).
- ZDJĘCIE CZERWONYCH TRÓJKĄTÓW to osobny segment, ZARAZ PO IMPORCIE, przed
  zwiedzaniem — kanwa ma być domknięta, zanim zaczniemy ją oglądać. To jedyne
  miejsce, gdzie klocek się w ogóle otwiera, i to na sekundę: dwuklik i od razu
  zamknięcie, a „en osiem en" samo podstawia logowanie, które konto już ma.
  Bez wybierania z listy, bez ekranu logowania, bez okna zgody — linia
  `[AKCJA: ...]` musi to mówić wprost.
- LICZBY TRÓJKĄTÓW NIE WPISUJEMY JAKO STAŁEJ. Przy imporcie „en osiem en"
  podstawia te logowania, które konto już ma, więc u Rafała może być ich trzy,
  a u widza pięć. Segment podaje liczbę z ekranu Rafała, mówi wprost, że
  u widza będzie inaczej i dlaczego, i tłumaczy, co znaczy trójkąt, który po
  wejściu i wyjściu został: tego logowania jeszcze nie ma, zakłada się je raz
  według instrukcji.
- Nagranie zaczyna się na PUSTYM workflow, importuje plik i przechodzi
  KURSOREM od klocka do klocka, od lewej do prawej. Każdy klocek dostaje jedno
  albo dwa zdania: co robi. KLOCKÓW NIE OTWIERAMY — bez dwukliku, bez ustawień,
  bez nazw pól, bez stałych, bez tipów. Wyjątek to segment o logowaniach.
- Film odpowiada na pytanie „co to jest i co robi". Na „jak to uruchomić
  u siebie" odpowiada `instrukcja.md` i tam idzie wszystko, co trzeba kliknąć,
  wpisać albo zmienić. Co wypadło z narracji, MUSI dać się znaleźć w instrukcji.
- KRÓTKO: cała narracja to około 3000–4000 znaków lektora w mniej więcej pięciu
  segmentach (wzór z 21.09: 3735 znaków). Dłuższy szkic prawie zawsze znaczy,
  że wjechał do niego materiał instrukcji — przenosisz go, a nie skracasz zdania.
- Segmenty idą w kolejności kanwy, nie w kolejności kroków z `instrukcja.md`.
  Pierwszy: pusta kanwa, import, przegląd całości i jedno zdanie odsyłające do
  instrukcji. Środkowe: klocki w grupach znaczeniowych (skąd bierze dane / co
  z tym robi), żaden segment nie może być wielokrotnie dłuższy od sąsiadów.
  Potem segment o logowaniach. Ostatni: gotowy efekt.
- Gotowy efekt pokazujemy z WCZEŚNIEJSZEGO uruchomienia, nigdy z „Test
  workflow" na wizji — świeżo zaimportowane klocki nie mają credentiali, więc
  test z założenia się wywali. To musi stać w linii `[AKCJA: ...]`, żeby
  nagrywający przygotował materiał zawczasu. Z tego samego powodu przełącznika
  na „Active" NIE przestawiamy na wizji — pokazujemy go kursorem i mówimy, kiedy
  się go przestawia.
- PIERWSZA linia `[AKCJA: ...]` w pliku mówi i o stanie startowym (pusty,
  świeżo utworzony workflow), i o samym zakazie — nagrywający czyta tę linię
  i nic więcej na ten temat.
- Linie `[AKCJA: ...]` są instrukcją dla nagrywającego (co kliknąć, na co
  najechać) — parser wycina je z tekstu lektora, więc mogą być tak
  szczegółowe, jak potrzeba.
- Wszystko poza `[AKCJA: ...]` w segmencie to zwykła proza, którą czyta
  lektor: bez list, bez pogrubień, bez nagłówków w środku segmentu.
- Nazwa własna w cudzysłowie przy każdym wystąpieniu, wymowa fonetyczna dla
  nazw trudnych dla TTS (n8n → `"en osiem en"`, Gmail → `dżimail`, JSON →
  `dżejson`) — pełna lista i uzasadnienie: `kursy/_wspolne/redakcja.md`.
- Ten komentarz nie trafia do lektora (parser go pomija), ale i tak usuń go
  z gotowego pliku — jest instrukcją wypełnienia, nie treścią.
-->

## [ekran: screencast] Import pliku

[AKCJA: pusty, świeżo utworzony workflow w n8n — czysta kanwa, żadnego klocka; w żadnym momencie tego nagrania nie pokazuj ekranu logowania Google ani okna zgody. Wskazanie gotowego logowania z rozwijanej listy jest w porządku i ma własny segment niżej]

<pierwsze zdanie: stoisz na pustym workflow. Zakładanie konta i robienie
logowań do usług jest w instrukcji obok, nie tutaj — tutaj wchodzimy do
środka i oglądamy automatyzację klocek po klocku>.

[AKCJA: trzy kropki, „Import from File…", wskaż plik dżejson, kanwa wypełnia się klockami]

<tekst lektora do samego importu — krótko, to nie jest atrakcja tego wideo>.

[AKCJA: oddal widok tak, żeby cała kanwa mieściła się na ekranie]

<przegląd całości: ile klocków, co robi linia od lewej do prawej, skąd
czerwone trójkąty i jedno zdanie odsyłające po konta do instrukcji>.

## [ekran: screencast] Czerwone trójkąty

[AKCJA: najedź kursorem kolejno na klocki z czerwonym trójkątem — podaj, ile ich jest na TWOIM ekranie]

<ile trójkątów widać tutaj, dlaczego u widza może być inaczej (przy imporcie
„en osiem en" podstawia logowania, które konto już ma) i ile ich zobaczy ktoś,
kto zaczyna od zera>.

[AKCJA: dwuklik na pierwszy klocek z trójkątem i od razu zamknij go krzyżykiem; pokaż, że trójkąt zniknął. Nie pokazuj ekranu logowania ani okna zgody]

<co znaczy trójkąt i dlaczego samo wejście i wyjście wystarcza>.

[AKCJA: to samo w pozostałych klockach z trójkątem, szybko jeden po drugim]

<krótko, bez powtarzania tego samego zdania przy każdym klocku>.

[AKCJA: oddal widok na całą kanwę; pokaż stan trójkątów po tym przejściu]

<co zostało, co znaczy trójkąt, który przetrwał, i przejście do zwiedzania>.

## [ekran: screencast] <tytuł grupy klocków, np. „Skąd bierze dane">

[AKCJA: najedź kursorem na klocek „<nazwa>" i zatrzymaj się na chwilę; nie otwieraj klocka — tak samo w całym tym segmencie]

<jedno albo dwa zdania: co ten klocek robi. Bez ustawień, bez nazw pól,
bez tipów>.

[AKCJA: przesuń kursor na „<kolejny klocek>"]

<jedno albo dwa zdania o kolejnym klocku>.

## [ekran: screencast] <ostatni segment: wysyłka i gotowy efekt>

[AKCJA: gdy po segmencie o trójkątach kanwa jest czysta — przestaw przełącznik „Inactive" na „Active" i potwierdź. Gdy jakiś trójkąt został — tylko najedź na przełącznik kursorem i go NIE przestawiaj]

<kiedy przestawia się ten przełącznik i co się wtedy dzieje>.

[AKCJA: pokaż gotowy efekt z wcześniejszego uruchomienia — NIE uruchamiaj „Test workflow" na wizji]

<co widz dostaje i czego automatyzacja nie robi bez niego>.
