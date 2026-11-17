# odtwarzacz-vimeo-odmawia-chromium-bez-okna

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Sukces: odtwarzanie filmu Vimeo osadzonego na stronie potwierdzone w widocznym oknie Chrome sterowanym przez Playwright, po tym jak tryb bez okna pokazał w ramce „We couldn't verify the security of your connection” i 401.

## Przyczyna źródłowa
`player.vimeo.com` stoi za kontrolą botów Cloudflare, która odrzuca Chromium bez okna i `curl` (401), niezależnie od ustawień prywatności filmu. Ten sam film odpowiada 200 w zwykłej przeglądarce, więc 401 z automatu nie mówi nic o filmie.

## Dowody
- 2026-11-17, sesja d3dca57e-92f2-418a-b0e5-a28120ba9cf3 (id claude.ai niedostępny; code-busters-v2, worktree `landing-redesign`, przebudowa landingu DT-182 #1021): `curl` i zrzut bez okna dały 401 dla filmu, który oEmbed opisywał jako publiczny. Skrypt z `chromium.launch({ headless: false, channel: 'chrome' })` kliknął odtwarzanie i odczytał z ramki `currentTime` 6,7 s, `paused: false`, status 200; to samo po podmianie filmu na `1247686414` (7,8 s). oEmbed (`vimeo.com/api/oembed.json`) wykrył też, że „nowy” adres podany przez Rafała ma ten sam identyfikator co poprzedni.

## Rozwiązanie
Odtwarzanie osadzonego Vimeo sprawdzaj w przeglądarce z oknem: Playwright z `headless: false` i `channel: 'chrome'`, klik w przycisk, odczyt `currentTime` i `paused` z elementu `video` w ramce odtwarzacza. 401 z `curl` albo z Chromium bez okna zapisz jako blokadę botów, nie jako wadę filmu. Tożsamość i dostępność filmu (tytuł, długość, data wgrania) czytaj z oEmbed przed zmianą w kodzie.
