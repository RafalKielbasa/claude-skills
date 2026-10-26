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

## Rozwiązanie
Ograniczenie narzędzia, które znasz tylko z podsumowania kontekstu, traktuj jak hipotezę. Zanim oddasz pracę
użytkownikowi albo innej sesji z jego powodu, wywołaj narzędzie raz jeszcze (jest odwracalne albo tylko
odczytuje) i dopiero jego wynik podaj jako powód. W podsumowaniu zapisuj ograniczenie z warunkiem, w jakim
padło.
