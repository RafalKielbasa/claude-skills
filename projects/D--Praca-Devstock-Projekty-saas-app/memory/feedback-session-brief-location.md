---
name: feedback-session-brief-location
description: "Brief z podsumuj-sesja-claude ZAWSZE ląduje w D:\\Notatki\\notatki\\praca-z-claude.md — tylko tam, nie w plikach per-projekt"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 22bf9c67-e615-4001-8441-4093526e2766
  modified: 2026-08-13T16:43:56.017Z
---

Skill `podsumuj-sesja-claude` ma odkładać brief sesji ZAWSZE do jednego pliku: `D:\Notatki\notatki\praca-z-claude.md` — i tylko tam. NIE do plików per-projekt (np. `projekty/edu-saas/edu-saas-sesje.md`).

**Why:** to jest jeden dziennik, do którego Rafał realnie wraca, żeby wznowić pracę — zależy mu na tym najbardziej. Rozrzucanie briefów po plikach projektowych sprawia, że ich nie znajduje.

**How to apply:** przy `podsumuj-sesja-claude` celuj w ten plik (nowy wpis na górze, odwrotnie chronologicznie). Jeśli w repo nie ma markera `<!-- podsumuj-sesja-claude: … -->`, użyj tej ścieżki bez pytania i bez zgadywania pliku lokalnego dla projektu. Marker dla repo edu-saas jest w `CLAUDE.local.md`. Pliki per-projekt (jak `edu-saas-sesje.md`) mogą trzymać INNE artefakty (checklisty, zamrożone koncepcje) — to nie briefy i ich nie ruszamy.
