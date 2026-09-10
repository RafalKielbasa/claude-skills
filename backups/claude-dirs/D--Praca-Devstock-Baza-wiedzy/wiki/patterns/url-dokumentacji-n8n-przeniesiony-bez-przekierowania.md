# url-dokumentacji-n8n-przeniesiony-bez-przekierowania

- **Skill:** kurs-lekcja (krok 2, research)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Adresy `docs.n8n.io` zapisane w `zrodla.md` przy wcześniejszych lekcjach zwracają
stronę 404 zamiast treści albo przekierowania. Research lekcji zaczyna się od
serii pustych pobrań, a linki w lekcjach już zatwierdzonych są martwe dla
kursanta, który w nie kliknie.

## Przyczyna źródłowa
n8n przebudował strukturę dokumentacji: sekcja `advanced-ai/` została rozbita na
`build/integrate-ai/` i `connect/`, bez przekierowań ze starych ścieżek. W
`zrodla.md` data dostępu opisuje **treść** („sprawdziłem, że tak jest dziś"),
a nie **adres** — nic w formacie wpisu nie odróżnia „ta informacja się
zdezaktualizowała" od „ten link przestał istnieć". Dodatkowo strona 404 n8n
zwraca sensownie wyglądającą treść z sugestiami, więc narzędzie pobierające
raportuje sukces, a odpowiedź brzmi jak brak informacji na stronie, nie jak
brak strony.

## Dowody
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: research do lekcji 2.1.
  `docs.n8n.io/advanced-ai/examples/understand-tools/` i
  `docs.n8n.io/advanced-ai/examples/using-the-fromai-function/` → 404; ta sama
  treść żyje pod `docs.n8n.io/build/integrate-ai/understand-ai-components/how-tools-work`
  i `docs.n8n.io/build/integrate-ai/ai-examples/use-ai-for-parameters`.
  `docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-base.gmailtool/` → 404
  (węzeł narzędziowy nie ma osobnej strony, opis jest na stronie węzła
  `gmail`). Pierwsze odpowiedzi brzmiały jak „na tej stronie tego nie ma", nie
  jak „tej strony nie ma" — dopiero trzecia próba pokazała, że to 404.
  Adresy z sekcji `advanced-ai/` stoją w `zrodla.md` przy modułach 1-5 z datą
  dostępu 2026-07-14.

## Rozwiązanie
W kroku 2 nie zaczynać od kopiowania adresu z `zrodla.md` — najpierw wyszukać
temat i wziąć adres z wyniku wyszukiwania, a stary link porównać z nowym.
Pobranie, które wraca z odpowiedzią w rodzaju „strona nie zawiera informacji
o X", sprawdzić pod kątem 404, zanim uzna się to za brak treści.

Do `zrodla.md` przy każdej nowej sekcji dopisywać adres w postaci, w której go
faktycznie otwarto w tej sesji, a przy okazji researchu do kolejnej lekcji
z tej samej rodziny narzędzi poprawiać martwe linki znalezione po drodze.
Osobne zadanie do rozważenia: jednorazowy przegląd wszystkich adresów
`docs.n8n.io/advanced-ai/` w `zrodla.md` kursu agenty-ai.
