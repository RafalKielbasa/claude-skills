# rownolegli-badacze-wyczerpuja-wspolny-limit-wyszukiwan

- **Skill:** anthropic-skills:deep-research
- **Typ:** porażka
- **Status:** otwarty

## Opis
Koordynator uruchamia w jednej turze kilkunastu badaczy; w połowie ich pracy
kończy się wspólny limit wyszukiwań i każdy badacz oddaje notatkę z lukami,
a część liczb opiera tylko na streszczeniach wyszukiwarki.

## Przyczyna źródłowa
Limit WebSearch jest liczony na turę i dzielony przez wszystkich subagentów tej
tury („limit: 200 WebSearch calls per turn”). Tabela dekompozycji skilla
dopuszcza „6+” badaczy bez budżetu na badacza, a instrukcja badacza zachęca
do kilkunastu–kilkudziesięciu wyszukiwań. Przy 11 badaczach średnio wychodzi
ok. 18 wyszukiwań na głowę, ale pierwsi zużywają więcej, a ostatni dostają kilka.

## Dowody
- 2026-10-09, sesja 75fd3461 (id claude.ai niedostępny): 11 badaczy (walidacja
  „Kodożercy dla dzieci i rodziców”, 11 obszarów). Wszyscy zgłosili wyczerpanie
  limitu; badacz „klient i płatnik” zdążył zrobić 9 wyszukiwań, „pierwsza
  jednostka” ok. 20. Każda notatka ma sekcje „Gaps” z niesprawdzonymi wątkami
  (m.in. stawki reklam do rodziców, ceny licencji szkolnych, KRS Logiscool,
  tekst EU KIDS Act). Druga runda researchu była niemożliwa w tej samej turze.

## Rozwiązanie
Przy więcej niż 8 badaczach podaj w prompcie każdego budżet: „masz najwyżej
⌊180 / N⌋ wywołań WebSearch; po ich wyczerpaniu czytaj tylko znane URL-e przez
WebFetch”. Gdy obszarów jest więcej niż budżet unosi, podziel ich badanie na
dwie fale w osobnych turach albo połącz pokrewne obszary w jednego badacza.
