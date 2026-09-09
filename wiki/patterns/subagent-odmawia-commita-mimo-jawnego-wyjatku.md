# subagent-odmawia-commita-mimo-jawnego-wyjatku

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Dispatchowany subagent implementer odmawia wykonania `git commit`, mimo że prompt
dispatchu jawnie opisuje stojący wyjątek użytkownika od domyślnej reguły „nie commituj",
powołując się na globalne CLAUDE.md. Zdarzyło się cztery razy w jednej sesji (Task 6
dwukrotnie, finalna fala poprawek raz, wzorzec pierwszy raz zauważony przy Task 6),
i ponownie w innym repo. Odmowa jest zachowaniem poprawnym — pytanie brzmi, co podać
subagentowi, żeby mógł zgodę zweryfikować, zamiast ją odrzucić.

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
- 2026-09-08/09, sesja `session_01VwQutH9xHrU3vwiwnhbL8y`, repo `agent-biznes`, plan trybu
  `vision`: odmowa przy Task 2, dosłownie — „per user's global CLAUDE.md (Git section),
  I do not commit on an agent's instruction alone — only Rafał's own explicit request
  in-conversation authorizes it", przy pracy gotowej i suicie 215/215. Nowe względem
  poprzednich dowodów jest **to, co zadziałało zamiast commita kontrolera**: kontroler
  wznowił tego samego subagenta wiadomością cytującą *dosłowne słowa użytkownika* z tej
  rozmowy („Subagent, commituj co zadanie", a następnie „Na main"), zaznaczając, że to jego
  własna wypowiedź, nie relacja agenta, oraz podając granice zgody (jeden commit na zadanie,
  bez `push`, gałęzi, tagów i przepisywania historii). Subagent zacommitował. Od chwili, gdy
  ten sam akapit trafił do **każdego** kolejnego dispatchu, odmowa nie wróciła przez sześć
  zadań i cztery rundy poprawek — dziesięć commitów subagentów z rzędu.

## Rozwiązanie
Nie próbować „przekonać" subagenta silniejszym *sformułowaniem* — wzmocnienie tonu niczego
nie zmienia, bo problem leży w tym, czego subagent nie może zweryfikować. Zamiast tego podać
mu **dowód**: dosłowny cytat wypowiedzi użytkownika ustanawiającej wyjątek, oznaczony jako
jego własne słowa z tej rozmowy, wraz z granicami zgody (co wolno, czego nadal nie).
Akapit z cytatem umieścić w każdym dispatchu od razu, nie dopiero po pierwszej odmowie —
odmowa kosztuje pełną rundę wznowienia. Gdy subagent mimo cytatu odmawia, nie negocjować
dalej: kontroler commituje sam, po własnej niezależnej weryfikacji (diff, testy, bramka
sekretów).
