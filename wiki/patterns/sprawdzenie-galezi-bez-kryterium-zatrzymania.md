# sprawdzenie-galezi-bez-kryterium-zatrzymania

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Reguła użytkownika każe przed każdym commitem sprawdzić gałąź i podać ją
w raporcie. Sprawdzenie się odbywa, gałąź trafia do raportu — ale reguła nie
mówi, co zrobić, gdy nazwa gałęzi nie pasuje do wykonywanej pracy. Commit i tak
powstaje, a rozbieżność zostaje nazwana dopiero pod nim.

## Przyczyna źródłowa
Reguła jest obowiązkiem sprawozdawczym, nie bramką. Powód jej istnienia jest
zapisany wprost („working tree bywa współdzielony z drugą sesją i commit potrafi
wylądować na cudzej gałęzi") i opisuje sytuację, w której commit ma NIE powstać —
ale sam zapis kończy się na „podaję w raporcie". Sprawdzenie bez kryterium
odrzucenia nie zmienia decyzji, tylko ją dokumentuje.

## Dowody
- 2026-09-22, sesja (id niedostępny), repo „Baza wiedzy" (tryb: commituję sam,
  bez pytania): praca dotyczyła renderu wideo lekcji `agenty-ai` 3.1, a
  `git branch --show-current` zwrócił `feature/tor-stacjonarny` — gałąź kursu
  stacjonarnego z innej pracy (`43534c6`, `bdc4552`, `20c9efd`). Gałąź została
  sprawdzona przed commitem, zgodnie z regułą, i podana w raporcie razem ze
  zdaniem, że nazwa nie pasuje do zadania — ale commit `1bc79c1` w tym momencie
  już istniał. Drugie wystąpienie tego samego: w pamięci projektu wisi wcześniejsze
  („sales+other commit na cudzej gałęzi TTS — do posprzątania"), tylko nigdy nie
  zapisane jako dowód. Obserwacja niepewna w jednym punkcie: nie wiem, czy Rafał
  nie pracuje na tej gałęzi świadomie przez cały dzień — wtedy commit jest
  w porządku, a problemem zostaje sama kolejność (commit przed rozpoznaniem).

## Rozwiązanie
Gdy temat gałęzi nie pokrywa się ani z katalogiem zmienianych plików, ani
z tematem sesji — nie commitować. Zatrzymać się, podać gałąź, nazwać
rozbieżność i zapytać, zanim commit powstanie; propozycję treści commita podać
od razu, żeby zgoda kosztowała jedno słowo. Samo „sprawdzam i raportuję"
zostawić tam, gdzie gałąź pasuje.
