# uwaga-podana-w-rozmowie-omija-bramke-znacznikow

- **Skill:** kurs-uwagi
- **Typ:** porażka
- **Status:** otwarty

## Opis
Rafał podaje uwagę do scenariusza w rozmowie („w sekcji 9 pytanie o storczyki
odpowiada z simple memory, trzeba to uwzględnić"), a nie jako linię
`[UWAGA: ...]` w pliku. Bramka wejścia `/kurs-uwagi` każe wtedy przerwać:
„zero znaczników → stop and say so plainly". Cała maszyneria skilla — inwentarz
plików zależnych, propagacja z kroku 7, `grep` po starym brzmieniu, walidacja
i przegenerowanie planu nagrania — jest dokładnie tym, czego taka uwaga
potrzebuje, ale formalnie jest niedostępna.

## Przyczyna źródłowa
Skill wiąże swój najcenniejszy mechanizm z **formatem wejścia**, a nie
z rodzajem pracy. Znacznik w pliku pełni dwie różne role naraz: nosi treść
uwagi **i** wskazuje miejsce w scenariuszu. Uwaga z rozmowy niesie jedno i drugie
(„sekcja 9", „pytanie o storczyki"), tylko w innym nośniku — mechanizm jej nie
odrzuca, odrzuca ją bramka.

## Dowody
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: `/kurs-uwagi` uruchomiony na M02L01,
  `grep -rn "UWAGA"` dał zero trafień, a uwaga stała w wiadomości Rafała.
  Poprowadziłem pracę procedurą skilla mimo bramki: inwentarz plików zależnych,
  propagacja do `artykul.md`, `konspekt-nagrania.md` i `dane-do-nagrania.md`,
  `grep` po starych brzmieniach z zacytowaniem zera trafień, `npm run validate`
  i `npm run plan-nagrania` po każdej rundzie. Sesja miała trzy takie rundy
  (uwaga o segmencie 9, korekta o segmencie 8, wycofanie restartu z segmentu 8)
  i żadna nie przyszła jako znacznik. Gdybym bramkę potraktował dosłownie,
  odesłałbym Rafała do wpisania własnej uwagi do pliku, żeby móc ją przeczytać.

## Rozwiązanie
Dopuścić uwagę z rozmowy jako równoprawne wejście skilla. Krok 1 sprawdza
wtedy: znaczniki w pliku **albo** uwagi podane w tej rozmowie — brak obu dopiero
zatrzymuje. Krok 2 (inwentarz) buduje tabelę z wiadomości Rafała zamiast
z linii pliku, a że uwaga z rozmowy nie wskazuje akapitu tak precyzyjnie jak
znacznik, dopisać obowiązek pokazania w tabeli zdania, którego dotyczy,
i potwierdzenia go przed edycją. Reszta procedury — kroki 4–11 — bez zmian:
one nie zależą od tego, skąd uwaga przyszła. Krok 6 („skasuj naniesione,
zostaw nienaniesione") dotyczy wtedy tylko znaczników w pliku; uwaga z rozmowy
nie ma czego kasować.
