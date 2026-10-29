# zapis-zewnetrzny-zablokowany-przy-niejasnej-zgodzie

- **Skill:** ogólny (dotyczy board-tracker)
- **Typ:** porażka
- **Status:** zaadresowany (2026-10-29, board-tracker)

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
- 2026-10-24, sesja c0987db9-b09b-453f-8cfe-0770239787b8 (claude.ai session_01GxQKCzxfs88VmDWqtoSy3P): po „ok” Rafała przyjmującym naraz trzy
  warianty („Skasowanie 8 rozmów z 21–22.10” opisane jako nieodwracalne, push, „Zamknięcie części
  `hub-voice`”) klasyfikator odrzucił `node conv-delete.mjs <8 id>` (DELETE w API ElevenLabs) bez
  kategorii: „judged this action dangerous (it gave no explanation)”. Claude nie ponawiał komendy inną
  powłoką; podał ją do uruchomienia z prefiksem `!` z opisem kroków. Rafał uruchomił ją sam
  (8 × 204, potem 8 × GET 404), a dalsze kroki z tego samego „ok” (commit i `git push` w vaultcie)
  przeszły. Zgodne z hipotezą: zapis zewnętrzny i nieodwracalny, którego jedyną zgodą jest „ok” do listy
  wariantów.
- 2026-10-25, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf): w trakcie pisania draftów epiku (`github-tickets`, przed gate 2) Rafał przerwał i napisał „zmień rodzica”. Przeniesienie #650 i #651 pod #741 (`POST …/sub_issues` z `replace_parent=true`) klasyfikator odrzucił („[External System Writes]”). Claude nie ponawiał, dołączył operację do paczki wysyłki. Po jawnym „wyślij, D1 B” ta sama operacja przeszła razem z resztą zapisów. Zgodne z hipotezą: dwa słowa w środku pracy nad draftami to dla klasyfikatora za mało, jawne polecenie wysyłki wystarcza.
- 2026-10-26, sesja 2be43b78-0126-44ba-97e1-4c5eaa736bf3 (id claude.ai niedostępny; Baza wiedzy, koordynacja `kodozercy-platform`): „OK” przyjmujące naraz osiem decyzji D1–D8, z których D8 brzmiało „#688 i #764 do Done (#688 zamykam), #765 do Done”. Trzy osobne wywołania `board-tracker status --to done` w jednej turze: #764 przeszło (`closed: true`), #688 i #765 odrzucone („[External System Writes]”). Claude nie ponawiał, podał obie komendy z prefiksem `!`. Po „ponów sam #688 i #765” oba przeszły. Nowe: przy tej samej zgodzie i tej samej postaci komendy klasyfikator przepuścił jeden zapis z trzech, więc decyzja jest niedeterministyczna nawet w obrębie jednej tury.
- 2026-10-27, sesja session_01WryF5VMEsMHtnHj5CCKTC4 (lokalnie 1faa07a7-ff1f-431b-bc16-b826e84f3e24), M2 mobile: jeden zapis, w zatwierdzonej postaci. Pytanie miało warianty [A] „Przesuwam #767 do Done”, [B] In review, [C] w toku. Rafał odpowiedział „OK” (domyślne przyjęcie rekomendacji A). `board-tracker status --ref …#767 --to done` przez PowerShell odrzucone („[External System Writes]”). Wcześniej w tej sesji `status --to in_progress` przy przypięciu przeszło. Nie ponawiałem; podałem komendę z `!`, Rafał uruchomił ją sam (`closed: true`). Zgodne z hipotezą: samo „OK” do listy wariantów nie wystarcza klasyfikatorowi przy zapisie zamykającym.
- 2026-10-29, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (id claude.ai niedostępny; code-busters-v2, worktree `code-busters-app-migration-w3-profile`, plan 5 W3 subagent-driven) (siódmy): `status --ref …#768 --to done` po „ok” Rafała na „Przesunąć do Done?” odrzucone „[External System Writes]”; Rafał uruchomił tę samą komendę z `!`. `assign` i `bind` (→ w toku) po „OK” na wariant D3 przeszły — odmowa dotknęła przejścia do Done, nie każdego zapisu na tablicy.

## Rozwiązanie
Zapis zewnętrzny wykonuj w dokładnie takiej postaci, na jaką padła zgoda. Zmianę (np. powodu
zamknięcia) zgłoś przed wykonaniem i poczekaj na „tak”. Każdy zapis puszczaj w osobnym wywołaniu.
Po blokadzie klasyfikatora nie obchodź jej, tylko podaj komendy i zapytaj. Jawne „spróbuj
ponownie” od użytkownika to zgoda, po której wolno ponowić. Gdy zgoda była jawna, a klasyfikator
i tak odmawia, zaproponuj, żeby użytkownik uruchomił komendę sam, z prefiksem `!` w tej sesji: wynik
trafia do rozmowy, a żadna reguła uprawnień nie zostaje na stałe.
