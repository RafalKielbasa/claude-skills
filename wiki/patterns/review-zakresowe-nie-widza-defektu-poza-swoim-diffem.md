# review-zakresowe-nie-widza-defektu-poza-swoim-diffem

- **Skill:** superpowers:subagent-driven-development
- **Typ:** sukces
- **Status:** otwarty

## Opis

Sukces: review całej gałęzi na końcu planu znajduje defekt, którego żadne
z kilkunastu review zadaniowych znaleźć nie mogło — nie z niedbalstwa, tylko
strukturalnie. Krok review końcowego wygląda na formalność po serii czystych
review zadaniowych i jest pierwszym kandydatem do skrócenia, gdy sesja się
dłuży. Ten wzorzec istnieje po to, żeby przyszła zmiana skilla go nie osłabiła.

## Przyczyna źródłowa

Review zadaniowe jest z założenia bramkowane diffem swojego zadania — szablon
mówi wprost „nie przeszukuj szerszej bazy kodu" i to jest właściwe, bo trzyma
koszt i skupienie. Konsekwencja jest jednak twarda: defekt w kodzie, którego
zadanie nie zmieniło, jest dla niego **niewidoczny z definicji**, nawet jeśli
leży w funkcji, którą to zadanie wywołuje. Dopiero przegląd całości ma zakres,
w którym taki defekt w ogóle może się pojawić.

## Dowody

- 2026-09-06/07, sesja session_01CqWuPYXRh5VSuurqzqb5y3: Plan A silnika
  `idea-engine`, 18 zadań, każde z osobnym recenzentem, 11 rund napraw, wszystkie
  review zamknięte na czysto, 120/120 testów. Review całej gałęzi (Opus)
  przeczytało spec od początku do końca, czytało źródła zamiast patcha i puściło
  własny fuzzer: każde pole każdego fixture'u zatruwane jedenastoma złymi
  wartościami plus skasowaniem, przez wszystkie dwanaście walidatorów, około
  5000 wywołań. Znalazło **dokładnie jedno** wymknięcie — i był to Critical:
  `validateScorecard` rzucał surowym `TypeError` przy `"demand": null`,
  wyrzucając 24 poprawne obiekty błędu policzone pętlę wyżej. Defekt był
  osiągalny z komendy `ide check`, którą dotykało wiele zadań, ale leżał
  w linii, której żadne z nich nie zmieniło. Naprawiony jednym znakiem (`?.`).
  Ta sama sesja: review końcowe wykonało też triaż 33 zaparkowanych uwag Minor
  (4 must-fix, 12 na później, 15 do zignorowania, w tym 2 już nieaktualne) —
  czego również nie mogło zrobić żadne review zadaniowe, bo każde widziało
  tylko swoją.
- 2026-09-07, sesja session_01JAgUNken6DG6aFPjDmKkAX: drugi dowod. Jedenascie review zadaniowych Plan B zamknelo sie czysto; review calej galezi (opus, piec przebiegow) znalazlo, ze `lib/refs.mjs` dopasowuje wzorzec werdyktu do calej sekcji `## Rekomendacja`, wiec polski zaimek „go” w zdaniu „nie warto **go** realizowac” wstawia drugi werdykt do zbioru i kazde memo `no-go` oraz `pivot` leci jako R07 — a memo `go` jest odporne, bo oba trafienia zwijaja sie do jednego elementu. Kod byl brief-verbatim i zgadzal sie ze swoim briefem co do znaku, wiec review Taska 10 nie mialo czego zglosic; luka byla w tescie, ktory nigdy nie przepuscil memo innego niz `go`.
- 2026-09-08/09, sesja session_01VwQutH9xHrU3vwiwnhbL8y: trzeci dowod, trzecia sesja, tym
  razem defekt **utraty danych uzytkownika**. Osiem review zadaniowych planu trybu `vision`
  zamknelo sie czysto (241/241). Review calej galezi odtworzylo na dzialajacym CLI, ze
  `vision finish` dla runu seedera nie ma bramki „juz zasiane": po zasianiu wizji, godzinie
  recznej pracy Rafala nad tezami i statusami, ponowne uruchomienie tego samego kroku konczy
  sie kodem 0, nadpisuje `vision.md` starym wynikiem agenta, cofa wszystkie statusy na
  `pomysl` i dopisuje druga linie `seeded` do dziennika zmian. Zadne review zadaniowe nie
  moglo tego zobaczyc, bo defekt jest **interakcja miedzy commitami**: funkcje bez bramki
  napisal Task 5, a to, co czyni jej brak grozny — instrukcja mowiaca Rafalowi, zeby recznie
  edytowal `vision.md` — powstalo dopiero w Task 8. Blizniacza funkcja `finishBlocks` z Taska 6
  taka bramke ma; to dokladnie ten ksztalt „guard zalozony w jednym miejscu i zapomniany
  w blizniaczym", o ktory dispatch review koncowego prosi wprost.

## Rozwiązanie

Review całej gałęzi utrzymać jako osobny, obowiązkowy krok na najmocniejszym
dostępnym modelu, także wtedy — a zwłaszcza wtedy — gdy wszystkie review
zadaniowe zamknęły się czysto. Seria czystych review zakresowych nie jest
dowodem, że gałąź jest czysta, tylko że każdy diff zgadzał się ze swoim
briefem. W dispatchu review końcowego prosić wprost o to, czego zakresowe nie
mogły zobaczyć: niespójności między modułami, tę samą robotę zrobioną dwoma
sposobami, guard założony w jednym walidatorze i zapomniany w bliźniaczym, oraz
triaż wszystkich uwag odroczonych po drodze.
