# poprawka-punktowa-zamiast-przemiecenia-klasy

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis

Review zadania zgłasza jeden konkretny przypadek defektu. Kontroler rozstrzyga
uwagę i zamawia poprawkę dokładnie tego przypadku, bo tyle nazywa znalezisko.
Ten sam defekt siedzi jednak w kilku innych miejscach bazy kodu, często
napisanych tą samą ręką w tej samej turze, i wraca zadanie albo pięć zadań
później — czasem dopiero w review całości, gdzie jest już Criticalem.

## Przyczyna źródłowa

Uwaga z review jest z natury zakresowa: opisuje linię, którą recenzent widział
w swoim diffie. Kontroler pracuje na uwagach, więc dziedziczy ich zakres. Nic
w pętli nie pyta „czy to jest klasa, a nie przypadek" — ani szablon recenzenta,
ani szablon poprawki, ani sam moment rozstrzygania. Przemiecenie klasy wymaga
świadomej decyzji, a domyślnym zachowaniem jest naprawienie tego, co nazwane.

## Dowody

- 2026-09-06/07, sesja session_01CqWuPYXRh5VSuurqzqb5y3: przy budowie Planu A
  silnika `idea-engine` (18 zadań) zatwierdziłem guard `doc?.claims ?? []`
  **dwa razy** — w Tasku 12 dla `indexClaims` i w Tasku 16 dla
  `openHypotheses` — w obu przypadkach kopiując idiom z planu bez sprawdzenia,
  co robi przy wartości nie-`null`, która nie jest tablicą. `??` przepuszcza
  liczbę, obiekt i wartość logiczną prosto do `for...of`, który rzuca
  `TypeError` **zanim** guard per-element zdąży się wykonać. Review Taska 16
  odtworzyło trzy takie kształty i nazwało to wprost: komentarz, który
  podyktowałem („zepsuty plik claimów nie może położyć całej tabeli"), był
  dosłownie fałszywy dla tych wartości. Dopiero wtedy zamówiłem audyt klasy —
  11 miejsc w `lib/`, 2 naprawione, 9 zostawionych z uzasadnieniem. Mimo to
  review całości znalazło **trzeci** wariant tej samej klasy w
  `validateScorecard`: `doc.dimensions[k] !== undefined` zabezpiecza
  `undefined`, ale nie `null`, więc scorecard z `"demand": null` rzucał surowy
  `TypeError`, wyrzucając 24 poprawne obiekty błędu policzone linijkę wyżej.
  Recenzent podsumował to jako „słuszna decyzja, niedokończone przemiecenie".

## Rozwiązanie

Rozstrzygając uwagę z review, zanim zamówisz poprawkę, zadaj jedno pytanie:
czy to jest przypadek, czy klasa. Klasę rozpoznajesz po tym, że defekt da się
opisać jako reguła („`??` tam, gdzie potrzeba `Array.isArray`", „dereferencja
bez guardu w walidatorze"). Gdy to klasa, zamów w tej samej rundzie **audyt
wszystkich miejsc pasujących do reguły** — grep po wzorcu, tabela „miejsce,
co robi dziś przy złym wejściu, decyzja" — i wymagaj uzasadnienia dla każdego
miejsca zostawionego bez zmiany. Naprawa punktowa po raz drugi w tej samej
klasie jest sygnałem, że pierwsza powinna była być przemieceniem.
