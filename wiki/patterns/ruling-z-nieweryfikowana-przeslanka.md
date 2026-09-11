# ruling-z-nieweryfikowana-przeslanka

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis
Kontroler rozstrzyga uwagę z review i zapisuje ruling wraz z uzasadnieniem
i kosztem pomyłki. Uzasadnienie zawiera twierdzenie faktyczne o kodzie („testy
zadania X od tego zależą", „poprawka wymagałaby zmiany sygnatury"), którego nikt
nie sprawdza — bo pętla weryfikuje kod, nie przesłanki decyzji o kodzie.

## Przyczyna źródłowa
Skill wymaga od rulingu trzech rzeczy: co zdecydowano, dlaczego i ile kosztuje
pomyłka. Nie wymaga czwartej — **czym potwierdzono „dlaczego"**. Ruling powstaje
pod presją znaleziska z review, w kształcie narzuconym przez jego framing, i brzmi
tym pewniej, im zwięźlej jest napisany. Fałszywa przesłanka nie zapala żadnego
testu, bo jest zdaniem o kodzie, nie kodem — a raz zapisana w ledgerze zostaje
zacytowana w kolejnych dispatchach jako ustalenie.

## Dowody
- 2026-09-07, sesja session_01JAgUNken6DG6aFPjDmKkAX: dwa rulingi Plan B oparte na
  fałszywej przesłance, oba wykryte dopiero przez finalne review całości, oba sondą
  a nie lekturą. (a) Zaakceptowałem odchylenie `openHypotheses` od specu 7.8
  uzasadnieniem „liczby z Taska 8 zależą od obecnego zachowania"; reviewer zastosował
  dosłowne czytanie specu w kopii roboczej i przepuścił suite — 203 pass, 0 fail,
  nic od tego nie zależało. Akceptacja się obroniła, ale na zupełnie innych
  podstawach (R08 czyni odchylenie nieosiągalnym, a węższe zachowanie jest poprawne
  dla drugiego konsumenta funkcji). (b) Zaparkowałem reużycie skasowanego id
  uzasadnieniem „poprawka wymaga historii, której `mergeDimension` nie dostaje,
  i zmiany sygnatury, na której zabriefowane są trzy zadania"; reviewer znalazł,
  że `bundle.changelog` już niesie potrzebny high-water mark, więc poprawka to jeden
  klucz w obiekcie opcji z wartością domyślną, bez zmiany sygnatury.
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: ruling "zbiory plików tego planu i równoległej sesji są parami rozłączne" uzasadniał decyzję o kontynuowaniu pracy w dzielonym drzewie i był fałszywy — `tools/course-pipeline/README.md` dotykały obie prace. Wyszło dopiero w review całości. Nic nie zginęło, ale przesłankę dało się sprawdzić jednym `git status` zestawionym z listą plików planu, w momencie jej zapisywania.

## Rozwiązanie
Gdy uzasadnienie rulingu zawiera twierdzenie faktyczne o kodzie — „X zależy od Y",
„poprawka wymagałaby Z", „nic tego nie wywołuje" — potwierdź je najtańszą sondą
przed zapisaniem: uruchom suite z odwróconym założeniem, wygrepuj call sites,
przeczytaj funkcję. Gdy sonda jest za droga na tym etapie, zapisz przesłankę jawnie
jako niesprawdzoną (`Przesłanka niezweryfikowana: …`) i wymień ją w dispatchu do
finalnego review jako rzecz do potwierdzenia. Zaparkowanie znaleziska uzasadnione
kosztem naprawy wymaga sondy zawsze — to jedyny ruling, w którym pomyłka w ocenie
kosztu jest jednocześnie pomyłką w decyzji.
