# ten-sam-defekt-z-kilku-osi-nie-scalony

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
Ten sam defekt zgłoszony przez kilka osi przechodzi przez `crm assemble` jako osobne uwagi. Każdą
ocenia inny weryfikator z inną checklistą, więc jeden defekt dostaje rozbieżne pewności, a sesja
scala je ręcznie przed `send`.

## Przyczyna źródłowa
`mergeAgreement` w `lib/findings.mjs` łączy tylko uwagi o tej samej `axis` i tym samym `file`
(`if (cluster.axis !== finding.axis || cluster.file !== finding.file) continue;`), a `dedupe`
kluczuje po źródle i odcisku. Uwagi z różnych osi o tych samych liniach nigdy się nie spotykają,
a `crm parts` wysyła je do różnych weryfikatorów.

## Dowody
- 2026-11-19, sesja 4e906a74-5c70-4d23-b56c-ba04b7047f2d (id claude.ai niedostępny; saas app,
  PR #216, run `20261119-105530-v3fe`): 14 uwag po `assemble` to 6 defektów. Brak `limit` przy
  `/api/landing/tenants` jako f-08/f-09/f-10 (40/50/50), zagnieżdżony `CardContent` jako
  f-12/f-13/f-14, pełnoekranowy `SchoolErrorState` jako f-02/f-04/f-05/f-06 (75/35/50/50). Ten sam
  wyścig z profilem w `account.tsx:73` dostał 75 jako `issue-conformance` (f-01) i 45 jako
  `web-frontend` (f-03). Scalanie i odrzucenie f-04 zrobiłem ręcznie w tabeli spod progu.

## Rozwiązanie
Po `mergeAgreement` dodaj w `crm assemble` krok scalania międzyosiowego: uwagi o tym samym `file`
z nakładającymi się `lines` i tym samym cytatem `evidence` (po normalizacji spacji) łącz w jedną,
z najwyższą `severity`, listą osi w `axes` i pozostałymi twierdzeniami w `alsoClaimed`. Taką uwagę
`crm parts` przydziela części osi o najwyższej wadze domyślnej, a jej weryfikator dostaje
checklisty wszystkich osi z `axes`.
