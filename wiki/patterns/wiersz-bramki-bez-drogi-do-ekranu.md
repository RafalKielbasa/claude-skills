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

## Rozwiązanie
Każdy wiersz skryptu bramki zaczyna się od drogi do ekranu: tapnięcia od ekranu startowego albo komenda deep
linka do wklejenia. Drogę wyznacz z kodu, szukając `router.push`, `router.navigate` i `Link` do tej trasy. Trasa
bez żadnego wejścia z aplikacji to ustalenie dla użytkownika przed bramką, z wariantem: dopisać wejście albo
sprawdzić przez deep link. Nie odkrywaj go dopiero w trakcie bramki.
