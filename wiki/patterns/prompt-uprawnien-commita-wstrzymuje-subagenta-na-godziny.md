# prompt-uprawnien-commita-wstrzymuje-subagenta-na-godziny

- **Skill:** ogólny (dotyczy superpowers:subagent-driven-development)
- **Typ:** porażka
- **Status:** otwarty

## Opis
W sesji w tle wykonującej plan subagentami każdy implementer kończy zadanie `git commit`, a repo
ma na commit regułę `ask`. Prompt czeka na Rafała, który nie patrzy na zadanie w tle, więc subagent
stoi godzinami, a kontroler widzi tylko „agent pracuje”. Termin bramki przesuwa się o dni.

## Przyczyna źródłowa
Plan każe commitować po każdym zadaniu, a `.claude/settings.local.json` repo kodu ma
`ask` na `git commit` (reguła z globalnego `CLAUDE.md`: commit w repo kodu tylko przez prompt).
Nic nie zawiadamia Rafała, że prompt czeka; kontroler nie odróżnia czekania na prompt od długiej
pracy, bo subagent nie raportuje przed commitem.

## Dowody
- 2026-10-22/26, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf), plan M1 migracji Kodożerców w `code-busters-mobile`: implementer Task 2 trwał 13,8 h (commit 23.10 o 10:31, dispatch 22.10 wieczorem), poprawka copy Task 9 5,7 h (commit 23:10 po 17:23), Task 13 5,8 h, fala poprawek po recenzji całej gałęzi 16 h. Bramka na telefonie zaplanowana na 23.10 wieczorem przesunęła się na 26.10. Częściowo pomogło puszczanie recenzji zadania N równolegle z implementerem N+1.

## Rozwiązanie
Na starcie wykonania planu w repo z `ask` na `git commit` i z terminem: powiedz w pierwszej
odpowiedzi, że każde zadanie zatrzyma się na prompcie commita, i daj warianty: [A] tymczasowa
reguła `allow` dla commitów na gałęzi planu w tej sesji (Rafał dopisuje sam), [B] implementer tylko
staguje i raportuje, a kontroler commituje paczką, gdy Rafał jest obecny, [C] zostaje prompt.
Gdy implementer nie raportuje dłużej niż typowe zadanie, napisz jedną linię „prawdopodobnie czeka
prompt commita” zamiast milczeć.
