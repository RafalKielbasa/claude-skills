---
name: feedback-no-multiagent-fanout
description: "Maksymalnie 3 subagenty na raz — setup Rafała (opus[1m], effortLevel xhigh) jest OK, problemem kosztowym był fan-out na kilkanaście agentów"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 6f9fb8d2-9568-4a6e-85ee-c7217ed6af9e
  modified: 2026-08-13T12:08:03.064Z
---

2026-08-13: **limit 3 subagentów** — nigdy więcej równolegle, ani łącznie na
jedno zadanie bez pytania. Dotyczy `Agent` i skryptów `Workflow`, które piszę.
Jeśli zadanie wygląda na szersze niż 3 agenty, powiedz to i zapytaj, zamiast
rozsiewać.

Wyjątek, którego nie ograniczę z zewnątrz: `/code-review` sam forkuje swoją
flotę, więc **odpalam go tylko wtedy, gdy Rafał nazwie skill po imieniu**
(`/code-review`, „odpal code-review", „ultrareview"). **„Zrób review PR N" to
NIE jest ta prośba** — to polecenie zrobienia review samodzielnie, w głównej
pętli. (Twardy limit dla workflowów Rafał może też ustawić w `/config` →
Dynamic workflow size.)

**Why:** przy review PR #145 odpaliłem w tle wieloagentowe `/code-review 145`,
podczas gdy równocześnie sam weryfikowałem te same trzy uwagi codexa na tych
samych plikach. Fan-out padł na limicie miesięcznym, zanim cokolwiek zwrócił —
wypalił Rafałowi cały 4-godzinny limit i nie dostarczył ani jednego znaleziska.
Zaproponowałem wtedy zejście z `effortLevel: xhigh` i `model: opus[1m]` w
globalnym settings.json; Rafał to odrzucił — ten setup wystarczał mu bez
problemu, wąskim gardłem była moja decyzja orkiestracyjna, nie konfiguracja.
**Nie proponuj ponownie obniżania effortLevel ani modelu jako lekarstwa na koszt.**

**How to apply:** gdy Rafał daje gotowe findings (np. z codex CLI) i prosi o
review — weryfikuj i naprawiaj sam w głównej pętli, bez spawnowania agentów.
Gdy review trzeba zrobić od zera, rób je inline albo maks. 3 agentami na
rozdzielne obszary. Szeroki sweep zostaw codexowi (osobny billing) — patrz
workflow z globalnego CLAUDE.md.

Powiązane: [[feedback-no-commits-user-only]], [[cp21-merge-resolution-2026-08-12]].
