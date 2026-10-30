# sciezki-planu-z-notatek-inwentarza-bez-ls

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sekcja **Files** zadań planu wskazuje ścieżki, których nie ma w repo: pliki leżą piętro wyżej albo niżej
niż plan zakłada. Kroki sprawdzające każą też testować „czysty helper”, ale nie nazywają pliku, w którym
ten helper ma powstać.

## Przyczyna źródłowa
Ścieżki planu biorą się z notatek inwentarza (nazwa pliku + liczba linii) i z konwencji sąsiednich folderów
(`screens/<x>/components/`). Self-review `writing-plans` sprawdza spójność nazw między zadaniami, a nie
istnienie plików w kodzie. Gdy wykonawca dostanie zadanie, błędny glob psuje zakres zadania i lint.

## Dowody
- 2026-10-28, sesja c0757c79-09ad-4165-ad02-a020e38adc07 (id claude.ai niedostępny), plan 6 (M3) migracji
  Kodożerców. `codex exec --sandbox read-only` znalazł:
  - `screens/achievements/components/{achievements-container,achievements-screen,achievement-card}.tsx`
    (pliki leżą w `screens/achievements/`);
  - `screens/loyalty-program/components/{loyalty-program-screen,loyalty-program-view}.tsx` (leżą w
    `screens/loyalty-program/`);
  - kroki NODE bez czystych plików `.ts` (formatter nagród, scalanie stron feedu, odmiana).
  Self-review ich nie wyłapał; `ls` w repo potwierdził uwagi przed poprawką.
- 2026-10-29, sesja 4f646017-851e-44d6-a6c9-cf219eac164a (id claude.ai niedostępny), plan 8 (M4). Reguła
  zastosowana przed zapisem: każda ścieżka Files sprawdzona `ls`/`Glob` na `f5eaaa4`, `codex` nie zgłosił ani
  jednej ścieżki. Przeszły za to trzy inne nazwy wzięte z prozy inwentarza i z poprzedniego planu, nie z kodu:
  - typ `NotificationWorkflowSetting`, którego nie ma; w kodzie są `WorkflowSettingMeta` i
    `NotificationSettingRow` (`codex` uwaga 2);
  - docelowe propsy ekranu zmiany hasła wyprowadzone z hooka, bez propsa `onTrigger`, który woła efekt
    `useWatch` tego ekranu (`change-password-screen.tsx:47-56`; `codex` uwaga 1);
  - komenda kontroli kolorów przepisana z planu 6 z placeholderem `<those files>` (`codex` uwaga 3).
- 2026-10-30, sesja 71a4e9dd-49b4-401d-b0e0-5d3ec341952f (id claude.ai niedostępny), plany 9 (W5) i 10 (M5).
  Reguła zastosowana: ścieżki Files obu planów sprawdzone `ls` w kopiach głównych repo kodu (drzewa czyste na
  `349ff20cc` i `7afa0f6`), ścieżki z #1713 przez `git show --name-only 2bffabb4f`. Nowy wariant: skróty z
  wielokropkiem przepisane z tabel inwentarza (`features/activitiesList/…/ActivitesList.tsx`,
  `quiz/…/question-view.tsx`, `fix(sdk58): …`). W planie 9 wyłapał je mój `ls` przed review; w planie 10 `codex`
  zgłosił niedeterministyczną kontrolę i wielokropek w treści commita (uwagi 5 i 6), a pełna lista 11 plików
  przyszła z `git show --name-only c56381a`. Wielokropek w ścieżce to ten sam placeholder co `<those files>`.

## Rozwiązanie
Przed zapisaniem planu sprawdź każdą ścieżkę z sekcji **Files** w kodzie (`ls` albo `git ls-files` na
bazowym commicie) i popraw te, których nie ma. Każdy krok NODE albo test „czystego helpera” nazywa plik
(`.ts` bez importów platformy), funkcję z sygnaturą i gotową komendę z asercjami. Tak samo traktuj
identyfikatory: każdą nazwę typu, propsa i funkcji z planu sprawdź `grep` w kodzie, a zmieniając propsy
komponentu przeczytaj komponent, nie tylko hook, który je dostarcza. Komendy kroków sprawdzających mają być
wykonalne tak, jak stoją; placeholder `<…>` przepisany z poprzedniego planu zastąp komendą.
