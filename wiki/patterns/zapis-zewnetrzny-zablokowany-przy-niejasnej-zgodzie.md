# zapis-zewnetrzny-zablokowany-przy-niejasnej-zgodzie

- **Skill:** ogólny (dotyczy board-tracker)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Zamknięcie dwóch issues w głównej sesji (jedna komenda Bash z dwoma zapisami do GitHuba) odrzucił
klasyfikator trybu auto („[External System Writes]”). Te same dwie operacje, uruchomione osobno
po słowach Rafała „Spróbuj zamknąć je ponownie”, przeszły bez blokady.

## Przyczyna źródłowa
Hipoteza, wpis wątpliwy: klasyfikator sprawdza, czy ostatnia wiadomość użytkownika jednoznacznie
pozwala na ten konkretny zapis zewnętrzny. Słowa „Zamknij i issues, które już zostały wykonane”
łączyły zgodę na zamknięcie z prośbą o przegląd. Claude dodatkowo zmienił zatwierdzony sposób
zamknięcia #336 (propozycja „not planned”, wykonanie „Done”) i połączył dwa zapisy w jedno
wywołanie. Z tych trzech czynników nie wiadomo, który zdecydował. Po jawnym „spróbuj ponownie”
ta sama zmiana na Done przeszła.

## Dowody
- 2026-10-14, sesja 9c60c6ac-d756-43f9-af2c-be591fa8c566 (id claude.ai niedostępny):
  `close --ref …#330 --reason not_planned; status --ref …#336 --to done` → „Permission for this
  action was denied … [External System Writes]”. Claude nie obchodził blokady: dokończył przegląd
  tylko do odczytu i podał obie komendy do wklejenia. Po „Spróbuj zamknąć je ponownie” dwa osobne
  wywołania zwróciły `#330 CLOSED NOT_PLANNED` i `#336 CLOSED COMPLETED Done`.
- 2026-10-16, sesja 7875e423-9ae8-4e55-a56b-31766c608f4e (id claude.ai niedostępny): po „ok” Rafała przyjmującym naraz pięć wariantów planu pracy, w tym
  „PR-y DT-37 jako draft” i komentarz z podziałem pracy w #650, klasyfikator odrzucił
  `gh pr ready --undo`, `gh pr comment` i `gh issue comment` („[External System Writes]”).
  Claude nie obchodził blokady: teksty zostały w folderze roboczym, Rafał dostał do wyboru regułę
  uprawnień albo wklejenie komend. W tej samej sesji cztery komentarze `trail` przez CLI
  board-tracker (też zapis do GitHuba) przeszły po „ok” niezwiązanym z tablicą. Uzupełnienie
  hipotezy, nadal wątpliwe: zapis wynikający ze stałej reguły w `CLAUDE.md` (ślad w issue)
  przechodzi, a zapis, którego jedyną zgodą jest krótkie „ok” do listy wariantów, klasyfikator
  czyta jako niejasny.

## Rozwiązanie
Zapis zewnętrzny wykonuj w dokładnie takiej postaci, na jaką padła zgoda. Zmianę (np. powodu
zamknięcia) zgłoś przed wykonaniem i poczekaj na „tak”. Każdy zapis puszczaj w osobnym wywołaniu.
Po blokadzie klasyfikatora nie obchodź jej, tylko podaj komendy i zapytaj. Jawne „spróbuj
ponownie” od użytkownika to zgoda, po której wolno ponowić.
