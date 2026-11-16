# wynik-komendy-uzytkownika-w-tle-niewidoczny

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Komenda uruchomiona przez użytkownika linią `!` (`eas build`) po 120 s przeszła do tła; jej końcowy wynik dla użytkownika (kod QR i link do instalacji) trafił tylko do pliku wyjścia, a w raporcie podałem link bez kodu QR. Rafał dopytał „Gdzie jest kod qr”.

## Przyczyna źródłowa
Po przeniesieniu do tła harness pokazuje użytkownikowi tylko początek wyjścia, a reszta trafia do powiadomienia dla Claude'a. Powiadomienie wygląda jak informacja dla mnie, więc streszczam je jak wynik własnego narzędzia, zamiast przekazać dalej to, co komenda drukowała dla człowieka.

## Dowody
- 2026-11-04, sesja session_01WryF5UuECUFMWTUWLoBKsJ (lokalnie 78e3ca27-9604-4e3b-ad0b-1d0f66a80e7a): `! eas build --profile development --platform android` przekroczył 120 s („moved to the background”); po zakończeniu raport podał link do builda, a kod QR z wyjścia został w pliku; po pytaniu Rafała wklejony dosłownie z `sed -n 26,46p`.
- 2026-11-16, sesja 2d5dd650-9993-45bf-81bd-666b43be12e5 (id claude.ai niedostępny; Baza wiedzy z katalogu code-busters-mobile, plan 1 `nagrywanie-mixed-segments`, lekcja 4.1, DT-132 #908): wariant z komendą, którą uruchomiłem ja, nie użytkownik. `pulpit-login` puściłem w tle z wyjściem do logu i napisałem Rafałowi tylko „zaloguj się”. Komenda wydrukowała dla człowieka instrukcję „Jeśli logowanie otworzy przeglądarkę: … wybierz Anuluj, skopiuj link "claude://..." …”, ale ta linia została w logu. Rafał kliknął w przeglądarce otwarcie aplikacji, link trafił do jego codziennego Claude Desktop zamiast do kopii kursu, a kopia została wylogowana (`User is logged out` w jej logu). Kosztowało to drugie logowanie i dwie tury. Przy drugim podejściu przekazałem instrukcję przed startem i logowanie przeszło za pierwszym razem.

## Rozwiązanie
Gdy kończy się zadanie w tle uruchomione przez użytkownika (linia `!`), przeczytać koniec wyjścia i przekazać dosłownie wszystko, co komenda drukowała dla człowieka: kody QR, linki, kody jednorazowe, prośby o działanie — w bloku kodu, bez streszczania. To samo dotyczy komendy, którą sam uruchamiam w tle i która czeka na działanie człowieka (logowanie, zamknięcie okna): zaraz po starcie czytam początek jej wyjścia i przekazuję każdą instrukcję dla człowieka, zanim oddam turę.
