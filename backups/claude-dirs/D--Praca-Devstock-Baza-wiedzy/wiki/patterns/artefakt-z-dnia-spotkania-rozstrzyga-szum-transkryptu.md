# artefakt-z-dnia-spotkania-rozstrzyga-szum-transkryptu

- **Skill:** spotkanie
- **Typ:** sukces
- **Status:** otwarty

## Opis
Transkrypt nagrania z sali jest mocno zniekształcony (rozpoznawanie mowy i diaryzacja). Decyzje
z brainstormingu były jednak zapisywane na bieżąco w osobnym artefakcie: w karcie z bazy wiedzy,
którą Rafał prowadził z Claude podczas spotkania. Zestawienie transkryptu z tym artefaktem przed
oznaczaniem ⚠ pozwoliło zapisać kilka fragmentów jako ustalenia z pewnym źródłem zamiast cytatów
z flagą.

## Przyczyna źródłowa
Gdy Rafał prowadzi brainstorming z Claude na żywo, odpowiedzi zespołu trafiają do pliku w repo
w tej samej godzinie, w której padają. Transkrypt ma to samo zdanie w postaci „Nie no, może
starfacze czy kogoś, ale nie pisać”, a karta ma je jako „bez subskrypcji społeczność jest tylko do
czytania”. Krok 4 każe przy niejednoznaczności cytować i flagować, ale nie każe szukać drugiego
źródła z tego dnia.

## Dowody
- 2026-10-14, sesja 9c60c6ac-d756-43f9-af2c-be591fa8c566 (id claude.ai niedostępny): karta
  `knowledge-base/company/kierunki/wizja-kodozercy-2027.md` (commity `f5fa2ec4`, `60b8cd27` z 13.10)
  rozstrzygnęła kilka miejsc transkryptu 14:53: „DevCoinów nie da się wypłacić, można je tylko
  wymieniać”, „społeczność bez subskrypcji tylko do czytania”, kolejność A → C → B → D i wybór
  mieszanki tempa treści. Z sześciu fragmentów ⚠ jeden został jako niepewny, dwa Rafał doprecyzował,
  trzy usunął.

## Rozwiązanie
W kroku 4, zanim oznaczysz fragment ⚠, sprawdź `git log --since=<data spotkania>` i pliki
`knowledge-base/` oraz `planning/` zmienione w dniu spotkania. Artefakt, który zapisuje tę samą
rozmowę, cytuj w notatce jako źródło ustalenia, z zaznaczeniem, czy to decyzja zespołu, czy szkic
jednej osoby.
