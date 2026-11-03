# commit-bez-pathspec-wciaga-cudzy-indeks

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
W checkoucie dzielonym z innymi sesjami `git add <moje pliki>` i potem `git commit -m …` zabiera do
commita także to, co inna sesja zastagowała wcześniej. Cudze usunięcia i dopiski lądują pod moim tematem.
Stagowanie po nazwie, czyli poprawka z [[subagent-staguje-wildcardem-w-dzielonym-drzewie]], przed tym nie
chroni.

## Przyczyna źródłowa
Sesje w jednym checkoucie dzielą nie tylko drzewo robocze, ale i plik `.git/index`. `git commit` bez
ścieżek zapisuje cały indeks, a nie to, co dodała ta sesja. Cudze wpisy stoją w „Changes to be committed”
razem z moimi, a reguła „staguj po nazwie” kontroluje tylko to, co sesja dokłada do indeksu, nie to, co
już w nim jest.

## Dowody
- 2026-10-20, sesja 240fd64b-d029-4c19-997c-a49301c018df (id claude.ai niedostępny; lekcja agenty-ai
  2.2, #721): commit `d045f8df` (plansze 2.2) objął też usunięcie
  `lekcja-01-tools-agent-wtyczki/video/dane-do-nagrania.md` i +11 linii w
  `kursy/agenty-ai/_nagrywanie/uslugi/n8n.js`, zastagowane przez sesję lekcji 2.1. Skutek uboczny:
  odsyłacze konspektu 2.2 do usuniętego pliku 2.1 trzeba było przepiąć (`7cdabd08`). Rafał zdecydował,
  że historia zostaje, bez `reset` i `rebase`. Kolejne siedem commitów sesji (`a869371d` … `f170527e`)
  poszło przez `git commit -m … -- <ścieżki>` po `git diff --cached --stat` i żaden nie wziął cudzego
  pliku. Druga strona tego samego incydentu (pamięć `wspolny-indeks-git-sesje`): blok w `n8n.js` trafił do
  indeksu, bo sesja 541cf3f0 zrobiła `git update-index` z wersją „HEAD + mój blok” w prawdziwym indeksie.
- 2026-10-22, ta sama sesja, krok wiki skilla `podsumuj-sesja-claude`: `index.md` i `log.md` wiki repo
  miały też niezacommitowane wpisy równoległej sesji (lekcja 2.1), więc `git commit -- <ścieżki>` wziąłby
  je z drzewa roboczego. Commit `055ff56f` poszedł przez `GIT_INDEX_FILE` (wersje „HEAD + moja linia” i
  „HEAD + mój wpis”), a potem `git restore --staged` dla tych ścieżek w prawdziwym indeksie. W drzewie
  zostały wyłącznie cudze zmiany.
- 2026-11-02, sesja 5a729830-7014-4847-af44-dd79cd5db98c (id claude.ai niedostępny; Baza wiedzy, opcja
  `tidy_up` automatu n8n, #783). Rozwiązanie zadziałało w trudniejszym wariancie: równoległa sesja lekcji 3.2
  edytowała i commitowała ten sam `kursy/agenty-ai/_nagrywanie/uslugi/n8n.js` (ostatnie trzy commity pliku).
  Pathspec bierze cały plik z drzewa, więc przed commitem sprawdziłem `git diff` tego pliku: były w nim tylko
  4 moje fragmenty. Dopiero potem `46cbace4` z pathspec, bez `ticket.yaml` 3.2 i bez `planning/daily/…`
  innej sesji.

## Rozwiązanie
W checkoucie dzielonym z innymi sesjami commituj zawsze z pathspec: `git commit -m "…" -- <ścieżka>
<ścieżka>`. Nowy plik najpierw `git add -N <ścieżka>`. Commit ze ścieżkami bierze te pliki z drzewa
roboczego i nie rusza reszty indeksu, więc cudzy stage zostaje nietknięty. Przed commitem przeczytaj
`git diff --cached --stat`; jeśli są tam cudze wpisy, wymień je w raporcie. Częściowa wersja pliku (tylko
mój blok) idzie przez tymczasowy indeks `GIT_INDEX_FILE`.
