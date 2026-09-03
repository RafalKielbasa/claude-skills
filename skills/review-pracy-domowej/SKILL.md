---
name: review-pracy-domowej
description: Use when the user asks to review a course student's homework against a task file's acceptance criteria — triggers like "zrób review pracy domowej", "sprawdź pracę kursanta", "oceń pracę domową", or an explicit /review-pracy-domowej with a path to the student's work. NOT for reviewing your own repo's diff, branch, or PR — that is /code-review.
---

# Review pracy domowej

## Overview

Sprawdzasz pracę domową kursanta względem Acceptance Criteria z pliku zadania.
Wynik to **lista AC z werdyktem TAK/NIE i dowodem** — nic więcej.

**Zasada:** dowód albo NIE. Każde AC dostaje werdykt oparty na czymś, co
zobaczyłeś: klik w przeglądarce albo konkretne `plik:linia`. „Wygląda na to, że
działa" nie jest dowodem.

Robisz to **sam, w jednej sesji** — bez rozdzielania na subagentów i bez skilla
`code-review`.

## Wywołanie

```
/review-pracy-domowej <ścieżka do pracy> <ścieżka do pliku zadania>
```

Przykład: `/review-pracy-domowej lukasz/Modul2Sprint3PracaDomowa zadania/praca-domowa-react-3.md`

Brakuje którejś ścieżki — zapytaj. Nie zgaduj, które zadanie pasuje do której pracy.

## Krok 1 — wyciągnij AC

Wczytaj plik zadania. Acceptance Criteria leżą na jego końcu jako **tablica JSON**
pod nagłówkiem `Acceptance Criteria`. Przepisz je co do słowa — w raporcie
cytujesz oryginał, nie swoje streszczenie.

Nie ma tablicy albo jest niepoprawna — zatrzymaj się i zapytaj partnera.

## Krok 2 — podziel AC na koszyki

Każde AC trafia do dokładnie jednego koszyka. To decyduje, czym je sprawdzasz.

| Koszyk | Poznajesz po tym, że AC mówi o… | Sprawdzasz przez |
|---|---|---|
| **runtime** | tym, co użytkownik widzi i robi (motyw, modal, loader, paginacja, focus, siatka) | wykonanie czynności w przeglądarce |
| **kod** | strukturze i warsztacie (biblioteka do stylowania, hooki, brak `console.log`, miejsce deklaracji stanu) | lekturę źródeł, dowód `plik:linia` |
| **repo** | gałęziach, Pull Requeście, commitach | `git branch -a`, `git log --oneline`, `gh pr list` |

## Krok 3 — uruchom pracę

```bash
cd <ścieżka do pracy>
npm install
npm run dev          # w tle
```

Port **czytaj z outputu Vite**. Nie zakładaj 5173 — przy kilku pracach naraz
Vite przeskakuje na kolejny wolny.

Praca nie wstaje (błąd instalacji, błąd builda) — to nie jest powód, żeby
przerwać review. Zapisz to jako dowód i wszystkie AC z koszyka **runtime** dostają
**NIE** z tym samym powodem. Koszyki **kod** i **repo** rób normalnie.

## Krok 4 — sprawdź runtime w przeglądarce

Scenariusz wyprowadź **z listy AC**, nie z ogólnego wyobrażenia o aplikacji.
Dla każdego AC runtime wykonaj czynność, którą to AC opisuje, i zaobserwuj skutek —
np. kliknij przełącznik motywu i sprawdź, czy zmieniło się tło, tekst, karty,
modal i paginacja; otwórz modal, zamknij go na `X`, otwórz znowu i zamknij
kliknięciem poza; przejdź na kolejne strony paginacji i dojedź do jej krańców.

Zrzut ekranu, zmierzone style i błędy z konsoli to dowód — cytuj je w raporcie.
**Zrzuty otwieraj i oglądaj sam** — zrzut zapisany, ale nieobejrzany, nie jest dowodem.

### 4a — najpierw rozszerzenie

Użyj skilla `claude-in-chrome` (wywołaj go, zanim sięgniesz po narzędzia
przeglądarki) i otwórz `http://localhost:<port>`.

### 4b — fallback, gdy rozszerzenia nie ma

Rozszerzenie bywa niezainstalowane albo partner odmawia instalacji. Wtedy
**nie oznaczasz AC runtime jako NIE** — brak narzędzia po Twojej stronie to nie
jest wada pracy kursanta. Sterujesz przeglądarką sam:

1. Znajdź pobraną wcześniej binarkę Chrome: `ls ~/.cache/puppeteer/chrome/` —
   weź najnowszą wersję, ścieżka to `<wersja>/chrome-win64/chrome.exe`.
2. W katalogu roboczym sesji (**nie** w repo kursanta): `npm i puppeteer-core`.
   To sam sterownik, kilka MB — nie ściąga przeglądarki.
3. Napisz jeden skrypt `.cjs`, który przechodzi cały scenariusz, zrzuty zapisuje
   do plików, a resztę wypisuje jako JSON.

