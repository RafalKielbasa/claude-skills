# dispatch-oddziela-wykrycie-od-naprawy

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis

Sukces: dwie instrukcje dopisane do dispatchu implementera zmieniają jakość
tego, co wraca. Pierwsza każe **atakować własną pracę** przed raportem, nie
tylko ją przeczytać. Druga, gdy kontroler podejrzewa konkretną wadę, każe
**zbadać i zaraportować bez naprawiania**. Obie wydobywają rzeczy, których
domyślny self-review nie pokazuje.

## Przyczyna źródłowa

Szablon implementera prosi o self-review „świeżym okiem" z listą pytań
o kompletność, jakość i pokrycie testami. Wszystkie te pytania da się uczciwie
odpowiedzieć twierdząco, przeszedłszy wyłącznie ścieżkę główną — bo dotyczą
tego, co implementer zbudował, a nie tego, czego nie sprawdził. Szablon nie
mówi też, kto jest właścicielem decyzji o **kształcie** naprawy, więc
implementer, który znajdzie wadę, naprawia ją po swojemu, a kontroler
dziedziczy cudzy wybór projektowy zamiast go podjąć.

## Dowody

- 2026-09-06/07, sesja session_01CqWuPYXRh5VSuurqzqb5y3: w Tasku 12 planu
  `idea-engine` raport implementera głosił „Concerns: none", podczas gdy review
  odtworzyło **trzy** awarie ładowarki katalogu pomysłu (katalog podstawiony
  pod plik claimów, katalog pod `changelog.jsonl`, wpis `null` w tablicy
  claimów). Self-review chodziło wyłącznie po ścieżce głównej. Od Taska 13
  dopisałem do każdego dispatchu polecenie „spróbuj zepsuć to, co zbudowałeś,
  zanim zaraportujesz — opisz, co próbowałeś i co się stało", z wyliczeniem
  kandydatów. Efekt: Task 13 zgłosił, że `?? 'none'` w dzienniku zmian skleja
  „nie było modelu" z „model pokazywał stratę"; Task 14 znalazł
  `readJson` bez argumentu `displayFile`, wypuszczający ścieżkę bezwzględną do
  obiektu błędu; Task 16 potwierdził wykonaniem awarię `ide status` na
  `claims:[null]`. Żadnej z tych trzech nie wskazałem z góry.
- Ta sama sesja, druga instrukcja: w Tasku 16 nazwałem ryzyko i poprosiłem
  **wyłącznie o obserwację** — „zbuduj ten przypadek, uruchom, podaj kod wyjścia
  i to, co widzi użytkownik, jawnie bez naprawiania z własnej inicjatywy".
  Implementer zwrócił dokładny objaw i nie ruszył kodu, dzięki czemu wybór
  między utwardzeniem helpera a każeniem komendzie `status` uruchamiać pełną
  walidację pozostał moją decyzją — a była to decyzja projektowa, nie
  mechaniczna, bo drugi wariant zmieniał zadanie komendy zdefiniowane w specu.

## Rozwiązanie

W dispatchu implementera dopisywać dwie rzeczy. Po pierwsze, obok self-review
polecenie ataku: „spróbuj zepsuć to, co zbudowałeś, zanim zaraportujesz",
z wyliczeniem 3–5 konkretnych kandydatów na złe wejście dla tego zadania, oraz
wymóg opisania w raporcie, co próbowałeś i co się stało — bo lista prób jest
sprawdzalna, a zdanie „brak uwag" nie. Po drugie, gdy kontroler podejrzewa
konkretną wadę, prosić o **obserwację, nie naprawę**: „zbuduj ten przypadek,
uruchom, zaraportuj kod wyjścia i komunikat, jawnie bez naprawiania". Kształt
naprawy rozstrzyga wtedy ten, kto widzi cały plan i spec, a nie ten, kto trafił
na objaw.
