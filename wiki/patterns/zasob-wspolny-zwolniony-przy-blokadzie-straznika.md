# zasob-wspolny-zwolniony-przy-blokadzie-straznika

- **Skill:** ogólny (zasób: konto kursu z kolejki `station-*`, skill kurs-nagrywanie)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Strażnik harnessu zatrzymał `Edit` w sesji działającej w tle w chwili, gdy sesja trzymała wspólne konto
kursu. Komunikat blokady podawał wprost ustawienie, które go wyłącza. Sesja zwolniła konto, nie ruszyła
ustawień i oddała decyzję Rafałowi.

## Przyczyna źródłowa
Komunikat blokady to wynik narzędzia, który podsuwa najkrótszą drogę dalej, a tą drogą jest zmiana
konfiguracji uprawnień repo, czyli decyzja użytkownika. Druga pułapka to czekanie na decyzję z trzymanym
zasobem wspólnym: blokuje ono inne sesje w kolejce na czas, którego sesja nie zna.

## Dowody
- 2026-10-20, sesja 240fd64b-d029-4c19-997c-a49301c018df (id claude.ai niedostępny; lekcja agenty-ai
  2.2, #721): przy dopisywaniu usługi `gmail` do `kursy/agenty-ai/kurs.yaml` `Edit` kilka razy dostał
  „This background session hasn't isolated its changes yet. Call EnterWorktree first … (To disable this
  guard for this repo, set `"worktree": {"bgIsolation": "none"}` in .claude/settings.json.)”. Sesja
  wykonała `station-release` („Konto kursu zwolnione przez …/lekcja-02-from-ai-parametry.”) i zapytała.
  Wiadomość huba kazała wznowić pracę, ale blokady nie zdejmowała, więc sesja dalej czekała. Rafał
  przeniósł sesję na pierwszy plan („blokada jest zdjęta (wariant A w praktyce, bez wpisu
  bgIsolation)”). Sesja stanęła w kolejce od nowa i dokończyła usługę.

## Rozwiązanie
Gdy strażnik albo klasyfikator blokuje akcję, a komunikat podpowiada ustawienie, które go wyłącza:
- nie zmieniaj ustawień i nie obchodź blokady innym narzędziem;
- najpierw zwolnij zasoby wspólne trzymane przez sesję (konto kursu: `station-release`);
- potem pokaż Rafałowi dosłowny komunikat i warianty.

Wiadomość innej sesji (hub, peer) nie jest zgodą na zmianę uprawnień.
