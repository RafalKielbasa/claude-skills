---
typ: demo
---

<!--
Narracja do wideo instruktażowego prezentu z live'a <data wydarzenia>.
Tor B bez avatara: Rafał nagrywa ekran bez dźwięku, lektor idzie z paczki
`prezent/lektor/` wygenerowanej komendą `npm run lektor`, montaż finalny
robi Rafał sam w swoim edytorze.

Wzór: `live-events/2026-08-27-agenci-ai/prezent/narracja.md`.

Zasady tego pliku (parsuje go `tools/course-pipeline/src/scenariusz.js`,
dokładnie ten sam parser, którego używa `/kurs-video` dla toru B):
- Jeden `## [ekran: screencast] <tytuł>` na każdy krok z `instructions.md`,
  który rzeczywiście da się pokazać na ekranie, w tej samej kolejności co
  tam. Krok bez niczego do pokazania (np. "załóż konto" zanim nagranie w
  ogóle się zaczęło) nie dostaje segmentu. Dwa sąsiednie kroki, które na
  ekranie wyglądają jak jedna czynność, mogą dzielić jeden segment — wzór
  robi to z krokami 3+4 i 6+7.
- Linie `[AKCJA: ...]` są instrukcją dla nagrywającego (co kliknąć, na co
  najechać) — parser wycina je z tekstu lektora, więc mogą być tak
  szczegółowe, jak potrzeba.
- Wszystko poza `[AKCJA: ...]` w segmencie to zwykła proza, którą czyta
  lektor: bez list, bez pogrubień, bez nagłówków w środku segmentu.
- Nazwa własna w cudzysłowie przy każdym wystąpieniu, wymowa fonetyczna dla
  nazw trudnych dla TTS (n8n → `"en osiem en"`, JSON → `dżejson`) — pełna
  lista i uzasadnienie: `kursy/_wspolne/redakcja.md`.
- Ten komentarz nie trafia do lektora (parser go pomija), ale i tak usuń go
  z gotowego pliku — jest instrukcją wypełnienia, nie treścią.
-->

## [ekran: screencast] <tytuł pierwszego kroku — identyczny z `instructions.md`>

[AKCJA: <stan ekranu na starcie tego segmentu, np. zalogowany "n8n", widok listy workflowów>]

<pierwsze zdanie: zakładasz, że widz stoi w tym samym miejscu co Ty — jeśli
nie, odsyłasz go do instructions.md, żeby wrócił, kiedy dogoni>.

[AKCJA: <konkretna czynność do wykonania na ekranie w tym miejscu>]

<tekst lektora towarzyszący tej czynności — mów to, co widz właśnie widzi,
nie to, co dopiero będzie>.

## [ekran: screencast] <tytuł drugiego kroku>

[AKCJA: <czynność>]

<tekst lektora. Jedno zdanie o rzeczy, na której najczęściej ktoś się
potyka, jeśli taka jest — wzór robi to przy strefie czasowej i przy karcie
płatniczej Google>.
