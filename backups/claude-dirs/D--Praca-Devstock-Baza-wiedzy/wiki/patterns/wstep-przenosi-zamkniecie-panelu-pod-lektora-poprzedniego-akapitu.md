# wstep-przenosi-zamkniecie-panelu-pod-lektora-poprzedniego-akapitu

- **Skill:** kurs-montaz (synchronizacja narracji, parowanie)
- **Typ:** porażka
- **Status:** zaadresowany (2026-11-04, kurs-montaz)

## Opis
Wstęp zapisany dosłownie według skilla (`[tStart, 0]` za `close_node` albo kliknięciem) przenosi tę akcję do poprzedniego
akapitu. Gdy jego ostatni odcinek ma `R < N`, panel zamyka się wcześnie, a pod lektorem stoi pusta kanwa zamiast tematu
tego akapitu.

## Przyczyna źródłowa
Wstęp poprawia pierwsze zdanie jednego akapitu kosztem końca poprzedniego, a skill patrzył tylko na pierwszy. Kontrola też:
kafelek `K` tego nie pokaże, bo żadna kotwica nie jest zła. Widać to dopiero na kafelku `Z` poprzedniego akapitu albo na
klatce zaznaczenia.

## Dowody
- 2026-11-04, sesja 78788d89-0fb4-49f8-86e8-69106f4e6036 (id claude.ai niedostępny), zadanie 8 planu narration sync:
  - Sześć miejsc. W 3.1 poprzednie akapity 5:4, 7:6, 7:8, 9:3, wstępy usunięte w 5:5, 7:7, 7:9, 9:4. W 3.3 poprzednie 4:5,
    7:3, wstępy usunięte w 4:6, 7:4.
  - 3.1, 7:6: pusta kanwa przez 6,3 s pod „Bo bez niego agent dostanie…”; 9:3: przez 15,2 s pod zdaniami o credentialu.
  - Świeży implementer znalazł to na kafelkach `Z` i klatkach zaznaczeń, a recenzent potwierdził trzy miejsca na klatkach.
  - Lekcji 3.2, zaakceptowanej wcześniej, nikt pod tym kątem nie sprawdzał.

## Rozwiązanie
Wpisane do `/kurs-montaz` i specu (`2ca3469c`): przed wstępem nad `close_node` albo kliknięciem przeczytaj ostatni odcinek
poprzedniego akapitu w `sync-report.md`. Przy `R < N` nie pisz wstępu i przyjmij flagę braku kotwicy; kotwica wewnętrzna
może nadal ustawić nazwaną akcję. Po wstępie otwórz też kafelek `Z` poprzedniego akapitu.
