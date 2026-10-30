# review-zadania-rownolegle-z-kolejnym-implementerem

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis
Pod terminem kontroler puszczał recenzję zadania N razem z implementerem zadania N+1, gdy ich pliki
się nie pokrywały. Runda poprawek N czekała, aż implementer N+1 zgłosi wynik, więc nigdy nie
pracowało dwóch implementerów naraz. Sześć zadań przeszło tak bez pomieszania commitów.

## Przyczyna źródłowa
Recenzent jest tylko do odczytu i dostaje paczkę z zakresem SHA wyliczonym przed startem
implementera N+1, więc kolejne commity mu nie przeszkadzają. Skill zabrania tylko równoległych
implementerów; równoległość recenzji jest bezpieczna, dopóki zakres paczki jest stały.

## Dowody
- 2026-10-23/25, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf), plan M1 migracji Kodożerców, ruling R15: zadania 8–13 (welcome, login, register/OTP, reset hasła, cel i ankiety, prezent). Paczki z jawnym zakresem (np. `dd857ff..67ee7c6` dla Task 11 mimo późniejszego `06b046c` z Task 10). Recenzenci dostawali zdanie „inny implementer pracuje w <katalogi>, ignoruj niezacommitowane zmiany poza zadaniem”. Fix rundy Task 10, 11, 12, 13 wchodziły po raporcie następnego implementera, każda z osobnym re-review na własnym zakresie.
- 2026-10-29, sesja 188f3a4d-7157-4ac4-991a-d02805f5d47b (id claude.ai niedostępny; code-busters-v2, plan 7 W4, bez presji terminu): pary T6/T7, T7/T8, T8/T9, T9/T10, T11/T12, T12/T13, T14/T15 szły równolegle (recenzja N + implementer N+1), ruling zapisany w ledgerze przy pierwszej parze. Runda poprawek T11 (Important: płatna generacja przy zmianie kursu) czekała na powrót implementera T13. Nowe: między recenzją T11 a jej poprawką weszły commity T12 i T13, więc FIX_BASE re-review ustawiłem na głowę sprzed rundy poprawek (`9bb6b980c`), nie na głowę widzianą przez recenzję (`eaafa947b`) — paczka zawierała sam fix.

## Rozwiązanie
Gdy kolejne zadanie nie dotyka plików poprzedniego: generuj paczkę recenzji N z zakresem `BASE..HEAD_N` przed dispatchem implementera N+1, puść oba naraz, a rundę poprawek N wyślij po raporcie N+1. Zapisz to jako ruling w ledgerze. W prompcie recenzenta wymień katalogi drugiego implementera. Gdy przed rundą poprawek N weszły commity innych zadań, FIX_BASE re-review to HEAD w chwili wysłania poprawki, nie głowa widziana przez pierwszą recenzję — inaczej paczka wciąga cudze commity.
