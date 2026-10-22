# diagnoza-api-bez-sprawdzenia-wartosci-ktora-dostal-proces

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Błąd zdalnego API (404 zasobu, 401 uprawnień) diagnozuję po stronie zdalnego konta i każę użytkownikowi sprawdzać
panel. Nie sprawdzam, jaką wartość konfiguracji (klucz, ID, adres) proces faktycznie dostał. Dokładam też sondy
na zasobach, których oczekiwanego stanu nie znam, i wyciągam z nich wnioski.

## Przyczyna źródłowa
Źródło konfiguracji przyjmuję z wywołania (`--env-file=.env`, „klucz z `.env`”), zamiast je zweryfikować. Kolejność
pierwszeństwa (zmienna systemowa przed plikiem) jest niewidoczna w komendzie. Sonda porównawcza na zasobie
o nieznanym stanie (np. celowo usuniętym) daje fałszywy wniosek, który brzmi jak dowód.

## Dowody
- 2026-10-22, sesja c6ebb064-81d9-4b6b-9857-7bf69d930b7a (id claude.ai niedostępny), repo Baza wiedzy:
  `voice_not_found` ElevenLabs. Dwie bramki z prośbą o sprawdzenie panelu (D62, D63). Sonda starego głosu dała
  wniosek „zniknęły oba głosy, więc wina konta”, a Rafał odpowiedział: „Został jedynie głos V4, po co Ci oba głosy?”.
  Przyczynę (prywatny klucz ze zmiennej systemowej) wskazał Rafał w trzecim podejściu. Sprawdzenie zajęło jedną
  komendę porównującą wartości bez ich wypisywania.

## Rozwiązanie
„Zanim przypiszesz 401/404 zdalnemu kontu albo poprosisz użytkownika o panel, sprawdź, co proces dostał: porównaj
wartość w środowisku z plikiem konfiguracji (równa / różna / brak), bez wypisywania wartości. Sondy porównawczej nie
rób na zasobie, którego oczekiwanego stanu nie znasz, a jej wynik nazywaj hipotezą”. Powiązane:
[[sprawdzenie-sekretu-przez-rozwiniecie-zmiennej]].
