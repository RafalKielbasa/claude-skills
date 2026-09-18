# regula-skilla-zapisana-tylko-w-skill-md

- **Skill:** live-gift
- **Typ:** porażka
- **Status:** otwarty

## Opis
Reguła o kształcie artefaktu żyje w trzech miejscach naraz: w prozie
`SKILL.md`, w `templates/<artefakt>.md` i we wzorcowym artefakcie, na który
skill się powołuje. Zmiana reguły w `SKILL.md` zostawia dwa pozostałe miejsca
mówiące starą wersję — i to one, nie proza skilla, trafiają do następnego
wydarzenia, bo szablon się kopiuje, a wzorzec czyta się jako przykład.

## Przyczyna źródłowa
`SKILL.md` opisuje regułę słowami, szablon realizuje ją kształtem, a wzorcowy
artefakt jest jej jedyną pełną instancją. Nic nie sprawdza zgodności między
nimi: nie ma walidatora skilli, a `evolve-skill` patrzy na wzorce, nie na
wewnętrzną spójność. Sprzeczność jest cicha i ujawnia się dopiero przy
kolejnym wydarzeniu, gdy ktoś pisze narrację z szablonu i dostaje kształt,
którego SKILL.md już zabrania.

## Dowody
- 2026-09-18, sesja fe0e2a4e (id claude.ai niedostępny): dwie sprzeczności
  w jednej sesji, obie złapane wyłącznie przez ponowne przeczytanie plików po
  zmianie. (1) Po dołożeniu segmentu o wskazaniu gotowego credentiala pierwsza
  linia `[AKCJA:]` w szablonie i we wzorcowej narracji nadal mówiła „nie
  pokazuj ekranów logowania **ani listy credentiali** w żadnym momencie tego
  nagrania" — czyli zakazywała dokładnie tego, co nowy segment każe zrobić.
  (2) Po przesunięciu segmentu o czerwonych trójkątach na pozycję drugą
  w `SKILL.md` szablon miał go nadal po zwiedzaniu kanwy, jako trzeci; wykryte
  dopiero przez przepuszczenie szablonu przez `parsujScenariusz` i wypisanie
  tytułów segmentów po kolei.

## Rozwiązanie
Zmiana reguły w `SKILL.md` i zmiana `templates/` idą jedną operacją, a zaraz po
niej wypisujesz strukturę szablonu tym samym narzędziem, którym czyta się
artefakt (dla narracji: `parsujScenariusz` i lista tytułów segmentów), i
porównujesz ją z tym, co właśnie napisałeś w prozie. Gdy reguła powołuje się
na wzorcowy artefakt, sprawdzasz też jego — a gdy wzorzec jest starszy od
reguły, w `SKILL.md` stoi jawnie, do czego wolno go używać („bierz z niego
kształt segmentu, nigdy strukturę").
