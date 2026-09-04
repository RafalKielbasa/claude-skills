# ustalenie-w-review-potwierdzone-sonda

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Ustalenie blokujące w review PR-a opiera się na żywej sondzie zasobu, nie na
cytacie z dokumentacji projektu. Autor PR-a dostaje fakt z datą i wynikiem,
a nie interpretację zdania z `README.md`.

## Przyczyna źródłowa
Dokumentacja opisuje intencję z dnia, w którym ją pisano; konfiguracja zasobu
mówi, jak jest teraz. Review oparte na cytacie da się podważyć zdaniem „to się
zmieniło" i dyskusja nie ma rozstrzygnięcia. Sonda przenosi ciężar dowodu
z opinii recenzenta na obserwowalny stan, a przy zasobach zewnętrznych bywa
jednocześnie najtańszym możliwym sprawdzeniem.

## Dowody
- 2026-09-04, sesja session_013eH7DXzW8DZjC16fy2ZCs4: PR #165 zwracał kursantowi
  `certificateUrl` sklejony przez `StorageService.getPublicUrl`. Zamiast poprzestać
  na zdaniu z `apps/api/README.md:119` („certificates belong under a non-public
  prefix"), dwa anonimowe `GET`-y na bucket `edu-saas-dev` dały
  `certificates/_probe.pdf → 403` wobec `thumbnails/_probe.jpg → 404`. 404 znaczy
  „prefiks czytelny, obiektu brak", 403 „dostęp odmówiony", więc różnica
  rozstrzyga sprawę bez odwoływania się do czyjejkolwiek pamięci. Obie sondy są
  odczytem i nie ruszają stanu projektu, więc mieszczą się w regule „w GCP nic
  nie mutuję".

## Rozwiązanie
Ustalenie o zasobie zewnętrznym (bucket, kolejka, endpoint, uprawnienie) przed
wpisaniem do review potwierdź najtańszą możliwą sondą i wklej jej wynik do
komentarza. Sonda musi być odczytem — jeśli sprawdzenie wymagałoby mutacji,
podaj komendę użytkownikowi zamiast ją uruchamiać. Cytat z dokumentacji zostaje
w komentarzu jako wskazanie intencji projektu, obok wyniku, nie zamiast niego.