Nie ma binarki w cache'u ani `puppeteer-core` się nie instaluje — zatrzymaj się,
powiedz partnerowi, czego brakuje, i zapytaj, jak dokończyć. Nie zgaduj werdyktów.

### Co wyciągnąć ze skryptu

DOM daje dowody twardsze niż oko:

- `getComputedStyle` przed i po przełączeniu motywu — konkretne kolory zamiast „zmieniło się";
- `element.parentElement === document.body` — dowód na React Portal;
- `document.activeElement` po zamknięciu modala — dowód na powrót (albo brak powrotu) focusu;
- `page.on('request')` — czy po otwarciu modala faktycznie poszło zapytanie;
- `page.setViewport` na dwóch szerokościach plus `scrollWidth > innerWidth` — responsywność bez zgadywania.

Klikaj po treści elementu, nie po `aria-label` — w MUI numer strony ma tekst `197`,
ale etykietę `Go to page 197`, więc filtr po samych cyfrach nic nie znajdzie i klik
po cichu nie zadziała.

### Loader trzeba wymusić

AC o loaderze przelatuje w kilkadziesiąt milisekund i normalnie go nie zobaczysz.
**Opóźnij samo żądanie do API**, nie cały transfer — throttling całej sieci
(`Network.emulateNetworkConditions`) zdusi też ładowanie bundla Vite i nawigacja
padnie na timeout.

```js
let delayApi = true
await page.setRequestInterception(true)
page.on('request', async r => {
  if (delayApi && r.url().includes('api.example.dev')) await sleep(4000)
  await r.continue()
})
await page.goto(URL, { waitUntil: 'domcontentloaded' })
await sleep(2000)          // tu robisz zrzut i czytasz treść strony
delayApi = false
```

## Krok 5 — sprawdź kod i repo

Koszyk **kod**: czytaj źródła, każdemu AC przypisz `plik:linia`.
Koszyk **repo**: `git branch -a`, `git log --oneline -20`, a PR sprawdź przez
`gh pr list` tylko jeśli repo ma remote.

## Krok 6 — posprzątaj

Zatrzymaj dev serwer i **sprawdź, czy port faktycznie się zwolnił** — ubicie
zadania w tle zabija `npm`, ale proces Vite często zostaje. Jeśli port dalej
nasłuchuje, znajdź PID (`netstat -ano | grep :<port>`) i ubij go.
`node_modules` zostaje (jest w `.gitignore`).
**Niczego innego w repo kursanta nie zmieniasz** — nie poprawiasz kodu, nie
commitujesz, nie tworzysz gałęzi ani PR-a.

## Krok 7 — zapisz raport

Ścieżka: `review/<kursant>-<zadanie>-<YYYY-MM-DD>.md` w katalogu z pracami
(czyli **poza** repo kursanta). Utwórz `review/`, jeśli go nie ma.

```markdown
# Review — <kursant>/<nazwa pracy> — <plik zadania>

Data: YYYY-MM-DD · Commit: <sha z git log -1 --format=%h>

**1. TAK** — <treść AC dosłownie z pliku zadania>
> Kliknięcie przełącznika w prawym górnym rogu przestawia tło, karty i modal
> na ciemne (zrzut `theme-dark.png`).

**2. NIE** — <treść AC dosłownie z pliku zadania>
> Modal zamyka się tylko na `X`; kliknięcie w tło nic nie robi — handler
> jest wyłącznie na przycisku (`src/components/Modal.jsx:44`).
```

Po zapisaniu podaj partnerowi ścieżkę raportu i wypisz same AC z werdyktem **NIE**.

## Zasady werdyktu

- Tylko **TAK** albo **NIE**. Nie ma „częściowo", „prawie", „nie dotyczy".
- Nie da się sprawdzić (brak remote, więc nie ma jak zweryfikować PR-a; aplikacja
  nie wstaje) → **NIE**, a powód idzie do dowodu.
- Jedno AC = jedna pozycja. Nie łącz dwóch kryteriów w jedno i nie rozbijaj jednego na dwa.
- Kolejność i treść AC jak w pliku zadania.

## Częste błędy

| Błąd | Dlaczego to błąd |
|---|---|
| Werdykt dla AC runtime na podstawie kodu („jest `onClick`, więc działa") | Handler bywa podpięty i niedziałający. Masz to kliknąć. |
| **NIE** dla AC runtime, bo brakuje narzędzia do przeglądarki | To wada Twojego warsztatu, nie pracy kursanta. Fallback z kroku 4b albo pytanie do partnera. |
| Throttling całej sieci, żeby zobaczyć loader | Zdusi też bundle Vite i nawigacja padnie. Opóźniaj tylko żądania do API. |
| Port 5173 wpisany na sztywno | Vite przeskakuje na wolny port. Czytaj z outputu. |
| Dopisanie sekcji z uwagami, oceną albo punktacją | Wynik to sama lista AC z dowodem. |
| Streszczenie AC własnymi słowami | Kursant ma widzieć kryterium, na które się umawialiście. |
| Poprawienie zauważonego buga w repo kursanta | Review nie zmienia cudzej pracy. |
| Zostawiony dev serwer | Blokuje port przy następnym review. |
