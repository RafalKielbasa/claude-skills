---
name: harness-test-fails-locally-on-windows
description: "apps/cms harness.test.ts fails on Rafał's Windows machine for environmental reasons (python3 is the Store stub, py is 3.13); not a regression"
metadata:
  node_type: memory
  type: project
  originSessionId: caf82c4c-ed89-4704-af0b-443d0cc34072
  modified: 2026-11-19T10:45:32.576Z
---

On Rafał's Windows machine the full CMS suite (`pnpm --filter @devstock/cms test:run`) reports `__tests__/utils/harness.test.ts` failing: `python3` resolves to the Microsoft Store stub ("nie znaleziono Python"), so all 62 tests fail. With `HARNESS_PYTHON=C:\Python313\python.exe` (from `py`, Python 3.13.5, no 3.12 installed) 47 of 62 still fail. Checked 2026-11-19 on a branch that did not touch `harness.py`.

**Why:** the harness targets Python 3.12 (`PYTHON_VERSION`) and the machine has no 3.12; the remaining failures are environmental, not caused by the change under review.

**How to apply:** when this file fails in a full run, report it as environmental next to `automation-token` and `jira` (CLAUDE.md), and don't debug it unless the change touches `apps/cms/src/utils/codeRunners/`. See also [[python-crlf-on-windows]].
