# lista-otwartych-pozycji-z-opisu-issue-nie-z-kodu

- **Skill:** board-tracker
- **Typ:** porażka
- **Status:** otwarty

## Opis
Podałem, co jest otwarte w issue śledzącym listę pozycji (DT-93 #834), czytając jego opis, nie kod. W dwóch raportach i w śladzie stało „#834 zostaje In progress, bo sekcje 2–6 mają otwarte pozycje”. Dopiero na pytanie „czy możemy zamknąć DT-93” sprawdziłem pozycje na `main` i ponad 20 bez ✅ okazało się zrobionych dzień wcześniej.

## Przyczyna źródłowa
PR-y zamykające pozycje issue śledzącego wymieniają je w swoim opisie (D1, D28, …), ale nikt nie odhacza ich w opisie issue. Sesja, która nie robiła tych PR-ów, czyta opis jako stan. Propozycja odhaczenia pozycji po scaleniu fali 1 (#433) została bez odpowiedzi i zginęła po kompakcji, więc opis rozjechał się jeszcze bardziej. To ta sama rodzina co [[stan-projektu-sprawdzony-u-zrodla-nie-w-indeksie]]: dokument stanu aktualizują inni niż ci, którzy wykonują pracę.

## Dowody
- 2026-11-13, sesja 7d286730-a904-4694-a25c-8e90c19e7273 (id claude.ai niedostępny; code-busters-mobile, DT-93 #834):
  - raport po scaleniu #436 i ślad: „sekcje 2–6 mają otwarte pozycje”, „Następny krok: wybrać następne otwarte pozycje z sekcji 2–6”;
  - sprawdzenie na `93bd0f0`: D1, D2, D20, D28, D30, D32, usunięty barrel `@/components/ui` i sekcja 5, zadania 5–7 zrobił kodozercy/code-busters-mobile#431 (scalony 2026-11-12), a drobne uwagi M3 nr 17, 18, 24, 29, 30, 31, 34, 36 i 37 zrobił #433. Żadna z tych pozycji nie miała ✅;
  - #431 znalazłem dopiero przez `git log -1 -- lib/forms/use-field-refs.ts`, bo podsumowanie sesji znało tylko #433 i #436;
  - po sprawdzeniu otwartych zostało 6 pozycji: przeniesione do kodozercy/code-busters-mobile#437, a #834 zamknięte.

## Rozwiązanie
Zanim powiesz, co jest otwarte w issue śledzącym listę pozycji, sprawdź każdą otwartą pozycję u źródła:
- wylistuj PR-y i commity tego issue (`git log --oneline main --grep '<DT-n>'`, PR-y z odnośnikiem do issue) i ich opisy;
- otwórz kod przy pozycjach, których żaden PR nie wymienia.

Pozycję podawaj jako otwartą tylko po sprawdzeniu, a w odpowiedzi rozdziel „sprawdzone w kodzie” od „według opisu issue”. Po scaleniu PR-a, który zamyka pozycje takiego issue, przygotuj w tym samym raporcie nowy opis z ✅ i dowodem, jako wariant [A] decyzji, a nie luźną propozycję.
