---
name: n8n-webhook-basicauth-bez-credentiala
description: n8n zwraca 500 "No authentication data defined on node!" gdy webhook ma basicAuth bez podpiętego credentiala; sonda złym hasłem odróżnia to od zdrowego webhooka (401).
metadata:
  type: project
---

Webhooki n8n w `devstock-team-agent` mają w repo `authentication: basicAuth`
bez pola `credentials` (konwencja: credential wstrzykiwany przy deployu).
Gdy deploy pominie graft, instancja zwraca **HTTP 500** z body
`No authentication data defined on node!` — nie 401. Aplikacje widzą to jako
zwykłą awarię agenta (np. `[/api/chat] Error: Agent returned 500`).

**How to apply:** sonduj webhook celowo **błędnym** Basic Auth — n8n sprawdza
autoryzację przed uruchomieniem workflowu, więc sonda nic nie wykonuje:

    curl -s -X POST https://n8n-devstock.fly.dev/webhook/<sciezka> \
      -H "Authorization: Basic $(printf 'invalid:invalid' | base64 -w0)" -d '{}'

`401 Authentication data is wrong!` → credential podpięty (szukaj dalej).
`500 No authentication data defined on node!` → brak credentiala na węźle.
Zdrowe webhooki na prodzie: `index-knowledge-entry`, `create-task-issue`,
`kb-ask`, `kb-admin` (2026-08-24). Aplikacja `company-agent-chat` używa
**jednego** `AGENT_API_KEY` do wszystkich trzech swoich webhooków, więc
brakujący credential kopiuj z webhooka 26. Patrz [[baza-wiedzy-wdrozenie-task-12]].
