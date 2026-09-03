---
name: n8n-cli-execute-and-exec-debug
description: Jak wykonać workflow z CLI mimo działającej instancji (one-off kontener; tylko executeWorkflowTrigger) i jak debugować przebiegi z execution_data (format flatted)
metadata: 
  node_type: memory
  type: project
  originSessionId: fb55b19d-354e-4794-ab9e-c28921890ced
  modified: 2026-07-29T08:15:48.841Z
---

**Wykonanie workflow z CLI** (bez klikania w UI): `docker exec` w działającym
kontenerze pada („Task Broker's port 5679 is already in use" —
[[n8n-cli-import-publish]]). Działa one-off kontener:
`docker compose run --rm --no-deps n8n execute --id=<id>` — entrypoint obrazu
to już `n8n`, więc BEZ powtarzania słowa `n8n` w argumentach (inaczej „Command
n8n not found"). Ograniczenie: CLI `execute` wymaga node'a **Execute Workflow
Trigger** — workflow z samym Schedule Triggerem trzeba tymczasowo skopiować z
podmienionym triggerem (import kopii 99_smoke_*, po smoke usunąć). Kopia używa
tych samych credentials/bazy; `--no-deps` wystarcza, bo sieć compose już stoi.
W Git Bash na Windows: `MSYS_NO_PATHCONV=1`, inaczej `/dev/stdin` zamienia się
w `C:/Program Files/Git/dev/stdin`.

**Debug przebiegu:** tabela `execution_data` (kolumna `data`, klucz
`executionId` z `execution_entity` po `workflowId`) przechowuje pełny runData w
formacie **flatted** (pula referencji — ręczne parsowanie przekłamuje). Dekodować
biblioteką `flatted`: `parse(raw).resultData.runData` → per node lista runów z
`data.main[wyjście][item]` i `error`. To jedyny sposób, by zobaczyć, które
wyjścia naprawdę emitowały itemy (wykryło bug z
[[n8n-alwaysoutputdata-error-output]]).
