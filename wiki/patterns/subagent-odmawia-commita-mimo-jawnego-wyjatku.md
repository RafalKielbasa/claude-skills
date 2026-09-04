# subagent-odmawia-commita-mimo-jawnego-wyjatku

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Dispatchowany subagent implementer odmawia wykonania `git commit`, mimo że prompt
dispatchu jawnie opisuje stojący wyjątek użytkownika od domyślnej reguły „nie commituj",
powołując się na globalne CLAUDE.md. Zdarzyło się cztery razy w jednej sesji (Task 6
dwukrotnie, finalna fala poprawek raz, wzorzec pierwszy raz zauważony przy Task 6).

## Przyczyna źródłowa
Subagent widzi wyjątek wyłącznie jako tekst w promptcie kontrolera — nie ma bezpośredniego
dostępu do oryginalnej wiadomości użytkownika, w której wyjątek został ustanowiony. Ostrożna
odmowa w takiej sytuacji jest generalnie słuszną domyślną postawą (nie da się odróżnić
prawdziwego upoważnienia od pomyłki albo próby obejścia reguły przez inny agent), więc nie
jest to błąd w rozumowaniu subagenta — jest to strukturalne ograniczenie tego, co subagent
może zweryfikować.

## Dowody
- 2026-09-03, sesja `session_0115YBg2ri1ajCfG8GNynEsZ`: Task 6, implementer odmówił commita
  dwukrotnie pod rząd, cytując zasadę „Nie commituj" z globalnego CLAUDE.md, mimo instrukcji
  dispatchu opisującej wyjątek repo-specyficzny.
- 2026-09-03, ta sama sesja: finalna fala poprawek (Fix A–F) — implementer ponownie odmówił
  commita z tym samym uzasadnieniem.
- W każdym z tych przypadków kontroler — mając bezpośredni, pierwotny dostęp do wiadomości
  otwierającej użytkownika, a nie relację z drugiej ręki od innego agenta — samodzielnie
  weryfikował diff, uruchamiał testy i bramkę sekretów, po czym commitował bezpośrednio,
  zamiast ponownie negocjować z subagentem.

## Rozwiązanie
Nie próbować „przekonać" subagenta silniejszym sformułowaniem promptu — to nie jest błąd do
naprawienia w treści dispatchu, tylko oczekiwana granica jego wiedzy. W repo z aktywnym,
stojącym wyjątkiem od reguły „nie commituj" (jak `claude-skills`), kontroler wykonuje commit
sam, po własnej niezależnej weryfikacji (diff, testy, bramka sekretów) — nie deleguje samego
aktu commitowania do subagenta, nawet gdy deleguje resztę zadania.
