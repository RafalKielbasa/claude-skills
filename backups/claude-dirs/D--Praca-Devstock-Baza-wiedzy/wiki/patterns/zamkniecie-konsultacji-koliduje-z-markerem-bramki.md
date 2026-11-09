# zamkniecie-konsultacji-koliduje-z-markerem-bramki

- **Skill:** konsultant-ux-kodozercy
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skill każe zakończyć ostatnią wiadomość linią `Konsultacja zamknięta.`. Globalny protokół każe, żeby tura czekająca na decyzję kończyła się linią `⏸ Czeka na decyzję: …`, bo hub czyta marker wyłącznie z ostatniej linii. Gdy w wiadomości zamykającej konsultację zostaje jeszcze pytanie (np. o status issue), obie linie chcą być ostatnie.

## Przyczyna źródłowa
Sekcja 9 skilla powstała przed protokołem markera huba i zakłada, że zamknięcie konsultacji kończy rozmowę. Wpis o decyzji zapisuje się jednak zwykle razem z innymi krokami (kod, tablica), więc ta sama tura pyta jeszcze o coś spoza konsultacji.

## Dowody
- 2026-11-09, sesja 0facbde7-f16e-4ba0-a2f0-b304f63f372a (id claude.ai niedostępny; DT-81).
  - Raport po zapisie wpisu w `decyzje.md` pytał jeszcze o tablicę #815.
  - Postawiłem `Konsultacja zamknięta.` w przedostatniej linii, tuż nad `⏸`.
  - Narzędzia `$HOME/.claude/skill-evolution/cli.mjs` na tej maszynie nie ma, więc kroki 1–2 sekcji 9 pominąłem i napisałem o tym w raporcie.
  - Nie sprawdziłem, czy hook `Stop` rozpoznaje linię zamknięcia, gdy nie jest ostatnia.

## Rozwiązanie
Linia `Konsultacja zamknięta.` stoi na końcu treści odpowiedzi. Gdy tura czeka na decyzję, linia stoi tuż nad markerem `⏸ Czeka na decyzję: …`, który zostaje ostatnią linią. Hook `Stop` szuka linii zamknięcia w całej ostatniej wiadomości, nie tylko w ostatniej linii.
