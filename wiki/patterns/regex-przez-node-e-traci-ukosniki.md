# regex-przez-node-e-traci-ukosniki

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis

Regex sprawdzany przez `node -e "..."` w Bashu dotarł do silnika okrojony: `[^\S\r\n]` jako
`[^S\r\n]`, `\[UWAGA:` jako `[UWAGA:`. Wzorzec skompilował się bez błędu, tylko znaczył co innego,
i wypisał 20 fałszywych FAIL-i wyglądających jak prawdziwy defekt sprawdzanego wyrażenia.

## Przyczyna źródłowa

Ukośnik jest znakiem ucieczki dla powłoki i dla literału regexu naraz, więc każdy przechodzi przez
dwa poziomy zdejmowania, a ile ich trzeba, zależy od rodzaju cudzysłowu i od powłoki. Awaria jest
cicha: nie ma komunikatu składniowego, bo `[^S\r\n]` to poprawna klasa znaków, tylko inna. Wynik
wygląda dokładnie jak wynik testu, który coś wykrył, więc pierwsza reakcja idzie w stronę
poprawiania wzorca zamiast sposobu jego uruchomienia.

## Dowody

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: walidacja regexu usuwania znaczników
  `[UWAGA: ...]` przez `node -e` w Bashu dała 20 FAIL-i na 22 kształty wejścia, łącznie z przypadkami,
  które wcześniej przechodziły. Ten sam wzorzec zapisany do pliku `.mjs` i uruchomiony przez
  `node plik.mjs` dał 24/24 OK. Różnicą było wyłącznie przejście przez string powłoki.

## Rozwiązanie

Regexu nie przepuszczać przez `-e` w stringu powłoki. Zapisać skrypt do pliku `.mjs` w katalogu
tymczasowym zadania i uruchomić `node plik.mjs` — wtedy literał trafia do silnika dokładnie tak, jak
został napisany, i nadaje się do porównania znak w znak z wersją w repo. Dotyczy tak samo `python -c`
i `perl -e`. Sygnał ostrzegawczy: test sprawdzający wzorzec pada na przypadkach, które nie mają z jego
zmianą nic wspólnego — wtedy najpierw sprawdzić, co naprawdę dostał interpreter, wypisując `RE.source`.
