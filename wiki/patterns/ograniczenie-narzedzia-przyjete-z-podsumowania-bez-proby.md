# ograniczenie-narzedzia-przyjete-z-podsumowania-bez-proby

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Po kompaktowaniu podsumowanie kontekstu twierdzi, że narzędzie czegoś nie zrobi („ExitWorktree is a no-op”).
Claude przez kilka tur obchodzi to ograniczenie, przerzucając pracę na użytkownika, zamiast jeszcze raz
sprawdzić narzędzie, gdy sytuacja się zmieniła.

## Przyczyna źródłowa
Podsumowanie zapisuje wynik jednej próby w jednym stanie sesji jako fakt bez warunków. Po kompaktowaniu nie
widać, w jakim stanie padła tamta próba, więc ograniczenie wygląda na stałe, a ponowna próba nie przychodzi do
głowy.

## Dowody
- 2026-10-25, sesja 4bd53d28-0d05-40dd-bf31-94901ea828ea (id claude.ai niedostępny; Baza wiedzy).
  - Podsumowanie mówiło „ExitWorktree is a no-op”. Na tej podstawie dwa razy oddałem Rafałowi polecenia
    scalenia do wklejenia w innej sesji. Pierwsza próba nie zostawiła śladu w repo, a Rafał w końcu scalał
    sam.
  - Dopiero „Uruchom git w tej sesji” skłoniło do wywołania `ExitWorktree` („Exited worktree … Session is now
    back in D:\Praca\Devstock\Baza wiedzy”). Porządki w kopii głównej zajęły potem kilka wywołań.
- 2026-10-26, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf),
  code-busters-mobile. Przykład zgodny z rozwiązaniem.
  - Ograniczenie stało tym razem w opisie samego narzędzia: „ONLY operates on worktrees created by
    EnterWorktree in this session … If called outside an EnterWorktree session, the tool is a no-op”.
    Sesja nie wywołała `EnterWorktree`, bo uruchomił ją hub i wznowiono ją przez `--resume`.
  - Mimo to wywołałem `ExitWorktree` raz, z bezpieczną akcją `keep`, i zadziałało: „Exited worktree … Session
    is now back in D:\Praca\Devstock\Projekty\code-busters-mobile”. Potem worktree usunąłem przez
    `git worktree remove`.
  - Akcji `remove` nie użyłem, bo kasuje też gałąź, a Rafałowi obiecałem, że gałąź zostanie. Gałęzie usunąłem
    dopiero po jego „tak”.
- 2026-10-26/27, sesja 520bd4df-d397-46bb-a9d4-6bab0ba6c1fb (id claude.ai niedostępny; Baza wiedzy, worktree
  `baza-wiedzy-agenty-ai-modul-2-bilet`, lekcje agenty-ai 2.1–2.3). Tym razem chodziło o kolejność pracy, nie
  o ograniczenie narzędzia.
  - Podsumowanie po kompaktowaniu niosło bez powodu „2.1 has priority on the course account” i „2.3 dry passes
    only after 2.1 releases the account (28.10)”.
  - W karcie biletu produkcyjnego (G1) lekcji 2.3 podałem to jako fakt: „Przebiegi próbne 2.3 ruszą dopiero po
    zwolnieniu konta przez 2.1”.
  - W szkicu śladu #789 dopisałem niesprawdzone „reset 2.3 przed nagraniem 2.1 naruszyłby jej skrzynkę”.
    Złagodziłem to przed wysłaniem.
  - Rafał zapytał: „Dlaczego nagrywanie ruszy dopiero po 2.1”. Dopiero wtedy `station-show` pokazał „Konto
    kursu: wolne”, „Kolejka: pusta”, czyli brak blokady narzędzia.
  - Powody znalazłem dopiero wtedy: maile 2.1 z `mail_age days_ago 1` oraz ścieżki resetu, które nigdy nie
    działały na koncie. Rafał przyjął kolejność („ok”), ale kosztowało to dodatkową turę.

## Rozwiązanie
Ograniczenie narzędzia, które znasz tylko z podsumowania kontekstu, traktuj jak hipotezę. Zanim oddasz pracę
użytkownikowi albo innej sesji z jego powodu, wywołaj narzędzie raz jeszcze (jest odwracalne albo tylko
odczytuje) i dopiero jego wynik podaj jako powód. W podsumowaniu zapisuj ograniczenie z warunkiem, w jakim
padło. To samo dotyczy ograniczeń z opisu narzędzia. Sesja uruchomiona przez harness w worktree bywa dla
`ExitWorktree` sesją worktree, choć `EnterWorktree` nie padło. Próbę rób wariantem, który da się cofnąć
(`keep`, nie `remove`).

To samo dotyczy kolejności i terminów przeniesionych z podsumowania („X dopiero po Y”). Zanim wpiszesz taką
kolejność do karty bramki, sprawdź stan, który ją wymusza (np. `station-show` dla konta kursu). W karcie podaj
powód z dowodem albo napisz wprost, że to wybór, a nie blokada. Ograniczenie bez powodu wraca jako pytanie
„dlaczego”.
