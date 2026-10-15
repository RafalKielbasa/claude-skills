# zrzut-elementu-wyzszego-niz-okno-wywoluje-resize

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Zrzut elementu wyższego niż okno Playwrighta zapisał stronę w innym stanie niż ten, który skrypt
ustawił i zweryfikował tuż przed zrzutem. Zły PNG przeszedł przez trzy commity, bo jego suma
kontrolna się nie zmieniała.

## Przyczyna źródłowa
Dwa poziomy. Techniczny: przy `locator.screenshot()` elementu wychodzącego poza okno Chrome
rozszerza obszar przechwytywania i wywołuje `resize`; strona z `addEventListener('resize', render)`
przerysowała się i skasowała ręcznie ustawione `zoom`. Weryfikacyjny: kontrola szła po sumach MD5
(„zmienił się tylko kierunek 7”) i obejrzeniu wybranych zestawień, a niezmieniona suma pliku,
który powinien był się zmienić, nie zwróciła uwagi.

## Dowody
- 2026-10-14, sesja e61003ff (id claude.ai niedostępny; Baza wiedzy, `zestawienie-landing-web.png`):
  od commita `c98eff01` przez `1172d3bd` plik pokazywał trzy ucięte kadry zamiast siedmiu
  pomniejszonych. Wykryte dopiero przy `30e9d544`, gdy diff nie objął pliku mimo zmiany hero.
  Naprawa: okno 2400 px wysokości, odczekanie na fonty, asercja szerokości każdej ramki tuż przed
  zrzutem.

## Rozwiązanie
Zrzut elementu: okno wyższe niż element (albo strona bez nasłuchu `resize` w trybie eksportu)
i asercja stanu tuż przed zrzutem. Przy diffie generowanych grafik sprawdź także pliki, które
powinny się zmienić, a się nie zmieniły; każdy nowy rodzaj grafiki obejrzyj przynajmniej raz
w całości.
