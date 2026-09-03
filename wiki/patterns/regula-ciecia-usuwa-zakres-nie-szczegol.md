# regula-ciecia-usuwa-zakres-nie-szczegol

- **Skill:** github-tickets
- **Typ:** porażka
- **Status:** zaadresowany (2026-09-03, github-tickets)

## Opis
Przy pierwszym zastosowaniu nowej reguły redakcyjnej, która każe skracać tekst,
znika nie tylko nadmiarowy szczegół, ale też kawałek zakresu i ograniczenia,
których czytelnik nie odzyska z kodu. Skrócony tekst wygląda poprawnie, bo brak
niczego nie zostawia śladu.

## Przyczyna źródłowa
Reguła nazywa, co usunąć, i nazywa wyjątki, ale operator tnie całymi sekcjami,
bo sekcja jest jednostką, którą widać. Nic w przepływie nie wymusza porównania
starego i nowego tekstu blok po bloku ani zadania dla każdego usuniętego bloku
pytania „czy wykonawca dojdzie do tego, czytając repozytorium”. Wyjątki reguły
są więc sprawdzane pamięciowo, a pamięć przy piętnastu dokumentach zawodzi.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: przy przepisywaniu #168 do
  nowej reguły głębokości ticketu zniknął cały punkt o kontekście filtrów
  katalogu (nowy provider, który jeszcze nie istnieje, więc nie do odzyskania
  z kodu), reguła życia klienta zapytań („raz na sesję przeglądarki, nie moduł”)
  oraz, w #179, wymóg, żeby plik błędu był komponentem klienckim. Wszystkie trzy
  wyłapał dopiero `codex exec --sandbox read-only` promptem pytającym wprost
  o informację niemożliwą do odzyskania z kodu. Samoocena wobec własnej listy
  kontrolnej ich nie złapała, bo lista nie miała takiej pozycji.

## Rozwiązanie
Gdy reguła każe usuwać treść, nie tnij sekcjami. Porównaj tekst źródłowy
z wynikiem blok po bloku i dla każdego usuniętego bloku odpowiedz, czy wykonawca
dojdzie do tej informacji, czytając repozytorium. Wymuszona kolejność, reguła
życia obiektu, wymóg frameworka i uzgodniona wartość są nieosiągalne z lektury
kodu, gdy rzecz, której dotyczą, jeszcze nie istnieje. Utrata jednej z nich nie
daje krótszego dokumentu, tylko zepsuty.
