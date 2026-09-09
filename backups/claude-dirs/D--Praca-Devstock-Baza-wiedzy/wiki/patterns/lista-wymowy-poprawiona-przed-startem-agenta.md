# lista-wymowy-poprawiona-przed-startem-agenta

- **Skill:** kurs-redakcja (kroki 1 i 4)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Decyzja fonetyczna z odsłuchu została wpisana do `kursy/agenty-ai/wymowa.md`
i do `kursy/_wspolne/redakcja.md` PRZED dispatchem grupy B, a prompt agenta
dodatkowo nazywał zmianę wprost („lista została dziś zmieniona; w scenariuszu
stoi jeszcze stary zapis, 19 wystąpień"). Agent podmienił wszystkie wystąpienia
za pierwszym podejściem.

## Przyczyna źródłowa
Agent grupy B czyta `wymowa.md` jako źródło prawdy w momencie startu i nie ma
skąd wiedzieć, że lista jest nieaktualna. Gdyby ruszył przed poprawką, zapisałby
19 miejsc starym zapisem i uznał to za zgodne z listą — a jego raport
potwierdziłby zgodność, więc błąd przeszedłby przez bramkę. Sama poprawka listy
po dispatchu nie działa wstecz.

## Dowody
- 2026-09-09, sesja session_01PrFurqNDm53ZdkCryE5kjm: `wymowa.md:19-20`
  i `redakcja.md:71,79-83,93,97` zmienione przed uruchomieniem Workflow;
  w scenariuszu 0.2 wynik po agencie: 19 × `"en osiem en"`, 3 × `"dżejson"`
  jako nazwa widoku, 1 × `dżejson` jako format w mowie, zero pozostałości
  starego zapisu (`grep "n osiem n"` → brak).

## Rozwiązanie
W kroku 1, przy ustalaniu listy wymowy: jeśli w tej sesji zapadła nowa decyzja
fonetyczna, wpisz ją do `wymowa.md` (i do `redakcja.md`, gdy dotyka reguły)
zanim ruszy krok 4 — nigdy nie przekazuj jej wyłącznie w prompcie. W prompcie
grupy B nazwij zmianę osobno: co było, co jest, ile wystąpień starego zapisu
stoi jeszcze w pliku. Ta sama zasada dotyczy każdego dokumentu, który agent
czyta jako źródło prawdy.
