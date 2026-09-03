---
name: plans-dir-gitignored
description: "docs/superpowers/plans/ jest w .gitignore repo edu_saas — plany są lokalne, zespół ich nie widzi; specy są śledzone normalnie"
metadata: 
  node_type: memory
  type: project
  originSessionId: e3afa055-3920-4197-82df-dce3f4c7f0c1
  modified: 2026-08-21T11:23:44.096Z
---

`.gitignore:37` w edu_saas wyłącza cały katalog `docs/superpowers/plans/` pod nagłówkiem
"Internal planning docs" (razem z `docs/.claude/`, `docs/reviews` i `SaaSArchitrecture.md`).
Zweryfikowane 2026-08-21: 38 plików planów na dysku, **0 śledzonych przez git**.
Dla kontrastu `docs/superpowers/specs/` jest śledzony normalnie (14 plików w repo).

**Why:** to zmienia sens zdania "zostawiam plan niezacommitowany w drzewie roboczym". Plan nie
czeka na commit — on jest niewidoczny dla gita i dla całego zespołu. `git add` bez `-f` nie zrobi
nic, a `git status` po napisaniu planu jest czysty, co wygląda jakby plik nie powstał.

**How to apply:**
- Nie odsyłaj nikogo do ścieżki `docs/superpowers/plans/...` w issue, PR-ze ani opisie epica —
  odbiorca tego pliku nie ma. Treść, która ma dotrzeć do zespołu, wkleja się w całości do issue.
  (Ta pomyłka wydarzyła się 2026-08-21 w opisach epików #154 i #158 i wymagała poprawki.)
- Odwołanie do specu jest bezpieczne, bo specy są w repo.
- Po napisaniu planu nie raportuj "czeka niezacommitowany" — powiedz wprost, że plik jest lokalny
  i poza kontrolą wersji. Zob. [[feedback-no-commits-user-only]].
