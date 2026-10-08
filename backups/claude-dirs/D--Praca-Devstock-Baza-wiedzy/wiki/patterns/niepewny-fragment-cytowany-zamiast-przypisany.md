# niepewny-fragment-cytowany-zamiast-przypisany

- **Skill:** daily
- **Typ:** sukces
- **Status:** otwarty

## Opis
Reguła identyfikacji mówców (samo-przedstawienie albo odpowiedź w pierwszej osobie po wywołaniu po
imieniu; nigdy eliminacja) i reguła „niejasny fragment cytować dosłownie z ⚠" dały notatkę, którą
Rafał zaakceptował po dwóch punktowych poprawkach nazw, bez korekty przypisań.

## Przyczyna źródłowa
Diaryzacja AssemblyAI potrafi rozbić wypowiedź jednej osoby na kilka etykiet innych mówców, a
transkrypcja przekręca nazwy własne. Zgadywanie w obu przypadkach daje zdanie, które brzmi pewnie i
jest błędne; cytat z ⚠ zostawia decyzję człowiekowi i nie wchodzi do kolejek.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: czterech mówców
  zidentyfikowanych po wywołaniu po imieniu („Zaczniemy od Grzegorza" → B, „Wiktor?" → D,
  „…list, Mateusz" → C, „Rafał masz to na uwadze" → A); status Szymona rozbity na etykiety C, D, A
  — zacytowany, nieprzypisany. Przekręcone nazwy („Trust Loony", „Wrocławnią") rozstrzygnięte
  później z tablicy GitHub (TrustLuna, Rzęsownia) i dopiero wtedy poprawione za zgodą Rafała.

## Rozwiązanie
Utrzymać obie reguły bez złagodzeń. Niejasną nazwę własną próbować rozstrzygnąć z innego źródła w
repo/na tablicy i podać jako propozycję przy bramce, nie wpisywać do notatki bez potwierdzenia.
