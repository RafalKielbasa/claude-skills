# paczka-lektora-kasowana-w-calosci-blokuje-render

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
`npm run video` na lekcji toru B pada na `EBUSY: resource busy or locked,
unlink 'video/lektor/03-01.mp3'`, choć zmieniły się wyłącznie segmenty 8 i 9.
Render zatrzymuje się **po** płatnym TTS, na etapie pakowania, i nie da się go
dokończyć, dopóki jakaś aplikacja trzyma otwarty dowolny plik z tego katalogu.

## Przyczyna źródłowa
`zbudujPaczkeLektora` w `tools/course-pipeline/src/lektor.js:47` zaczyna od
`fs.rmSync(lektorDir, { recursive: true, force: true })`, potem `mkdirSync`
(`:48`) i `copyFileSync` dla każdej pozycji scenariusza (`:54`). Paczka nie jest
aktualizowana przyrostowo — jest kasowana i składana od zera, więc blokada na
segmencie, którego nikt nie tknął, zatrzymuje render zmiany w zupełnie innym
miejscu lekcji. Windows nie pozwala skasować pliku otwartego bez
`FILE_SHARE_DELETE`, a odtwarzacze i podgląd Eksploratora tak właśnie go otwierają.

## Dowody
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: M02L01, zmiana objęła cztery bloki narracji
  w segmentach 8 i 9. TTS przeszedł (cztery nowe pliki w `video/audio/`),
  pakowanie padło na `03-01.mp3`. Sonda
  `[System.IO.File]::Open($p,'Open','ReadWrite','None')` po całym katalogu
  pokazała 10 zablokowanych plików: `03-01`…`03-04` i `04-01`…`04-06`
  — ciągły blok, czyli aplikacja z wczytaną listą, nie pojedynczy podgląd.
  Z procesów kandydatami były OBS 31.0.1 i Eksplorator; po zamknięciu OBS-a
  ten sam `npm run video` przeszedł za pierwszym razem i **za darmo**, bo całe
  TTS było już w cache'u. Ponowienie bez zamknięcia aplikacji dało dokładnie
  ten sam błąd — blokada nie jest przejściowa.

## Rozwiązanie
W kroku 3 `/kurs-video` („Sprawdź konfigurację") dla `typ_video: demo` dodać
sondę zajętości `video/lektor/`: próba otwarcia każdego `*.mp3`
na wyłączność, a przy niepowodzeniu — lista zablokowanych plików i komunikat,
że trzeba zamknąć odtwarzacz, edytor albo OBS-a. Taniej zrobić to przed
renderem niż po nim: sonda kosztuje sekundę, a diagnoza `EBUSY` z jednej nazwy
pliku kosztuje turę rozmowy i wygląda na awarię pipeline'u.

Przy samym `EBUSY` na `video/lektor/`: **nie powtarzać renderu w nadziei, że
blokada puszcza** i nie tłumaczyć błędu jako szkody — płatna część (ElevenLabs,
HeyGen) wykonuje się przed pakowaniem i jej wynik zostaje w `video/audio/`
oraz `video/avatar/`, więc ponowienie po zwolnieniu blokady jest darmowe.
