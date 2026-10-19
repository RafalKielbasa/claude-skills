# cli-modyfikujace-konfiguracje-dopisuje-wartosci-wyliczone

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Komenda CLI miała zmienić dwie wartości w pliku konfiguracji, a przepisała cały plik: sformatowała
go po swojemu i dopisała wartości wyliczone z wtyczek, w tym uprawnienie, które repo celowo blokuje.
`git diff` uruchomiony po komendzie pokazał to przed commitem.

## Przyczyna źródłowa
Komendy „init/link” narzędzi Expo zapisują konfigurację odczytaną po ewaluacji (z wtyczkami), a nie
oryginalny plik statyczny. Komunikat narzędzia mówi tylko „modified app.json”, więc bez diffu
dodatki wchodzą do commitu niezauważone.

## Dowody
- 2026-10-19, sesja e81e95d7-be5a-457d-884b-77d8d63c4251 (id claude.ai niedostępny), repo
  code-busters-mobile, gałąź `feat/rafal-kielbasa/dt-37-spike-themes`: `eas init --force` dał diff
  29 dodanych linii zamiast 2 — przeformatowane `associatedDomains` i `intentFilters` oraz nowy blok
  `android.permissions` z `RECORD_AUDIO` (w repo na liście `blockedPermissions`), `USE_BIOMETRIC`,
  `USE_FINGERPRINT`. Skutki uboczne cofnięte edycją, w commicie `7ab1618` zostały trzy wartości:
  `updates.url`, `owner`, `projectId`.

## Rozwiązanie
Po każdej komendzie CLI, która zgłasza modyfikację pliku konfiguracji (`eas init`, `expo install --fix`,
`npx <narzędzie> init`), uruchom `git diff <plik>` przed commitem i porównaj z tym, co komenda miała
zmienić. Nadmiar cofnij edycją; nie przywracaj całego pliku, bo zniknie też zamierzona zmiana.
