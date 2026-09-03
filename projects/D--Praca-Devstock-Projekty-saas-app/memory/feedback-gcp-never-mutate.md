---
name: feedback-gcp-never-mutate
description: "Never mutate GCP state; hand Rafał the CLI command with a step-by-step explanation. Reads allowed except sensitive ones (IAM, service accounts, keys, tokens, secrets)."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: ab294e04-a038-41aa-92b1-8030946fb47d
  modified: 2026-08-14T11:59:48.990Z
---

Rafał wykonuje wszystkie zmiany w GCP sam. Ja podaję komendę `gcloud`/`gsutil`/`bq` do wklejenia wraz z wyjaśnieniem krok po kroku: co robi każdy fragment, na jakim zasobie działa, co zmieni i jak to cofnąć.

Odczyt mogę robić sam (`storage buckets list/describe`, `storage ls`, `services list`, `projects describe`, `config list`, `iam roles describe`), ale **nie dane wrażliwe**: polityki IAM, konta serwisowe i klucze, tokeny, sekrety — te podaję jako komendę i czekam na wklejony wynik.

**Why:** ustalone 2026-08-14, po tym jak samodzielnie włączyłem `iamcredentials.googleapis.com` i nadałem rolę `serviceAccountTokenCreator` w projekcie `edu-saas-505415`. Zmiany w chmurze dotykają współdzielonej infrastruktury i cudzych dostępów, więc decyzja i wykonanie należą do Rafała. Odczyt niewrażliwy zostawiony mnie, bo bez niego diagnostyka zamienia się w wielorundowy dialog — tak wyszedł na jaw zepsuty warunek IAM na buckecie `edu-saas-dev`.

**How to apply:** komenda zmieniająca stan trafia do odpowiedzi jako blok do skopiowania, nigdy do narzędzia Bash. Wyjaśnienie jest obowiązkowe, nie opcjonalne. Dotyczy też subagentów i skilli — jeśli instrukcja każe wykonać zmianę, pomijam krok i mówię o tym wprost. Wyjątek tylko na jawną prośbę w danej rozmowie, ważną dla tej jednej prośby.

Reguła spisana też w globalnym `CLAUDE.md`, sekcja "GCP i infrastruktura chmurowa". Analogiczna w duchu do [[feedback-no-commits-user-only]].
