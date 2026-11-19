# semgrep-docker-desktop-windows-nierozpoznany

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
Gdy Docker Desktop na Windowsie nie działa, raport pisze „**Semgrep nie zadziałał**: `docker:
failed to connect to the docker API at npipe:…`” zamiast „Semgrep niedostępny (Docker nie działa
albo nie jest zainstalowany)”. Wygląda to jak błąd skanu, a nie jak wyłączony Docker.

## Przyczyna źródłowa
`DOCKER_DOWN` w `lib/report.mjs:40` rozpoznaje tylko komunikaty `error during connect` i
`Cannot connect to the Docker daemon`. Klient Dockera dla Docker Desktop na Windowsie mówi
`failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`, więc
`dockerIsDown` zwraca fałsz i `semgrepUnavailable` wybiera ogólną gałąź.

## Dowody
- 2026-11-19, sesja 4e906a74-5c70-4d23-b56c-ba04b7047f2d (id claude.ai niedostępny; saas app,
  PR #216, run `20261119-105530-v3fe`): `crm finders --wait` zwrócił `reason: "docker-error"` z
  `detail` „docker: failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine;
  check if the path is correct and if the daemon is running …”, a `raport.md` napisał „Semgrep nie
  zadziałał”. Wcześniej, 2026-11-19 przy PR #217, Semgrep też padł, bo Docker nie działał.

## Rozwiązanie
Rozszerz `DOCKER_DOWN` o komunikat Docker Desktop:
`/error during connect|Cannot connect to the Docker daemon|failed to connect to the docker API/i`,
i dodaj test z `detail` z npipe do testów `report.mjs`.
