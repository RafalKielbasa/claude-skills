# asercja-testu-na-sygnale-zastepczym

- **Skill:** superpowers:writing-plans (ogólny: każdy skrypt kontrolny)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Kontrola sprawdza sygnał zastępczy zamiast samego artefaktu: liczbę kart, obecność napisu,
globalny stan współdzielony z innymi albo identyfikator bez jego zakresu. Inne, poprawne
zachowanie produkuje ten sam sygnał, więc kontrola daje fałszywy FAIL (albo PASS), a czas idzie
na diagnozę testu zamiast skilla.

## Przyczyna źródłowa
Asercję pisze się z wyobrażenia przebiegu, nie z przejścia go krok po kroku: nie liczy się
karty, na którą pada odpowiedź „przerwij", nie zakłada, że nagłówek sekcji trafi też na kartę,
nie odróżnia „mój zapis" od „czyjś zapis" w stanie współdzielonym.

## Dowody
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny), repo Baza wiedzy, testy na sucho bramki
  `/daily`: pięć fałszywych FAIL w jednej sesji — (1) „15 kart", a `[sesja przerwana]` odpowiada
  na 16. kartę, która się drukuje; (2) „`## Statusy` nie ma w logu" jako dowód, że notatki nie
  pokazano, a karty ⚠ drukowały `## Statusy → Grzegorz` w polu MIEJSCE; (3) porządek osieroconych
  wpisów porównywany po gołym `entry_id`, choć poprawny `delete` dotyczył starej kategorii `dev`;
  (4) „ostatnie issue w repo bez zmian", a issues #561–#563 założył w tym czasie członek zespołu;
  (5) fixture „zamkniętego" spotkania bez znacznika `**Opublikowano:**`, który nowa reguła czyni
  warunkiem zamknięcia.
- 2026-11-12, sesja 70c314dd-32d0-4c65-ac33-357c06802095 (id claude.ai niedostępny; code-busters-v2 jako katalog, praca w ~/.claude/skills/code-review-master): wykonanie planu subagentami, trzy testy implementerów (Sonnet) przechodziły
  z niewłaściwego powodu, każdy złapany dopiero przez recenzenta zadania: (1) `changedHunks returns null when the diff
  cannot be computed` — plan bez `mode: 'pr'`, więc `null` brał się z `TypeError` gita na `undefined`, a wstrzyknięty
  `gh` nie był wołany; (2) filtr zmienionych linii Semgrepa sprawdzany samymi licznikami (`findings.length === 1`,
  `outsideChange === 1`), co przechodziło także z odwróconym warunkiem; (3) test „podrobione `source` jest nadpisane”
  podawał od razu `source: 'codex'`, więc nie sprawdzał nadpisania, na którym stoi reguła `fix`. Każda poprawka
  dopisała asercję na samym artefakcie (`lines` [11, 11], wywołanie `gh`, `sources` w zapisanym `findings.json`).

## Rozwiązanie
Asercję formułuj na artefakcie, który zmiana ma wytworzyć (tytuł notatki, para kategoria +
`entry_id`, obiekty utworzone przez własne konto), a liczniki wyprowadzaj, przechodząc skrypt
odpowiedzi linia po linii — łącznie z kartą, na którą pada przerwanie. Stan współdzielony
porównuj przed/po i zawężaj do własnego aktora. Fixture buduj z warunków reguły po zmianie,
nie sprzed niej.
