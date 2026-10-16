# nowe-polecenie-przy-otwartej-bramce-nie-jest-zgoda

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Tura kończy się pytaniem bramki („⏸ Czeka na decyzję: czy akceptujesz…”). Użytkownik odpowiada nowym poleceniem, które w ogóle nie odnosi się do pytania. Nie potraktowałem tego jako zgody. Zacząłem nowe zadanie, a otwartą bramkę dołożyłem jako osobną decyzję (D5) do najbliższego pytania. Rafał rozstrzygnął ją jednym znakiem razem z resztą.

## Przyczyna źródłowa
Przejście do następnej pracy łatwo odczytać jako ciche „poprzednie jest OK”, zwłaszcza gdy poprzednia praca była poprawką zgłoszoną przez użytkownika. Akceptacja zmienia jednak stan, którego nie da się bezpiecznie zgadnąć: status w manifeście, commit, zamknięcie issue. `CLAUDE.md` mówi: „Brak odpowiedzi to nie jest zgoda”. Nowe polecenie to brak odpowiedzi na to pytanie, a nie odpowiedź na nie. Dołożenie bramki jako D-numeru do kolejnego pytania kosztuje zero dodatkowych tur.

## Dowody
- 2026-10-15, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny; Baza wiedzy): po „⏸ Czeka na decyzję: czy akceptujesz nowy `final.mp4` lekcji 0.3?” Rafał napisał tylko „lecimy M01L01”. Status 0.3 został bez zmian. Bramka renderu M01L01 zawierała D5: „„Lecimy M01L01” nie traktuję jako akceptacji 0.3”. Rafał odpowiedział „D1 A D2 a D3 A D4 A D5 A”. Dopiero wtedy wpisałem `status.video: zaakceptowane` i zrobiłem commit `68df44de`.
- 2026-10-16, sesja d92b17c0-d005-44e9-a147-6183eb2f8eb1 (id claude.ai niedostępny; vault): odpowiedź o tym, co zostało w hubie, kończyła się „⏸ Czeka na decyzję: kolejność pilota i poprawek w `hub-core` („Pilot przed poprawkami”)”. Rafał zadał nowe pytanie, o wysyłkę z huba do innych sesji. Indeks `hub.md` został bez zmian. Odpowiedź na nowe pytanie zakończyłem tym samym markerem z dopiskiem „z poprzedniej odpowiedzi”, więc hub dalej widzi otwartą decyzję. Wariant bez D-numeru: odpowiedź nie miała własnej sekcji ❓, w której dało się dołożyć decyzję.

## Rozwiązanie
Gdy po pytaniu bramki przychodzi polecenie niezwiązane z nim, nie traktuj go jako odpowiedzi. Rób nowe zadanie, a otwartą bramkę dołóż jako osobny punkt (D-numer) do najbliższego pytania, ze zdaniem, że nowe polecenie nie jest akceptacją.
