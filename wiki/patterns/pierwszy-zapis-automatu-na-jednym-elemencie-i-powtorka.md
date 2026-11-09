# pierwszy-zapis-automatu-na-jednym-elemencie-i-powtorka

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Pierwsze uruchomienie automatu, który pisze na GitHubie (komentarz śladu na kartach tablicy), szło etapami:
1. Przebieg tylko do odczytu z prawdziwym tokenem, porównany z poprzednim.
2. Zapis na jednej karcie, uruchomiony dwa razy (`created`, potem `unchanged`), z kontrolą HTML.
3. Pełny workflow.
4. Drugi pełny przebieg, w którym wszystko wyszło `unchanged`.

## Przyczyna źródłowa
Błąd automatu zapisującego mnoży się przez liczbę elementów i zostaje w historii pod nazwiskiem właściciela tokenu. Na przykład odwołanie `#n` w komentarzu tworzy trwałe zdarzenie na innym issue. Jeden element uruchomiony dwa razy sprawdza naraz zapis, idempotencję i to, jak serwis przechowuje treść (tu U+2060).

## Dowody
- 2026-11-09, sesja f83b042b-5c80-43ff-8320-902beeeba944 (id claude.ai niedostępny; Baza wiedzy, DT-134 #910):
  - przebieg próbny zgodny z przebiegiem na loginie `gh`, różnił się tylko U+2060;
  - #60: pierwszy przebieg `created`, drugi `unchanged`, w `body_html` brak `issue-link`;
  - przebieg 42669105643: 7 kart `created`, #60 `unchanged`;
  - przebieg 42669589649: 8 kart `unchanged`, na wszystkich `updated_at = created_at`.

## Rozwiązanie
Pierwszy zapis nowego automatu prowadź w czterech krokach:
1. Przebieg bez zapisu z prawdziwym poświadczeniem, porównany z poprzednim.
2. Zapis na jednym elemencie, uruchomiony dwa razy, z kontrolą wyniku tak, jak widzi go użytkownik (HTML, powiadomienia).
3. Pełny przebieg.
4. Drugi pełny przebieg, który nie może niczego zmienić.
