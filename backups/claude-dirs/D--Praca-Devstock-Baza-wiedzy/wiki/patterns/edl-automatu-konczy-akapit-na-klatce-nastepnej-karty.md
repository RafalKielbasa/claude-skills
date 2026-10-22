# edl-automatu-konczy-akapit-na-klatce-nastepnej-karty

- **Skill:** kurs-nagrywanie (krok 6, `edl`), kurs-montaz
- **Typ:** porażka
- **Status:** otwarty

## Opis
EDL z automatu kończy akapit (`do`) dokładnie na znaczniku startu następnego kroku. Gdy ten krok zaczyna się od
`switch_tab`, klatka w sekundzie `do` pokazuje już nową kartę, a montaż trzyma ją do końca narracji akapitu.
Lektor mówi wtedy przez długie sekundy o jednym ekranie, a widz patrzy na inny.

## Przyczyna źródłowa
Granica akapitu w EDL to znacznik kroku z `znaczniki.json`. Automat zapisuje znacznik kroku tuż przed jego pierwszym
działaniem, a `switch_tab` zmienia obraz natychmiast, bez ruchu kursora. Akapit krótszy w nagraniu niż w narracji
kończy się stopklatką z `do`, więc tą stopklatką zostaje pierwsza klatka następnego kroku. Skill każe przy EDL
z automatu „never move od/do”, dlatego bez arkusza kontrolnego nikt tego nie poprawi.

## Dowody
- 2026-10-22, sesja c6ebb064-81d9-4b6b-9857-7bf69d930b7a (id claude.ai niedostępny): lekcja agenty-ai 1.4, akapit
  3:3 („Najpierw klucz. Wchodzę w sekcję z kluczami api…”, 34,7 s narracji), nagranie 16,89–25,138 s. Krok 6 zaczyna
  się od `switch_tab: { tab: lista }`. `klatka --akapit=3:3` dla sekund 10, 15, 20 i 24 zwracała `→ 25.1385 s`,
  a na tej klatce był już przegląd n8n. Klatka 25,10 s to jeszcze lista kluczy Pinecone. Przez ok. 25 s narracji
  o kluczach Pinecone widać było n8n. Poprawka: `do: 25.1`, czyli o klatkę wcześniej.

## Rozwiązanie
W `tools/nagrywanie` (`edl`): kończ akapit klatką przed znacznikiem następnego kroku, czyli `do` = znacznik
następnego kroku minus 1/fps. Do tego czasu w `/kurs-montaz`, krok 1 przy EDL z automatu: „Przed próbką sprawdź Z
każdego akapitu, po którym następny krok zaczyna się od `switch_tab`: jeśli `klatka --akapit=ID` pod koniec akapitu
pokazuje już kartę następnego kroku, cofnij `do` o jedną klatkę. To jedyny wyjątek od zakazu ruszania `od`/`do`”.
