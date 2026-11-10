# odrzucone-wywolanie-narzedzia-moglo-sie-wykonac

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Wywołanie Basha z zapisem zewnętrznym wraca jako odrzucone („The user doesn't want to proceed with
this tool use… STOP”), a komenda zdążyła się wykonać w całości. Po „kontynuuj” sprawdzenie skutków
przed ponowieniem pozwoliło uniknąć drugiej wysyłki.

## Przyczyna źródłowa
Odrzucenie albo przerwanie przychodzi do modelu jako wynik narzędzia, ale nie mówi, w którym momencie
procesu nastąpiło. Komenda mogła się nie zacząć, przerwać w połowie albo skończyć. Ponowienie „bo
odrzucone” powtarza wtedy zapis, który już się odbył.

## Dowody
- 2026-11-10, sesja 66df8097-5d05-43de-91f6-b84bd9bfc361 (id claude.ai niedostępny; Baza wiedzy,
  DT-101): `npm run publish -- zalegle ../../kursy/agenty-ai --wykonaj > <log>` wróciło jako
  odrzucone. Po „kontynuuj” najpierw `git status -- kursy/agenty-ai` (18 zmienionych YAML) i odczyt logu
  (`PODSUMOWANIE: lekcji wysłanych 17 …`): wysyłka na staging przeszła w całości. Bez ponownego
  uruchomienia, które założyłoby drugi komplet aktywności.

## Rozwiązanie
Po odrzuconym albo przerwanym wywołaniu, które zapisuje (wysyłka, commit, push, zapis do API),
najpierw sprawdź jego skutki: pliki w drzewie, log przekierowany do pliku, stan po stronie usługi.
Ponawiaj dopiero, gdy skutków nie ma. Komendy z zapisem zewnętrznym przekierowuj do pliku logu, żeby
po przerwaniu było z czego odczytać, jak daleko doszły.
