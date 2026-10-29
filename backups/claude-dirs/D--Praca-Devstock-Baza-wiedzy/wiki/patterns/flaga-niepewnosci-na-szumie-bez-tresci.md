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
- 2026-10-22, sesja 109283c8-2c7c-48dd-81f5-5f6ef3cfff2a (id claude.ai niedostępny):
  - Robocze 16.10 (`/spotkanie`, tryb transkrypt) miało 3 flagi: Mówca A w „Obecni”, „ikona,
    tytuły i piramidka” w „uwagach Gala”, „co Bart mówi o blogu”. Karty dawały na pierwszym
    miejscu „Zostaw jako niepewne” bez rekomendacji, a Rafał wybrał 3 × „Usuń z notatki”.
  - W kolejnych daily (15–22.10) fragmenty bez treści do odzyskania nadal dostawały ⚠, ale karta
    miała już „Usuń z notatki (Rekomendowane)” jako pierwszą opcję. Przykłady: „produkt parętny…
    dla dzieciaków”, „montaż na 12”, „pierwszy weekend listopada i dwa w listopadzie”. Każda taka
    rekomendacja przeszła bez korekty.
  - Rekomendacja na karcie zmniejsza koszt, ale flaga nadal powstaje przy budowie notatki, więc
    reguła z „Rozwiązania” (nie flagować szumu) wciąż nie jest stosowana.
- 2026-10-28/29, sesja claude.ai/code/session_01WryF5UdQSho3p8jEyswqrD (lokalnie
  16c3aefd-ec1a-48b5-b40b-be038c6346a4): w daily 26–28.10 było 8 flag ⚠, każda z konkretną treścią
  (kto mówi, kto co powiedział, liczby coinów). Żadnej nie trzeba było usuwać:
  - 4 rozstrzygnięte hipotezą z karty;
  - 4 zostawione jako niepewne, m.in. „No, 300 DEF Coins w co miesiąc jest dwa razy.”.

  Żadna flaga nie stała na szumie, a Rafał nie wybrał „Usuń z notatki” ani razu. Pierwszy dowód,
  że flagowanie samej treści da się utrzymać. Skill dalej nie zawiera tej reguły.

## Rozwiązanie
Flagę ⚠ stawiać tylko przy fragmencie, z którego da się odczytać konkretną treść (status, ustalenie,
decyzję, zadanie), a niejasne jest jej przypisanie, liczba albo odniesienie. Fragment bez treści do
odzyskania pominąć w notatce. W podsumowaniu bramki (faza 1) dać jedną linię „pominięte jako szum:
l. X, Y”, żeby Rafał mógł o nie dopytać.
