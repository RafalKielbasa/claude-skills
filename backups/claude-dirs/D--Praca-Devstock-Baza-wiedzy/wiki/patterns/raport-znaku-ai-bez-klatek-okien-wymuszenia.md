# raport-znaku-ai-bez-klatek-okien-wymuszenia

- **Skill:** kurs-video
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sekcja „Do przejrzenia przez człowieka” w `video/znak-ai/raport.md` zgłasza, że znak zasłania znaną treść przez
N sekund, ale do tego ostrzeżenia nie ma żadnej klatki. Skill każe pokazać Rafałowi tę sekcję „z klatkami”, a klatek
z tych momentów raport nie zawiera.

## Przyczyna źródłowa
Raport ma klatki (początek, środek, koniec) tylko dla zdarzeń z tabeli „Zdarzenia”: wejścia, przeprowadzki,
przeskoku, ustąpienia, powrotu i wyjścia. Zasłanianie dzieje się w oknach, w których strażnik zostaje w rogu
(`plan.json`, `decyzje[].wybor.rodzaj: "zostan"`, powód „brak wolnego rogu … wymuszenie (zostaje)”). Te okna nie są
zdarzeniami, więc nie dostają klatek.

## Dowody
- 2026-10-21, sesja 541cf3f0-bb8c-449a-92fd-d69e74d140fc (id claude.ai niedostępny): lekcja agenty-ai 1.3. Raport
  zgłosił „znak zasłania znaną treść łącznie 32.3 s” przy 51 klatkach zdarzeń. Claude wyciągnął z `plan.json` cztery
  okna `zostan` (środek 362,5–366,5, 575,1–592,1, 722,3–728,3, 780,1–783,1 s), dodał 8,36 s intro i wyciął klatki
  z `final.mp4`. Wynik: stopka plansz „AGENCI AI // 01/02”, przycisk Publish i logo n8n, a nie treść narracji.
  Rafał zaakceptował film na podstawie tej tabeli.
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny): lekcja agenty-ai 3.1, lekcja
  z biletem. `znak-ai -- kontrola` zgłosił „znak zasłania znaną treść łącznie 27.2 s, gdy nie było wolnego rogu (do
  przejrzenia)” i „1016.5 s: budżet niewidoczności - wymuszony powrót”. Tym razem klatek z okien `zostan` nie
  wycinałem: ostrzeżenie trafiło do bramki G5 tylko jako liczba, a Rafał zaakceptował film („ok”), nie widząc, co
  znak zasłania.

## Rozwiązanie
Przy ostrzeżeniu „znak zasłania znaną treść” wyciągnij z `video/znak-ai/plan.json` okna decyzji `zostan`. Wytnij
z `final.mp4` po klatce ze środka każdego okna (czas środka plus przesunięcie intro z raportu) i pokaż Rafałowi tabelę
„czas w filmie | róg | co zasłania”. Docelowo generator raportu dokłada te klatki do sekcji „Do przejrzenia przez
człowieka”.
