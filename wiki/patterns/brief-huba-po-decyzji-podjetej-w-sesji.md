# brief-huba-po-decyzji-podjetej-w-sesji

- **Skill:** hub
- **Typ:** porażka
- **Status:** otwarty

## Opis
Hub przekazuje sesji projektu odpowiedź Rafała na bramkę, którą Rafał już rozstrzygnął bezpośrednio
w tej sesji. Brief niesie ograniczenia sprzed decyzji („bez scalania”), więc sesja dostaje polecenie
sprzeczne ze stanem, w którym już jest, i musi sama ustalić, co obowiązuje.

## Przyczyna źródłowa
Rafał odpowiada na tę samą bramkę dwoma kanałami: w hubie i wprost w sesji projektu. Hub buduje brief
z pytania sesji, a nie z jej bieżącego stanu, i nie sprawdza, czy bramka jest jeszcze otwarta.
Niepewne: brief mógł też zostać wysłany na czas i dostarczony z opóźnieniem (wiadomość czeka na
następną rundę narzędzi albo na zatwierdzenie w innym trybie uprawnień).

## Dowody
- 2026-10-22, sesja f8d64eed-4822-47ab-af24-2115a5905b5f (id claude.ai niedostępny): brief huba
  `hub-ef` z godziną 07:15 („Rafał uruchamia Docker Desktop … Bez pusha, bez scalania do DT-37”) dotarł
  do sesji po scaleniu do DT-37 (`370c72905`, 08:19). Decyzje D5–D7 były zapisane w indeksie 07:09
  (`56a7695b`), a bramkę Rafał zaliczył w sesji („Docker uruchomiony, jedziemy z bramką”, potem „OK”).
  Sesja niczego nie cofnęła i odpowiedziała hubowi stanem końcowym.
- 2026-11-03, sesja 1bb3295d-0143-449c-a32a-2455751c1556 (id claude.ai niedostępny), DT-80 #814:
  - Brief `hub-94` „[… 2026-11-03 14:10]” niósł decyzje z rozmowy głosowej Rafała w hubie. Jego
    kontekst wymieniał warianty z pierwszej odpowiedzi sesji („zamknąć #814 po daily”) i nakazywał:
    „Zamknięcie #814 to działanie na zewnątrz: zatrzymaj się przed nim”.
  - Tymczasem #814 było zamknięte o 12:46Z, na tekst Rafała w sesji („zamykamy gotowe issue”, 12:43Z).
  - Ta sama wiadomość rozstrzygała też bramkę, która była naprawdę otwarta: ⏸ o automatycznych 10
    zadaniach („Nie ruszamy tego”). Brief mieszał więc ograniczenie nieaktualne z decyzją aktualną.
  - Sesja zacytowała brief i sprawdziła stan (`gh issue view 814` → `CLOSED COMPLETED`). Niczego nie
    zamykała ponownie. Korektę zapisu przyjęła jako bramkę i naniosła ją po „ok” wpisanym tekstem.

## Rozwiązanie
Hub przed wysłaniem odpowiedzi na bramkę sprawdza ostatni stan sesji (ostatnia wiadomość, marker
`⏸ Czeka na decyzję`); gdy bramki już nie ma, nie wysyła decyzji, tylko pyta o stan. Sprawdza każdą
decyzję i każde ograniczenie briefu osobno. Jedna otwarta bramka nie potwierdza aktualności reszty
briefu, zbudowanego z wcześniejszych pytań sesji. Sesja projektu,
która dostaje brief sprzeczny z decyzją Rafała podjętą w jej rozmowie, trzyma się decyzji z rozmowy,
niczego nie cofa i odpowiada hubowi stanem z hashami.
