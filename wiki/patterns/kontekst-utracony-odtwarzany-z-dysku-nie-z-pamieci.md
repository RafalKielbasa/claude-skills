# kontekst-utracony-odtwarzany-z-dysku-nie-z-pamieci

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Po kompaktowaniu albo w nowym oknie kontekstu użytkownik pyta „czy jesteś
świadom X" o rzecz z wcześniejszej części sesji. Claude odpowiada wprost, że
nie ma tego w kontekście, i odtwarza stan z narzędzi — plików, ledgera
egzekucji, gita — z jawnym rozdziałem „sprawdziłem" / „zakładam", zamiast
potwierdzać „tak" i pracować na domysłach.

## Przyczyna źródłowa
Pytanie sugeruje odpowiedź twierdzącą, a przyznanie braku pamięci wygląda na
słabość. Tymczasem stan na dysku jest tańszy w weryfikacji niż w odgadnięciu,
a praca na domyśle (np. na sygnaturach funkcji „jak je pamiętam") propaguje
błąd do artefaktu, który powstaje później i którego nikt już z pamięcią nie
porówna.

## Dowody
- 2026-09-06/07, sesja session_01T6FrJW1rs56KS6EsPB5agM: na „podzieliłem
  spec na dwa plany, czy jesteś tego świadom" odpowiedź „nie — w oknie
  kontekstu nie ma ani jednej wcześniejszej wiadomości", po czym stan
  odtworzony z `docs/superpowers/plans/`, ledgera SDD
  `.superpowers/sdd/…/progress.md` i `git`, z tabelą „sprawdziłem / zakładam"
  (m.in. „suite zielony — nie uruchomiony w tej sesji"). Wyszło, że Plan B
  istnieje tylko jako zakres w Planie A, nie jako plik. Pisany później Plan B
  brał sygnatury Planu A z kodu na dysku, nie z tekstu planu.
- 2026-10-05, sesja c653066f-3e46-4d11-8f8b-71a5c9d865a7 (nowa rozmowa, zero
  kontekstu): na „pracowaliśmy ostatnio nad systemem agentowym, zweryfikuj, czy
  wszystkie skille zostały zrobione" stan odtworzony z `git log --stat`, ledgera
  `.superpowers/sdd/2026-09-26-meeting-processing-repo-side/progress.md`,
  dziennika sesji i trzech planów, a potem sprawdzony na żywo: `kb-client
  pending`/`similar` → `404 … is not registered`, `gh auth status` → brak
  scope'u `project`, `ls workflows/` w `devstock-team-agent` → brak `37`–`40`.
  Ledger mówił „repo-side gotowe", dopiero sondy pokazały, że strona n8n nie
  istnieje. Odstępstwo: nie podałem gałęzi, na której leży praca — patrz
  [[gotowe-na-galezi-roboczej-zgloszone-bez-galezi-integracji]].

## Rozwiązanie
Gdy pytanie dotyczy czegoś, czego nie ma w kontekście, powiedz to w pierwszym
zdaniu i odtwórz stan z narzędzi, zanim cokolwiek zaproponujesz. Każdy fakt
oznacz jako sprawdzony (z nazwą pliku albo komendy) albo założony; artefakty
budowane na cudzym kodzie opieraj na kodzie z dysku, nie na jego opisie.
