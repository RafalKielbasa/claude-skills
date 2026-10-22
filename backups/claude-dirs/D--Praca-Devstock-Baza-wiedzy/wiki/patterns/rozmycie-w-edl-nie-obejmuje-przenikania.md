# rozmycie-w-edl-nie-obejmuje-przenikania

- **Skill:** kurs-montaz
- **Typ:** porażka
- **Status:** otwarty

## Opis
Rozmycie danych konta (`zaznaczenia` typu `rozmycie`) chroni ekran w obrębie akapitu, ale nie w przenikaniu do
następnego akapitu nagranego w innym miejscu. Przez ok. 0,3 s przenikania widać nierozmyte dane.

## Przyczyna źródłowa
`renderujKlip` (`tools/course-pipeline/src/montaz-render.js`) bierze do przenikania ostatnie 0,5 s poprzedniego
klipu (`-sseof -0.5`), a ten ogon obejmuje zapas stopklatki poza czasem akapitu. Rozmycie włącza się filtrem
`enable=between(t,od,do)`, a `sprawdz` odrzuca `do` dłuższe od akapitu („czas zaznaczenia … poza akapitem”).
Ogonu klipu nie da się więc rozmyć z poziomu EDL.

## Dowody
- 2026-10-22, sesja c6ebb064-81d9-4b6b-9857-7bf69d930b7a (id claude.ai niedostępny): lekcja agenty-ai 1.4 (D68 A,
  rozmycie danych Pinecone i Cohere). Na arkuszu kontrolnym blady prześwit był widoczny tylko w kaflu „4.1 A”. Wycinki
  z klatek filmu co 0,2 s pokazały nierozmyte „Bobi's Org” i „BK” przy 238,7–238,9 s (3:8 → 4:1) i przy 130,0 s
  (3:3 → 3:4). Poprawka: `"przejscie": "ciecie"` na 3:4, 4:1 i 7:1. Ponowny render, a potem kontrola co 0,1 s na
  trzech przejściach: rozmyty Pinecone, cięcie, n8n.

## Rozwiązanie
Do `/kurs-montaz`, przy palecie efektów: „Rozmycie danych w akapicie, po którym następny akapit startuje w innym
miejscu nagrania (inny plik albo `od` ≠ poprzednie `do`), wymaga na tym następnym akapicie `"przejscie": "ciecie"`.
Przenikanie bierze ogon poprzedniego klipu spoza akapitu, a tam rozmycie nie działa. Po renderze sprawdź wycinki
z klatek filmu co 0,1 s na każdym przejściu wychodzącym z rozmytego ekranu, bo kafle arkusza tego nie pokazują”.
Docelowo w renderze: przedłużyć warstwę rozmycia na ogon klipu używany do przenikania.
