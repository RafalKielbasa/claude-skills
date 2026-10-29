# zamkniecie-issue-z-bramka-i-sladem-zamykajacym

- **Skill:** board-tracker (z project-index)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Zamknięcie issue, którego resztka zakresu idzie gdzie indziej (DT-12 #650, wzorem DT-26 #665). Jedna
bramka zawiera dokładną treść każdego zapisu i tabelę kolejności. Wartości, których nie znam przed
wykonaniem (numery nowych issue, adres komentarza, hash commita), stoją w tekście jako jawne `{{…}}`.
Komentarzem zamykającym jest ślad sesji (`trail`) z tabelą „element | gdzie jest | stan”. Po jednym
„ok” sześć zapisów przeszło w osobnych wywołaniach, bez poprawek treści.

## Przyczyna źródłowa
Teksty zapisów odwołują się do siebie: komentarz w W5 do nowych issue, ślad do komentarza w W5
i do commita, indeks do komentarza. Dlatego kolejność wykonania idzie od tego, co powstaje najpierw.
Ślad jako komentarz zamykający daje jeden komentarz sesji w issue zamiast dwóch i spełnia regułę `trail`.
Zapisy, które w bramce mają pełną treść, przechodzą przez klasyfikator po samym „ok”.

## Dowody
- 2026-10-29, sesja 00434ebc-97fc-4e2a-a68d-5d8452f5084b (id claude.ai niedostępny; Baza wiedzy, worktree
  `baza-wiedzy-dt-12-close`, zlecenie huba): zamknięcie DT-12 #650 w kolejności:
  - `create` #813 i #814;
  - komentarz w #772;
  - commit indeksu `0f7463ce`;
  - ślad `issuecomment-6500674123` z hashem;
  - `status --to done`, wynik `CLOSED COMPLETED`, Done.

  Rafał odpowiedział „ok”, bez uwag do treści. W tej samej sesji tak samo zbudowana bramka DT-13 #651
  (trzy issue, siedem kroków) czekała na odpowiedź.

## Rozwiązanie
Przy zamykaniu issue z resztką:
1. Zrób tabelę elementów z treści issue, z kolumnami „gdzie jest” i „stan”. Fakty o kodzie sprawdź do
   odczytu albo oznacz „według indeksu”.
2. Pokaż bramkę z pełną treścią każdego zapisu i tabelą kolejności. Placeholdery `{{…}}` nazwij.
3. Wykonuj w kolejności: nowe issue → komentarze w issue docelowych → commit indeksu → `trail` z
   hashem → `status --to done`.
4. Każdy zapis puszczaj osobnym wywołaniem. Placeholdery wypełniaj `sed` w plikach w tmp joba
   i sprawdzaj `grep -c "{{"` = 0.
