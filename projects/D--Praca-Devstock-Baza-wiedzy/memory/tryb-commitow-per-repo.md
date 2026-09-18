---
name: tryb-commitow-per-repo
description: "Tryb commitów ustala repo: w „Bazie wiedzy\" Claude commituje sam, w repo z kodem nie; push nigdy nie jest domyślny."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 366a6308-0e9a-4978-baa9-b669bf57f48d
  modified: 2026-09-18T11:52:39.845Z
---

**Domyślną trybu commitów ustala repo; push nie jest domyślny nigdzie.**
Ustalone 2026-09-18 — zastępuje wcześniejszą zasadę bezwarunkowego „nie commituj".

| repo | commit | push |
|---|---|---|
| „Baza wiedzy" (`D:\Praca\Devstock\Baza wiedzy`) | robię sam, bez pytania, w całym repo łącznie z `tools/` | `ask` |
| devstock-team-agent, company-agent-chat, saas app, code-busters-v2, code-busters-mobile | domyślnie nie; reguła `ask`, więc na polecenie Rafała commit przechodzi przez prompt | `ask` |
| repo bez konfiguracji (np. vault `D:\Notatki`) | nie | nie |

**Why:** repo z kodem bywają współdzielone i commit potrafił wylądować na cudzej
gałęzi przy współdzielonym working tree (patrz [[baza-wiedzy-wdrozenie-task-12]]),
więc tam decyduje Rafał. W „Bazie wiedzy" pracujemy głównie na tekstach (kursy,
scenariusze, live), gdzie ręczne commitowanie każdej zmiany to dla Rafała sam
narzut. Push na `origin` jest nieodwracalny, więc zostaje jego decyzją wszędzie.

**How to apply:**
- Przed każdym commitem: `git branch --show-current`; w raporcie podaj gałąź i hash.
- Treść commita w Conventional Commits. Tam, gdzie commit wyłączony — propozycja
  treści przy bramce review, commit robi Rafał.
- Rafał znosi domyślną w rozmowie w obie strony („commituj", „commituj i wypychaj",
  „nie commituj") — na tę jedną rozmowę, nie na sesję.
- Egzekwowane: `.claude/settings.json` w „Bazie wiedzy" (`allow` na commit, `ask`
  na push) i `.claude/settings.local.json` z `ask` w pięciu repo z kodem.
  `attribution.commit: ""` w `~/.claude/settings.json` — commity bez stopki Claude.
