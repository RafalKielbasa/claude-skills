# klasyfikator-blokuje-zapisy-dry-run-w-subagencie

- **Skill:** ogólny (testy skilli na sucho przez subagenta)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Subagent testujący skill na sucho kieruje komendy zapisu (`kb-client upsert`, `gh issue create`)
przez wrapper, który je tylko loguje. Klasyfikator trybu auto blokuje te wywołania
niedeterministycznie: jeden przebieg przechodzi w całości, następny pada na pierwszym zapisie
z „[Auto-Mode Bypass]", a skrypt-launcher napisany przez subagenta — z „Code from External".
Bywa też odrzucony zwykły odczyt (`gh project item-list`). Faza wykonania zostaje
niezaobserwowana.

## Przyczyna źródłowa
Z punktu widzenia klasyfikatora komenda w argumentach wrappera to wciąż próba zapisu do systemu
zewnętrznego, a wrapper wygląda jak obejście zgody; ocena zależy od kontekstu przebiegu, więc
wynik się zmienia między uruchomieniami.

## Dowody
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny), repo Baza wiedzy: przebieg C pierwszej
  serii zalogował 14 zapisów przez `safe.py`; w drugiej serii C i oba przebiegi E padły na
  pierwszym upsercie; RED E padł już na odczycie `kb pending`. Bez obchodzenia blokady — trzy
  rulingi „wykonanie niezaobserwowane".

## Rozwiązanie
W teście na sucho nie wywołuj komend zapisu w żadnej postaci: runner ma **wypisać** do
`would-run.log` linię, którą by uruchomił, zamiast wołać wrapper. Odczyty potrzebne skillowi
(deduplikacja, tablica) dostarcz w fixture'ach jako gotowe pliki. Bramkę i wykonanie sprawdzaj
osobnymi asercjami, żeby blokada wykonania nie unieważniała wyniku bramki.
