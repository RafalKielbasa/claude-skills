---
name: claude-dir-backup-autocommits
description: "~/.claude ma automatyczny backup, który sam commituje i pushuje zmiany (także skilli) co kilkadziesiąt minut"
metadata:
  node_type: memory
  type: reference
  originSessionId: 51ae2c74-bb8c-4589-a22e-43752eafb286
  modified: 2026-11-18T14:24:17.698Z
---

Repo `~/.claude` (`RafalKielbasa/claude-skills`, gałąź `main`) ma automatyczny backup: commity `backup: sync .claude config (N files) <data>` powstają same co kilkadziesiąt minut i idą na `origin`. Zaobserwowane 2026-11-18: edycje skilla `code-review-master` trafiły do `8b43bbe` i `90da2c2` w trakcie pracy, zanim Rafał je przejrzał (`git ls-remote origin refs/heads/main` = `90da2c2`).

**How to apply:** przy zmianach w `~/.claude` nie obiecuję, że „zostają niezacommitowane do review”. Podaję w raporcie hash commita backupu i zakres do przejrzenia (`git diff <przed>..<po> -- <ścieżka>`). `~/.claude/review/global.md` nie jest śledzony przez gita, więc przed jego zmianą robię kopię. Sam nie commituję ani nie pushuję w tym repo bez jawnej prośby. Gdy Rafał o to prosi, przed `git commit` importuję `hooks/lib/ClaudeBackup.psm1` i uruchamiam `Test-SecretContent -Path <plik>` dla każdego pliku w commicie (wynik inny niż `$null` = stop), bo ręczny commit omija skaner, którym bramkuje się backup. 2026-11-18 `f03445c` poszedł bez skanu, skan po fakcie był czysty. Wzorzec w wiki: `repo-claude-commituje-backup-nie-sesja`.
