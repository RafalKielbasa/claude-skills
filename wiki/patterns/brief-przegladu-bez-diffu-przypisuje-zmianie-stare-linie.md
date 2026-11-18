# brief-przegladu-bez-diffu-przypisuje-zmianie-stare-linie

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
Agent briefu (fala 0, Haiku) opisuje zmianę błędnie: przypisuje jej linie, które były w pliku
przed PR-em, albo nie umie wskazać linii, którą PR faktycznie dodał. Podsumowanie i `risks`
trafiają do każdego agenta osi, więc bez ręcznej korekty wszystkie osie startują od fałszywego
obrazu zmiany.

## Przyczyna źródłowa
`prompts/brief.md` dostaje tylko listę plików z licznikami `+/-` (`{{SUMMARY_INPUT}}`), bez
`{{DIFF_NOTE}}`, który mają fale 1 i 2. Agent czyta pliki w całości i zgaduje, które linie są
nowe; przy małej zmianie w dużym pliku zgaduje źle.

## Dowody
- 2026-10-30, sesja niedostępna (saas app, PR #207, run `20261030-180055-b5gj`, pamięć projektu
  `code-review-master-config-2026-09-07`): „Brief (Haiku) przekłamał zmianę `.gitignore` —
  poprawiłem summary przed osiami”.
- 2026-11-18, sesja 140fbd7f-77b7-474d-927d-01ab988fa726 (id claude.ai niedostępny; saas app,
  PR #219, run `20261118-163858-xd38`): brief napisał, że jedna linia w `app.module.ts` jest
  „unverified” (to `prefix: process.env.BULLMQ_PREFIX ?? 'bull'`), i opisał wymuszenie
  `MAILERSEND_API_KEY` w `setup-env.ts` jako część zmiany, choć te linie poprzedzają PR. Wykryte
  dopiero przez własny `git diff`; podsumowanie i `risks` poprawione przed dispatchem osi.

## Rozwiązanie
Dodać `{{DIFF_NOTE}}` do `prompts/brief.md` (ta sama komenda z `target.diffCommand` co w falach 1
i 2) z poleceniem: „Opisz, co zmienił diff, nie co jest w pliku; linia spoza diffu nie należy do
zmiany”. W Kroku 3 SKILL.md: przed dispatchem fali 1 porównaj podsumowanie z `git diff --stat`
i małymi hunkami; rozjazd popraw w `{{SUMMARY}}` i powiedz o nim użytkownikowi jednym zdaniem.
