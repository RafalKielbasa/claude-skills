---
name: prod-db-schema-drift-vitess
description: "Production CMS DB is Vitess-based; prisma migrate diff/db push against it shows ~158 FK drop/re-add pairs and a DROP TABLE of a `_vt_` table — never run a blanket db push on prod"
metadata:
  node_type: memory
  type: project
  originSessionId: caf82c4c-ed89-4704-af0b-443d0cc34072
  modified: 2026-11-19T12:34:17.564Z
---

On 2026-11-19 (DT-141), `pnpm keystone prisma migrate diff --from-schema-datasource schema.prisma --to-schema-datamodel schema.prisma --script` run in `codebusters-cms-production` (via `flyctl ssh console`) printed 953 lines: 158 `DropForeignKey`/`AddForeignKey` pairs (prod FK names carry a random suffix, e.g. `Achievement_course_fkey_7sluwhu201ysppzlp5ll6kniy`, Prisma wants `Achievement_course_fkey`) and `DROP TABLE \`_vt_vrp_<hash>_<timestamp>_\`` (a Vitess online-DDL artifact). The real schema change of the release (a column default) was already applied and did not appear in the diff.

**Why:** the database is Vitess-based (likely PlanetScale): it renames FKs and leaves `_vt_*` tables, so the drift is permanent and `db push` would try to rebuild every FK and drop a Vitess internal table.

**How to apply:** before any `db push` on prod, run the read-only diff and look only for the tables/columns the release changes; check a single column with a read-only `information_schema` query (Prisma `$queryRawUnsafe` piped as base64 into `node` over `flyctl ssh console`). Never hand Rafał a bare `pnpm db:push` for production. `pnpm db:push` also echoes `$DATABASE_URL` (password) — use `pnpm keystone prisma db push` when a push is truly needed. flyctl lives in WSL (`~/.fly/bin/flyctl`, not on PATH for `bash -lc`); call it with `MSYS_NO_PATHCONV=1 wsl.exe bash -lc "~/.fly/bin/flyctl …"`. See also [[w2-gate-harness-lessons]].
