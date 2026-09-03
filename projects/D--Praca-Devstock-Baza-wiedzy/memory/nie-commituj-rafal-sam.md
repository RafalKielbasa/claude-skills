---
name: nie-commituj-rafal-sam
description: "W repo „Baza wiedzy\" Claude NIE robi commitów ani pushy — commituje wyłącznie Rafał sam."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 99a239aa-6f9d-4252-a7e9-f52f1931c77c
  modified: 2026-07-23T14:36:29.021Z
---

W repo „Baza wiedzy" **nie commituję ani nie pushuję** — wszystkie commity robi
Rafał sam. Egzekwowane przez `.claude/settings.json`: `includeGitInstructions:
false` + `permissions.deny` na `git commit`/`git push` (Bash i PowerShell).

**Why:** współdzielony working tree z drugą sesją (np. praca TTS na własnej
gałęzi) sprawił, że mój commit wylądował na cudzej gałęzi zamiast na `main`
(patrz [[baza-wiedzy-wdrozenie-task-12]]). Rafał woli sam panować nad tym, co
i na jakiej gałęzi ląduje.

**How to apply:**
- Rób zmiany w plikach normalnie (Edit/Write), pokazuj `git diff`/`status`,
  ale **kończ na tym** — nie odpalaj `git commit`/`git push`.
- Gdy praca gotowa do commita, powiedz Rafałowi wprost „gotowe do commita"
  i zostaw mu wykonanie.
- `git add`/`status`/`log`/`diff` są OK (nie zmieniają historii).
- Jeśli Rafał wyraźnie poprosi o commit w danej rozmowie — to nadrzędne wobec
  tej zasady (settings.json go zablokuje, ale poinformuj i zdaj się na niego).
