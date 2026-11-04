# test-e2e-zapisuje-do-prawdziwego-zasobu

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Przebieg e2e uruchomiony jako krok weryfikacji wgrał plik do prawdziwego, współdzielonego bucketu S3. Sprzątanie
testu usunęło tylko wiersze w bazie. Wariant decyzji mówił „uruchomić ponownie 13 e2e”, bez słowa o zapisie na
zewnątrz, więc skutek wyszedł dopiero po przebiegu.

## Przyczyna źródłowa
Cel zapisu nie wynika z pliku testu, tylko z konfiguracji serwera, przeciwko któremu test działa. Lokalny CMS
czyta `.env` i trzyma pliki przez `managedS3Files` na prawdziwym buckecie. W kodzie testu widać tylko upload
pliku, a cleanup Prismą wygląda na kompletny. Test uchodzi za odczyt, więc reguła „zmiany wychodzące na
zewnątrz potwierdź przed wykonaniem” się nie uruchamia, a zgoda na wariant nie obejmuje skutku, którego wariant
nie nazwał.

## Dowody
- 2026-11-03, sesja 9b10f517-b92d-49ad-8df9-1d567ac06e20 (id claude.ai niedostępny; code-busters-v2,
  DT-52 #741):
  - wariant „Poprawki e2e (D4)” obejmował dwie poprawki testów, uprawnienia lokalnej roli i ponowny przebieg
    13 e2e; Rafał przyjął go słowem „ok”;
  - test PDF z `e2e/terms` przeszedł i wgrał `e2e-<czas>.pdf` do `ds-cbv2/development/`;
  - wyszło to dopiero przy sprawdzaniu, dlaczego test przeszedł („CMS trzyma pliki w S3 (`managedS3Files`),
    więc upload trafił do prawdziwego bucketu”);
  - zgłosiłem to w raporcie, obiekt nadal leży w buckecie, a usunę go tylko na słowo Rafała.

## Rozwiązanie
Zanim zaproponujesz przebieg e2e albo testu integracyjnego na lokalnym stosie:
- przejrzyj testy pod kątem zapisów poza bazą (`setInputFiles`, upload, mail, webhook, płatność);
- sprawdź w konfiguracji serwera (`storage`, `.env`), dokąd te zapisy trafiają.

Gdy cel jest prawdziwy i współdzielony, napisz to w wariancie razem z tym, czego cleanup nie sprząta. Druga
możliwość to wariant bez tego testu.
