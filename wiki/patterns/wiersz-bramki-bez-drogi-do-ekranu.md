# wiersz-bramki-bez-drogi-do-ekranu

- **Skill:** ogólny (superpowers:writing-plans, superpowers:subagent-driven-development)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skrypt bramki dla użytkownika opisuje, co sprawdzić na ekranie, ale nie mówi, jak do niego dojść z uruchomionej
aplikacji. Użytkownik staje na wierszu i pyta, jak trafić na ekran. Dopiero wtedy wychodzi, że ekran nie ma
wejścia z nawigacji aplikacji.

## Przyczyna źródłowa
Wiersze bramki powstają z listy ekranów planu, czyli z tras plików (`/goal`), a nie z drogi użytkownika. Nikt
nie sprawdza, czy z trasy da się trafić tapnięciami. W expo-router każdy plik jest trasą, więc ekran bez żadnego
`router.push` ani `Link` do siebie przechodzi typecheck, recenzję i Storybook, a z aplikacji jest nieosiągalny.

## Dowody
- 2026-10-26, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf),
  code-busters-mobile, bramka M1 (`m1-gate.md`).
  - Wiersz 10 „Cel” wymieniał kartę celów na `/goal` bez drogi do niej. Rafał: „nie wiem jak trafić”.
  - Wtedy wyszło, że `/goal` nie ma wejścia z nawigacji aplikacji, tylko ze Storybooka albo z deep linka.
  - Ta sama bramka wymagała wcześniej trzech dopytań o przygotowanie: „podaj adres pliku do uruchomienia”,
    „podaj dane do logowania”, „podaj jeszcze raz krok po kolei”. Patrz
    [[bramka-na-urzadzeniu-bez-sprawdzenia-srodowiska]].
- 2026-10-30, sesja 188f3a4d-7157-4ac4-991a-d02805f5d47b (id claude.ai niedostępny; code-busters-v2, bramka W4), wariant
  danych zamiast nawigacji. Wiersz „karta: gość z CTA” (poprawka W4-D1 nr 34) wymagał właściciela karty
  z kodem polecającym. Plan, inwentarz („Gate data”), seed W4 i trasa `share-card` tego nie sprawdziły; zapytanie
  `checkUserId { ownedReferralCodes }` do lokalnego CMS dało `null` dla każdego seedowanego użytkownika. Wyszło
  dopiero na zrzucie przebiegu 1; naprawione trasą `share-card-cta` ze stubem `getShareData` (bez zapisu do bazy).
- 2026-11-04, sesja e0cd735e-fa23-4ebd-8d25-7d8684be5ab4 (id claude.ai niedostępny; Baza wiedzy, plan
  `content-deploy-vimeo-upload-plan-1`). Tu brakowało ogniwa z innej części projektu. Krok odbioru (d): „Rafał
  odtwarza jeden film na stagingu web, w aplikacji mobilnej i w podglądzie CMS”. Po wgraniu 15 filmów wyszło, że
  żadna lekcja na stagingu nie ma aktywności wideo (`platformIds` lekcji 2.1: tylko `article`, `quiz`,
  ćwiczenie). Droga „ID w `lekcja.yaml` → aktywność → strona lekcji” to zakres następnej części
  (`content-deploy-video-activity`, #852). Rafał: „publikacja będzie działać dopiero po implementacji zadania
  w którym kurs publikuj tworzy video acticity”. Krok przeniesiony do odbioru #852, a plan 1 zamknięty bez niego.

## Rozwiązanie
Każdy wiersz skryptu bramki zaczyna się od drogi do ekranu: tapnięcia od ekranu startowego albo komenda deep
linka do wklejenia. Drogę wyznacz z kodu, szukając `router.push`, `router.navigate` i `Link` do tej trasy. Trasa
bez żadnego wejścia z aplikacji to ustalenie dla użytkownika przed bramką, z wariantem: dopisać wejście albo
sprawdzić przez deep link. Nie odkrywaj go dopiero w trakcie bramki. To samo dla stanu zależnego od danych
(render warunkowy, np. CTA tylko przy kodzie polecającym): przy pisaniu trasy bramki nazwij dane, które ten stan
wywołują, i jednym zapytaniem do lokalnego API sprawdź, że seed albo stub je dostarcza. Przy kroku odbioru planu
rozpisz drogę od wyniku zadania do miejsca, w którym użytkownik go sprawdza, ogniwo po ogniwie, i przy każdym
ogniwie wpisz, która część projektu je dostarcza. Ogniwo z części jeszcze niezbudowanej to ustalenie przy pisaniu
planu: krok idzie do odbioru tamtej części albo dostaje zastępczą drogę (np. ręczna aktywność w CMS).
