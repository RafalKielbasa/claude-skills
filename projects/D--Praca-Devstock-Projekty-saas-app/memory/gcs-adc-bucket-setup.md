---
name: gcs-adc-bucket-setup
description: "GCS dev bucket edu-saas-dev — ADC-only auth verified 2026-08-14, public read scoped to a thumbnails/ managed folder, teammates still lack object write"
metadata: 
  node_type: memory
  type: project
  originSessionId: 3bfa3530-1fdf-4747-88dc-100eee187c25
  modified: 2026-09-07T09:30:48.543Z
---

Projekt `edu-saas-505415`, bucket `gs://edu-saas-dev` (europe-central2, UBLA
włączone, public access prevention niewymuszone). Stan zweryfikowany 2026-08-14.

**Uwierzytelnianie to wyłącznie ADC** — `gcloud auth application-default login`,
zero service accountów i kluczy. Jest to możliwe, bo upload miniatur idzie przez
API (`multipart` → `StorageService.uploadBuffer`), a nie podpisanym URL-em prosto
z przeglądarki; podpisywanie (`signBlob`) to jedyna operacja, której konto
użytkownika nie umie. Nie wracaj do signed upload URL bez zmiany tej decyzji.
`gcloud auth login` nie wystarcza — to inny magazyn poświadczeń niż ADC.

**Publiczny odczyt: managed folder, nie binding na buckecie.** IAM odrzuca warunki
na bindingach z `allUsers` (`Conditions are not allowed on public resources`), więc
zawężenie prefiksu przez `--condition` jest niewykonalne. Rozwiązanie: managed
folder `gs://edu-saas-dev/thumbnails/` z `allUsers` → `roles/storage.objectViewer`.
Reszta bucketa zostaje prywatna. **PDF-y z CP-37 muszą lądować poza `thumbnails/`**,
inaczej staną się publiczne.

Zweryfikowane empirycznie dla `rafal.kielbasa@devstock.com`: zapis obiektu przez
ADC działa, anonimowy GET pod `thumbnails/` zwraca 200.

`roles/storage.objectUser` nadany bezwarunkowo całemu zespołowi (Rafał, Konrad,
Miłosz). Zastąpił martwy binding `roles/storage.editor` z warunkiem
`edu-saas-developer`, który nie dawał nic — rola nie zawiera **żadnego**
uprawnienia `storage.objects.*` (to rola do zarządzania bucketami), a warunek i tak
nigdy nie matchował, bo używa `resource.name == "edu-saas-dev"` zamiast kanonicznego
`projects/_/buckets/edu-saas-dev`, przy `resource.type` zawężonym do `Bucket`
(operacje na obiektach niosą typ `Object`). Sam binding mógł zostać w polityce jako
nieszkodliwy śmieć — do sprzątnięcia w konsoli.

Zaległość: `cloudbuild.yaml` wstrzykuje na Cloud Run tylko `DATABASE_URL` i
`JWT_SECRET`, a `StorageService` robi `getOrThrow('GCS_BUCKET')` — patrz
[[api-boot-env-requirements]].

2026-09-07: odczyt obiektu (`objects.get`, `file.download()`) przez ADC
zweryfikowany na żywo — certyfikat serwowany przez API, patrz
[[pr165-cp38-certificate-variant-c]]. Wygaśnięcie ADC objawia się jako
`{"error":"invalid_grant","error_description":"reauth related error (invalid_rapt)"}`
przy pierwszej operacji na buckecie, nie jako błąd uprawnień; po
`gcloud auth application-default login` działający proces API trzeba
zrestartować, bo `google-auth-library` trzyma stary refresh token w pamięci.
`gcloud` CLI wygasa niezależnie (`Reauthentication failed. cannot prompt during
non-interactive execution` przy `gcloud iam roles describe`).
