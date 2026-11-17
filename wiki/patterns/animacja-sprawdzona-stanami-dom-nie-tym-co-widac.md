# animacja-sprawdzona-stanami-dom-nie-tym-co-widac

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Animacja wejścia sekcji przechodzi wszystkie pomiary (stan `armed` → `shown`, krycie 0 → 1, brak przekształcenia w spoczynku), a użytkownik po obejrzeniu mówi, że efekt jest mało widoczny i prosi o poprawkę.

## Przyczyna źródłowa
Pomiary sprawdzały, czy animacja się wykonuje, a nie co człowiek ma na ekranie w chwili, gdy się wykonuje. Wyzwalacz ustawiony na 10% wysokości okna odpalał, gdy widoczny był sam górny odstęp sekcji (76 px), a krzywa z szybkim początkiem kończyła większość ruchu w około 200 ms, czyli zanim treść weszła w kadr.

## Dowody
- 2026-11-17, sesja d3dca57e-92f2-418a-b0e5-a28120ba9cf3 (id claude.ai niedostępny; code-busters-v2, worktree `landing-redesign`, przebudowa landingu DT-182 #1021): pierwsza wersja `Reveal` (`rootMargin: '0px 0px -10% 0px'`, bez opóźnienia) zaraportowana jako sprawdzona w przeglądarce przy 1440 i 390 px. Rafał: „Opóźnij delikatnie wjazd sekcji, efekt jest mało widoczny”. Poprawka: linia na 20% i 150 ms opóźnienia, z pomiarem przebiegu krycia w czasie (0,62 po około 300 ms, 0,93 po około 450 ms).

## Rozwiązanie
Przy animacji wyzwalanej przewijaniem policz przed oddaniem, ile pikseli treści (nie odstępu) elementu jest w oknie w chwili wyzwolenia i ile ruchu zostaje po tym, jak treść staje się widoczna. Jeśli w chwili startu widać sam odstęp albo ruch kończy się przed wejściem treści, przesuń wyzwalacz albo dodaj opóźnienie. W raporcie podaj próbki krycia w czasie, nie tylko stan początkowy i końcowy.
