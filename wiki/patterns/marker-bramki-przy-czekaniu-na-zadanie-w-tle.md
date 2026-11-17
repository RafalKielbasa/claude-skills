# marker-bramki-przy-czekaniu-na-zadanie-w-tle

- **Skill:** ogólny (protokół odpowiedzi, hub)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Tura kończy się, bo zadanie w tle (testy, build) jeszcze biegnie, a ostatnia linia brzmi „⏸ Czeka na decyzję: nic od Ciebie — czekam na wynik testów w tle”. Hub czyta marker z ostatniej linii i pokazuje sesję jako czekającą na Rafała, choć żadnej decyzji nie ma.

## Przyczyna źródłowa
Protokół odpowiedzi zna jedno zakończenie tury, która nie jest raportem: marker bramki. Przy przerwie na zadanie w tle sięgam po niego odruchowo i zaprzeczam mu w treści. Marker jest sygnałem maszynowym, więc zaprzeczenie w zdaniu niczego nie zmienia.

## Dowody
- 2026-11-17, sesja d3dca57e-92f2-418a-b0e5-a28120ba9cf3 (id claude.ai niedostępny; code-busters-v2, worktree `landing-redesign`, przebudowa landingu DT-182 #1021): dwie tury zakończone markerem z treścią „nic od Ciebie”: przy pełnym zestawie testów przed commitem animacji i przy weryfikacji wyniku scalenia `main`. W obu przypadkach praca ruszyła sama po powiadomieniu o końcu zadania w tle.

## Rozwiązanie
Marker `⏸ Czeka na decyzję:` stawiaj wyłącznie wtedy, gdy następny krok należy do użytkownika. Turę przerwaną na zadanie w tle kończ zwykłą linią statusu bez markera, np. „Czekam na wynik testów w tle; po nim robię X.”
