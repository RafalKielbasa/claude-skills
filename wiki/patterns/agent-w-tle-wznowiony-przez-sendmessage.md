# agent-w-tle-wznowiony-przez-sendmessage

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Dwóch subagentów w tle (szkic danych CMS i pakiet ekranów) zatrzymało się razem z zakończeniem
poprzedniego procesu sesji, zanim zapisali wynik. Wznowienie przez `SendMessage` z ich
identyfikatorami dokończyło oba zadania z zachowanym kontekstem, bez nowego dispatchu.

## Przyczyna źródłowa
Subagenci w tle żyją w procesie CLI sesji: zakończenie procesu (restart okna, wznowienie sesji)
przerywa ich bez wyniku, ale transkrypt agenta zostaje, więc `SendMessage` może go kontynuować.
Nowy dispatch zaczyna od zera i powtarza całą pracę.

## Dowody
- 2026-10-16, sesja 7875e423-9ae8-4e55-a56b-31766c608f4e (id claude.ai niedostępny): oba agenty
  przerwane bez pliku wyniku; po wznowieniu przez `SendMessage` dokończone (szkic danych CMS
  ok. 2 tys. słów, pakiet ekranów z 14 przerysowanymi grafikami i audytem kontrastu).

## Rozwiązanie
Po wznowieniu sesji sprawdź stan subagentów w tle (`ListAgents`), zanim cokolwiek dispatchujesz
ponownie; przerwanego wznów przez `SendMessage` z prośbą o dokończenie i zapis wyniku do
wskazanego pliku. Długim subagentom w tle podawaj w prompcie ścieżkę pliku wyniku i każ
zapisywać wynik przyrostowo, żeby przerwanie nie zabierało całej pracy.
