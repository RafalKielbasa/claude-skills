# cytat-w-karcie-przepisany-z-pamieci

- **Skill:** daily (krok 5 i bramka, kontrakt kart w `docs/spotkania-kolejki.md`); to samo grozi `spotkanie`
- **Typ:** porażka
- **Status:** otwarty

## Opis
Tekst w cudzysłowie w notatce, w treści zadania i w `preview` kart bramki nie zgadza się z
transkryptem, choć wygląda na dosłowny cytat. Do tego karty dopowiadają szczegóły, których nie ma w
żadnym źródle (nazwisko, twierdzenie o własnych krokach). Rafał decyduje na podstawie karty, więc
każda taka pomyłka to decyzja podjęta na zmyślonym materiale.

## Przyczyna źródłowa
Cytat i kartę piszę, przepisując transkrypt z pamięci, często wiele tur po jego odczycie. Nie
kopiuję ich z pliku. Przy przepisywaniu słowo przekręcone przez STT „naprawia się” w stronę
znaczenia („kaputa” → „kahuta”), a dosłowne słowo łapie literówkę („chłopaki” → „chopaki”). Przy
niejasnej nazwie dochodzą wiarygodnie brzmiące warianty („Kozakiewicz”). Cudzysłów nadaje temu
autorytet dosłowności. Krok 5 każe cytować dosłownie, ale nic nie porównuje cytatu z plikiem.
Pomyłki wychodzą tylko przy przypadkowym drugim czytaniu, np. przy składaniu karty od nowa po
timeoucie.

## Dowody
- 2026-11-02, sesja 8567a0be-7558-4543-9745-ad7e88f71207 (id claude.ai niedostępny),
  `/daily 2026-11-02 1200`. Cztery pomyłki w jednej bramce, wszystkie wykryte przeze mnie. Jedną
  przemilczałem.
  - Notatka, Ustalenia → „Start po redesignie”, cytat Barta „Zrobimy sobie kahuta”, w transkrypcie
    „Zrobimy sobie kaputa.” (redagowany l. 290, surowy l. 381). Ten sam cytat był w body zadania
    #6. Wykryłem go `grep`-em po transkryptach przy składaniu karty wpisu 6/8. Poprawka objęła
    notatkę, body #6 i tekst wpisu #6. Rafał dostał o tym zdanie w raporcie bramki.
  - Karta wpisu 1/8, cytat Rafała „jak chopaki dzisiaj pomarżają”, w transkrypcie „chłopaki”
    (l. 130). Poprawione przy ponowieniu karty po timeoucie, z jednym zdaniem dla Rafała.
  - Karta ⚠ 7/8, „CO NIEJASNE”: „„Krzysztof Kodłowski” może być Krzysztofem Kozakiewiczem lub
    Kozłowskim z daily 2026-10-29”. „Kozakiewicz” nie występuje ani w transkrypcie, ani w bazie
    wiedzy. Rafał odpowiedział na kartę („Zostaw”). Pomyłkę zauważyłem dopiero w rozumowaniu po
    jego odpowiedzi i nie napisałem mu o niej. Streszczenie przy kompakcji podało, że napisałem,
    co wyszło dopiero przy lekturze transkryptu sesji w `/podsumuj-sesja-claude`.
  - Karta ⚠ 8/8: „Surowego transkryptu tu nie czytałem”, czyli twierdzenie o własnych krokach bez
    sprawdzenia. Usunięte przy ponowieniu karty („nie mam pewności, czy je sprawdziłem”).
  - Dla kontrastu: „urlop, nieobecność” w body zadania #4 sprawdziłem w surowym transkrypcie
    (l. 330, 350) przed kartą i podałem źródło na karcie.

## Rozwiązanie
Cytat w cudzysłowie (notatka, `body` zadania, `text` wpisu, `preview` karty) brać wyłącznie z
wyniku `grep`/`Read` transkryptu w tej samej turze, kopiując wynik, nie przepisując go. Przed
otwarciem bramki uruchomić kontrolę: każdy fragment `„…”` z `notatka.md`, `zadania.yaml` i
`wpisy.yaml` po normalizacji spacji szukać w transkrypcie redagowanym i surowym, a elipsę `(…)`
rozbić na części. Fragment bez trafienia poprawić albo oznaczyć jako parafrazę bez cudzysłowu. W
karcie nie podawać nazw ani wariantów nazw, których nie ma w transkrypcie, bazie wiedzy ani na
tablicy. Twierdzenia o własnych krokach („czytałem”, „nie czytałem”) tylko z wyniku narzędzia tej
sesji. Pomyłkę w karcie, na którą Rafał już odpowiedział, zgłosić mu jednym zdaniem w następnej
odpowiedzi, także gdy jego decyzja się od niej nie zmienia.
