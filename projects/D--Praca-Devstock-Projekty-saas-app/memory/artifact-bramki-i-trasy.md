---
name: artifact-bramki-i-trasy
description: "Link do artefaktu \"Bramki i trasy\" — wizualna mapa autoryzacji, routingu i subskrypcji (stan docelowy po obu specach z 2026-08-21)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: eae72433-da68-4673-aeed-4c101324428a
  modified: 2026-08-21T16:36:14.647Z
---

Artefakt **Bramki i trasy** (2026-08-21, prywatny, właściciel Rafał):
https://claude.ai/code/artifact/90fb158a-3f05-4b76-9322-13dcc1ccc1fd

Wizualna mapa stanu **docelowego** po specach [[subscription-model-spec]]
i [[user-tenant-membership-decisions]] — nie stanu obecnego repo. Siedem
diagramów SVG: łańcuch siedmiu bramek ze źródłem prawdy i kodem odrzucenia,
routing apex↔subdomena z przeniesieniem panelu, resolver przed/po, drabina
tras wg wymaganej rangi, drzewo `LessonAccessGuard`, maszyna stanów
subskrypcji, ściana 503 z trzema przejściami, macierz możliwości per rola,
kolejność wdrożeń.

Dwa ustalenia, które wyszły dopiero przy układaniu macierzy i **nie ma ich
w specach**: `PATCH /tenants/:id` (branding) to jedyna trasa właścicielska
bez `@Roles` — własność sprawdza serwis po `creatorUserId`, więc obejście
dla `super_admin` tam nie działa; odmowa założenia drugiej organizacji przez
ownera to 409 z indeksu `memberships_one_owner_per_user`, nie 403.

Źródło strony leży w repo: `docs/auth-flow-map.html` (2026-08-21, samodzielny
plik HTML z pełnym skeletonem — otwiera się wprost w przeglądarce; GitHub go
nie wyrenderuje, pokaże źródło). Celowo NIE jest zaindeksowany w `AGENTS.md`:
opisuje stan docelowy, więc kierowanie tam agentów pracujących nad obecnym
kodem myliłoby.

Aktualizacja artefaktu: republish tego samego pliku w tej rozmowie trzyma URL;
z innej rozmowy trzeba podać ten URL jako `url`, inaczej powstanie osobny
artefakt. Wersja w `docs/` i wersja opublikowana rozjeżdżają się niezależnie —
przy zmianie trzeba zaktualizować obie.
