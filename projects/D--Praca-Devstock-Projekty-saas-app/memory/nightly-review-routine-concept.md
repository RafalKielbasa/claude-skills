---
name: nightly-review-routine-concept
description: "2026-09-03 koncept pracy nocnej — wybrany wariant \"rutyna nocna read-only\" w chmurze; brainstorming (architectural) przerwany przed 1. pytaniem; zebrane fakty z docs i repo + otwarte decyzje"
metadata: 
  node_type: memory
  type: project
  originSessionId: d2fba951-f7ca-48a2-8cf1-58262baeed38
  modified: 2026-09-03T19:54:10.071Z
---

# Nightly read-only review routine — stan konceptu (2026-09-03)

**Cel Rafała:** praca z Claude w nocy, gdy śpi. Z 4 wariantów wybrał na start
**rutynę nocną read-only** (chmura, PC wyłączony): checkout gałęzi roboczej,
`tsc`/lint/unit, review zmian wg `docs/review-guide.md`, raport rano, **zero commitów**.
Odłożone warianty: ticket → draft PR (GitHub Action / GitHub trigger),
plan wykonany w nocy (`claude --cloud`), lokalny headless (`claude -p` + Task Scheduler).

**Proces:** skill `superpowers:brainstorming`, sklasyfikowane jako **architectural**
(nowy podsystem). Spec docelowo `docs/superpowers/specs/2026-09-XX-nightly-review-routine-design.md`.
Przerwane po fazie "explore context", **przed pierwszym pytaniem doprecyzowującym**.

## Fakty zweryfikowane

- `RemoteTrigger list` → HTTP 200, pusta lista: konto ma dostęp do API rutyn, nic nie skonfigurowane.
- Repo: `github.com/kodozercy/edu_saas` (org `kodozercy`, nie konto Rafała). Gałęzie Rafała: `feat/rafal-kielbasa/CP-XX-...`.
- `.github/workflows/ci.yml`: lint+format:check, typecheck, unit (`pnpm test`), e2e z serwisami
  `postgres:15` + `redis:7` i kompletem dummy env (linie 95–121) — gotowy wzór env dla chmury.
- Repo nie ma `.claude/skills/` (tylko `settings.local.json`).

## Fakty z docs (code.claude.com/docs/en/routines.md, cloud-environments.md, claude-code-on-the-web.md)

- Rutyna klonuje **default branch** (`main`); inną gałąź musi wskazać prompt. Cron nie wie, nad czym Rafał pracował.
- Rutyna może używać **skilli zacommitowanych w repo** → logika review wersjonowana w `.claude/skills/`, prompt = "run skill X".
- Push tylko na `claude/*` (albo gałąź wyłącznie z commitami Rafała). Chmura widzi tylko wypchnięte commity.
- VM (Ubuntu 24.04): Node 20/21/22 (22 na PATH, 20 w `/opt/node20/bin`), pnpm, **gh** (token `proxy-injected`,
  działa bez loginu; skrypt czytający `GITHUB_TOKEN` dostaje placeholder), Docker, **PostgreSQL 16 i Redis 7
  preinstalowane, nie uruchomione** (`service postgresql start`). Setup script cache'owany jako snapshot FS.
- Trusted network zawiera `api.github.com`, `github.com`, rejestry npm/Docker.
- Schedule: min. interwał 1 h, stagger kilka minut, dzienny limit uruchomień (one-off bez limitu).
- GitHub trigger (`pull_request.*`) wymaga **Claude GitHub App zainstalowanej na repo** — `/web-setup` daje tylko clone, nie webhooki.
  Repo w org `kodozercy` → instalacja może wymagać ownera org.
- Zielony status runu ≠ sukces zadania; czytać transkrypt. Debug: `RemoteTrigger list_runs` + `get_run_log`.

## Otwarte decyzje (pytać po jednym, w tej kolejności)

1. **Wybór gałęzi:** pinned przez `/schedule update` / gałęzie `*rafal-kielbasa*` z pushem <24 h / otwarte PR-y Rafała / tekst w Run now.
2. **Kanał raportu:** komentarz PR przez `gh` / issue GitHub / tylko sesja w claude.ai/code / connector Slack.
3. **Zakres testów:** tylko tsc+lint+unit vs. Postgres+`prisma migrate deploy`+e2e (VM to umożliwia).
4. **Trigger:** cron ~02:00 vs `pull_request.synchronize` (wymaga GitHub App).

## Zderzenie z regułami Rafała (omówione, zaakceptowane jako ramy)

Noc = autonomia: decyzje z góry w spec/planie, przy dylemacie **stop + raport, nie zgadywać**.
Read-only omija konflikt z „nie commituj"; bramka per zadanie staje się asynchroniczna (poranne review).

**Why:** bez tego jutro trzeba powtórzyć ~10 min researchu docs i ponownie klasyfikować.
**How to apply:** wznowić od pytania 1 z listy; nie proponować od nowa wariantów — wybór już padł.
Powiązane: [[feedback-per-task-review-gate]], [[feedback-no-commits-user-only]], [[e2e-test-db-migrations]].
