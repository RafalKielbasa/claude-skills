# protokol-bluf-opakowuje-tury-nauki

- **Skill:** nauka-z-claude
- **Typ:** porażka
- **Status:** otwarty

## Opis
Tury nauki (porcja materiału, pytanie sprawdzające, pytanie w powtórce) idą w pełnym protokole
odpowiedzi z globalnego `CLAUDE.md`: nagłówek z intencją, 🎯, 📄, ❓ i marker
„⏸ Czeka na decyzję” po pytaniu sprawdzającym. Treść porcji ginie w ramkach, a odpowiedź na quiz
wygląda dla huba jak bramka decyzyjna. Subagenci rozstrzygają to różnie: większość stawia marker,
jeden pominął go („Bez markera ⏸, bo to pytanie sprawdzające, nie decyzja”).

## Przyczyna źródłowa
Globalny protokół obowiązuje „każdą odpowiedź”, a marker ⏸ każdą turę czekającą na użytkownika.
`nauka-z-claude` nie określa kształtu wiadomości z porcją ani z pytaniem sprawdzającym, więc nic
nie zawęża protokołu do tego trybu. Kształt tury zależy przez to od interpretacji modelu.

## Dowody
- 2026-10-23, sesja 826a9cc6-adba-478b-b4db-47f6fa35bb62 (id claude.ai niedostępny): 9 przebiegów
  na sucho w subagentach (RED i GREEN, przebudowa `nauka-z-claude`). Wszystkie tury z porcją albo
  pytaniem szły w formacie BLUF, np. „⏸ Czeka na decyzję: Twoja odpowiedź na pytanie sprawdzające
  o przepisywanie AOF”. Rafał formatu nie komentował. Jego opinia z 22.10 („zbyt duży próg
  wejścia”) dotyczyła metody sokratejskiej, nie formatu, więc związek jest niesprawdzony.

## Rozwiązanie
Hipoteza, do decyzji Rafała, bo dotyczy jego globalnego protokołu. W `nauka-z-claude` określić
kształt tury nauki: czy porcja i pytanie sprawdzające idą w pełnym BLUF, czy w lżejszej formie
(nagłówek kroku, porcja, pytanie), oraz czy pytanie sprawdzające kończy się markerem ⏸.
Jedna reguła zamiast interpretacji per sesja.
