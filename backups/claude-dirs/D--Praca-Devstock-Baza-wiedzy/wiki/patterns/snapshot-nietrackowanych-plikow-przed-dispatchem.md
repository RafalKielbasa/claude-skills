# snapshot-nietrackowanych-plikow-przed-dispatchem

- **Skill:** kurs-redakcja (krok 1); dotyczy każdego skilla wysyłającego agentów do edycji plików lekcji
- **Typ:** sukces
- **Status:** otwarty

## Opis
Przed wysłaniem agentów redakcyjnych skopiowałem nietrackowane `quiz.json`
i `cwiczenia/*.json` do katalogu tymczasowego. W trakcie przebiegu Rafał
zacommitował je sam, więc po powrocie agentów `git diff` na tych plikach
pokazywał już tylko redakcję — ale gdyby zacommitował je po redakcji, baza
porównania zniknęłaby bezpowrotnie i kontrola „klucz odpowiedzi bez zmian"
nie miałaby się o co oprzeć.

## Przyczyna źródłowa
`/kurs-zadania` zostawia `quiz.json` i `cwiczenia/` jako pliki nietrackowane,
a `/kurs-redakcja` bywa uruchamiana zanim Rafał je zacommituje. Dla pliku
nietrackowanego `git` nie ma żadnej wersji bazowej, więc jedyny zapis stanu
sprzed redakcji jest w drzewie roboczym — i kasuje go pierwszy zapis agenta.
Krok 5 skilla żąda przy tym porównania, którego bez bazy nie da się wykonać:
„poprawne odpowiedzi te same", „pola bez zmian". Drugie źródło: repozytorium
jest dzielone — Rafał commituje i staguje równolegle do przebiegu, więc stan
indeksu w trakcie sesji nie jest stabilny.

## Dowody
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: przed Workflow `git status`
  pokazał `?? quiz.json` i `?? cwiczenia/`; snapshot poszedł do katalogu zadania.
  W trakcie przebiegu wszedł commit `42b5a51 kurs(agenty): ćwiczenia M02L01`,
  po którym `git diff` zaczął działać na tych plikach. Snapshot posłużył
  do sprawdzenia, że commit zawiera stan sprzed redakcji („TAK - identyczne,
  diff pokazuje wyłącznie redakcję"), i dopiero na tej podstawie dało się
  potwierdzić, że klucz odpowiedzi quizu jest nietknięty co do znaku.
  Osobno tego samego dnia Rafał zastagował pliki lekcji w trakcie mojej pracy,
  przez co `git diff` (bez `HEAD`) przestał je pokazywać i przez chwilę
  wyglądało to jak utrata zmian — patrz wzorzec globalny
  [[git-diff-bez-head-gubi-wlasna-prace]].

- 2026-09-14, sesja session_01EBknRAiTAR3Phdk3gLiwNP: drugi dowod, tym razem na plikach **trackowanych** -
  i to rozszerza wzorzec. `artykul.md`, `video/scenariusz.md` i `wymowa.md` byly
  w gicie, ale mialy niezacommitowane zmiany z wczesniejszego `/kurs-uwagi` tej samej
  sesji, wiec `git diff HEAD` po powrocie agentow pokazywalby dwie warstwy naraz
  i nie dalo sie na nim oprzec kontroli "czy segment nie zgubil tresci". Snapshot do
  katalogu tymczasowego, zrobiony tuz po starcie Workflow, dal baze dla dwoch kontroli
  niewykonalnych z gita: liczba slow per segment przed i po (najwiekszy spadek -6 slow
  w segmencie 9) oraz porownanie 39 linii `[AKCJA: ...]` linia po linii (zero roznic).
  Wniosek: baza porownania nie jest "plik nietrackowany", tylko "plik, ktorego stan
  sprzed tego kroku nie stoi w zadnym commicie".

## Rozwiązanie
W kroku 1, po inwentaryzacji plików, sprawdzić `git status` katalogu lekcji
i każdy plik oznaczony `??` skopiować do katalogu tymczasowego zadania jako
bazę porównania. W kroku 5 porównywać z tą bazą, nie z `git diff` — i nie
zakładać, że plik nietrackowany na starcie jest nietrackowany na końcu.
Patrz też [[reczne-dopiski-autora-w-drzewie-przed-redakcja]], który każe
w tym samym kroku przejść `git diff` plików trackowanych.
