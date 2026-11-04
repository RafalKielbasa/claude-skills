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

## Rozwiązanie
Gdy kończy się zadanie w tle uruchomione przez użytkownika (linia `!`), przeczytać koniec wyjścia i przekazać dosłownie wszystko, co komenda drukowała dla człowieka: kody QR, linki, kody jednorazowe, prośby o działanie — w bloku kodu, bez streszczania.
