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
- 2026-10-12, sesja e29922c9-6a91-4deb-bf7b-afd0650bc8f6: diaryzacja zlała Szymona i Mateusza w
  jedną etykietę C, a dalszy ciąg statusu Szymona oznaczyła jako B (Bart). Identyfikację robiłem
  per fragment, nie per etykietę. C to Szymon po „Szymon?” i odpowiedzi „To ja działałem cały czas
  z mobilką”, a C to Mateusz po „dzięki Szymon i Mateusz” i odpowiedzi „Ja w zasadzie domknąłem…”.
  Fragment z etykietą B zacytowałem z ⚠. Rafał na bramce wybrał „Zostaw jako niepewne” i przypisań
  nie poprawiał. Reguła z kroku 5 wystarczyła także dla etykiety obejmującej dwie osoby.
- 2026-10-22, sesja 109283c8-2c7c-48dd-81f5-5f6ef3cfff2a (id claude.ai niedostępny):
  - Daily 21.10: diaryzacja zlała Barta i Grzegorza w jedną etykietę. Przypisywałem tylko tam,
    gdzie Rafał wywołał osobę po imieniu, a propozycja ceny 49 zł została bez autora. Notatka
    została zaakceptowana bez poprawek przypisań.
  - Daily 22.10: prowadzącego nikt nie nazwał, bo to on wywołuje innych. Jego status trafił do
    karty ⚠ z „Zostaw jako niepewne” na pierwszym miejscu i bez rekomendacji. Rafał odrzucił
    `AskUserQuestion` i dopisał w czacie: „Rafał prowazi spotkanie”.
  - Daily 15.10: status o wdrożeniu subskrypcji (najpewniej Wiktora) został ⚠ na wybór Rafała.
  - Reguła „nie zgadywać” chroni notatkę, ale karta bez propozycji przerzuca na Rafała wpisywanie
    odpowiedzi, którą da się przewidzieć.

## Rozwiązanie
Utrzymać obie reguły bez złagodzeń. Niejasną nazwę własną próbować rozstrzygnąć z innego źródła w
repo/na tablicy i podać jako propozycję przy bramce, nie wpisywać do notatki bez potwierdzenia.
To samo z mówcą: przy ⚠ „kto mówi” dać na karcie opcję z hipotezą i jej podstawą („To Rafał —
prowadzi daily i wywołuje pozostałych”) jako rekomendowaną. Do notatki hipoteza wchodzi dopiero
po wyborze Rafała.
