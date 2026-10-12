# flaga-niepewnosci-na-szumie-bez-tresci

- **Skill:** daily (krok 5, kontrakt ⚠ w `docs/spotkania-kolejki.md`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Notatka dostaje flagę ⚠ przy każdym zniekształconym fragmencie, także przy takim, z którego nie da
się odzyskać żadnej treści. Każda flaga to jedno pytanie w fazie 2 bramki, a Rafał takie fragmenty
usuwa. Zostawia tylko te, w których jest konkretna treść o niejasnym przypisaniu albo liczbie.

## Przyczyna źródłowa
Krok 5 („Never invent content”) każe cytować i flagować każdy niejednoznaczny fragment. Nie
odróżnia przy tym fragmentu, który niesie ustalenie, decyzję, zadanie albo status, od szumu
transkrypcji (urwane zdanie, odczytywana cudza wiadomość bez kontekstu). Flagowanie wszystkiego
wygląda na bezpieczne, ale przenosi koszt na Rafała: bramka rośnie o pytania, na które jedyną
sensowną odpowiedzią jest „Usuń z notatki”.

## Dowody
- 2026-10-12, sesja e29922c9-6a91-4deb-bf7b-afd0650bc8f6: 6 flag ⚠. Rafał usunął 4:
  - urwane zdanie Grzegorza „Oczczerna w tej prawdopodobnie zapraszam na spotkanie”;
  - „na urlopu tygodniowy nie będzie” u Wiktora;
  - „zadanko” i przepinanie kanałów „na kortie” u Rafała;
  - odczytywane po wyciętym fragmencie wiadomości „Zróbmy proszę spotkanie w poniedziałek…”.

  Zostawił 2, które mają konkretną treść: kwoty windykacji w statusie Barta i listę prac Szymona,
  którą diaryzacja przypisała Bartowi.

## Rozwiązanie
Flagę ⚠ stawiać tylko przy fragmencie, z którego da się odczytać konkretną treść (status, ustalenie,
decyzję, zadanie), a niejasne jest jej przypisanie, liczba albo odniesienie. Fragment bez treści do
odzyskania pominąć w notatce. W podsumowaniu bramki (faza 1) dać jedną linię „pominięte jako szum:
l. X, Y”, żeby Rafał mógł o nie dopytać.
