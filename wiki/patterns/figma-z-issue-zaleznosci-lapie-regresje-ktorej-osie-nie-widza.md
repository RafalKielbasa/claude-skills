# figma-z-issue-zaleznosci-lapie-regresje-ktorej-osie-nie-widza

- **Skill:** code-review-master
- **Typ:** sukces
- **Status:** otwarty

## Opis
Issue PR-a nie ma linków do Figmy, ale wskazuje zadanie, z którego bierze widoki („gotowe wyglądy
z CP-40”). Węzły z tabeli widoków issue zależności, porównane przez sesję w Kroku 4b, ujawniły
regresję wizualną, której nie zgłosiła żadna z 10 części osi ani codex.

## Przyczyna źródłowa
Warunek Kroku 4b („`figma.com` link, or by name when the repository's own documents say where its
designs live”) łatwo zawęzić do linku w samym issue. Zadania wiązane („Wire …”) dziedziczą widoki
po zadaniu ekranu, a tabela węzłów żyje tylko tam. Agenci osi nie mają narzędzi Figmy i z diffu
nie widzą, że zagnieżdżony `Card` zmienia render.

## Dowody
- 2026-11-18, sesja df9b60eb-ffa1-4f95-9570-f528900ec065 (id claude.ai niedostępny; saas app,
  PR #215 / issue #177, run `20261118-171748-sq9t`): #177 bez Figmy, sekcja „Zależności: CP-40”.
  `gh issue view 137` dał stronę `307-7` z węzłami `307-32` (lista) i `309-16` (pusty);
  `get_metadata` pokazał `309:34` jako jedną kartę 720x214 ze stanem pustym w środku, a kod
  `b573633` renderuje `Card` w `Card` (`leaderboard-message.tsx:14` w `leaderboard.tsx:84-86`).
  Uwaga poszła jako jedyny Blocking review 5961975838 (Rafał: „ok”, „wysyłaj”).

## Rozwiązanie
W Kroku 4b: gdy issue nie ma linków do Figmy, a nazywa widoki albo zależności („Zależności:
CP-40”, „gotowe wyglądy z …”), przeczytaj issue zależności (`gh issue view <m>`) i użyj ich
tabeli węzłów. Stany bez węzła (ładowanie, błąd, nowe stany PR-a) wypisz w podsumowaniu jako
nieporównane.
