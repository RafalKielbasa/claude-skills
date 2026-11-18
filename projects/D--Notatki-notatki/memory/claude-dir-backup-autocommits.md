---
name: claude-dir-backup-autocommits
description: "~/.claude ma automatyczny backup, który sam commituje i pushuje zmiany (także skilli) co kilkadziesiąt minut"
metadata:
  node_type: memory
  type: reference
  originSessionId: 51ae2c74-bb8c-4589-a22e-43752eafb286
  modified: 2026-11-18T13:57:58.374Z
---

Repo `~/.claude` (`RafalKielbasa/claude-skills`, gałąź `main`) ma automatyczny backup: commity `backup: sync .claude config (N files) <data>` powstają same co kilkadziesiąt minut i idą na `origin`. Zaobserwowane 2026-11-18: edycje skilla `code-review-master` trafiły do `8b43bbe` i `90da2c2` w trakcie pracy, zanim Rafał je przejrzał (`git ls-remote origin refs/heads/main` = `90da2c2`).

**How to apply:** przy zmianach w `~/.claude` nie obiecuję, że „zostają niezacommitowane do review”. Podaję w raporcie hash commita backupu i zakres do przejrzenia (`git diff <przed>..<po> -- <ścieżka>`). `~/.claude/review/global.md` nie jest śledzony przez gita, więc przed jego zmianą robię kopię. Sam dalej nie commituję ani nie pushuję w tym repo.
