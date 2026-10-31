# harness-odmawia-subagentowi-zapisu-raportu

- **Skill:** ogólny (dotyka superpowers:subagent-driven-development)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Implementer kończy pracę (commit, testy, strażniki), a zapis pliku raportu do workspace SDD zostaje odrzucony
komunikatem „Subagents should return findings as text, not write report files”. Raport, na którym opiera się
recenzja zadania, ląduje w wiadomości zwrotnej subagenta — długiej, bo pełnej — i kontroler musi go sam zapisać
do pliku, żeby recenzent go dostał.

## Przyczyna źródłowa
Szablon implementera skilla każe pisać pełny raport do pliku i odsyłać krótki kontrakt, a harness w części
przebiegów traktuje zapis „raportu” przez subagenta jako niepożądany i odmawia. Odmowa nie jest regularna:
w tej samej sesji inne subagenty (sonnet i opus) zapisywały raporty do tego samego katalogu bez przeszkód,
więc nie da się jej przewidzieć z modelu ani ścieżki.

## Dowody
- 2026-10-30, sesja a65d3063-3840-4e65-beaf-1f6c93f7abc0 (id claude.ai niedostępny; code-busters-v2, plan 9 W5,
  zadanie 5, opus): implementer zgłosił „the harness refused task-5-report.md … I did not work around it with Bash”
  i wkleił ~200 linii raportu do odpowiedzi. Kontroler zapisał go do `task-5-report.md` przez `Write` (koszt:
  cały raport przez kontekst kontrolera). Od zadania 7 każdy dispatch miał zdanie „If the harness refuses that
  write, put the full report text in your reply instead (… under a line `FULL REPORT`)”; żaden późniejszy zapis
  nie został odrzucony.

## Rozwiązanie
W każdym dispatchu implementera i recenzenta, który ma pisać plik raportu, dodaj fallback: „jeśli zapis zostanie
odrzucony, wklej pełny raport w odpowiedzi pod linią `FULL REPORT` i nie obchodź odmowy Bashem”. Kontroler,
który dostał raport w treści, zapisuje go sam do oczekiwanej ścieżki przed dispatchem recenzenta i oznacza
w pliku, że zapisał go kontroler.
