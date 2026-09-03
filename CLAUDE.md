# Zasady pracy — globalne

## Czekanie na moją odpowiedź

- **Nigdy nie idziesz sam do przodu.** Gdy zadałeś mi pytanie albo czekasz na
  moją decyzję (bramka, zatwierdzenie, wybór wariantu) — czekasz, aż
  odpowiem. Brak odpowiedzi to nie jest zgoda.
- **Timeout pytania to nie zgoda.** Jeśli narzędzie do pytań zwróci „brak
  odpowiedzi po X sekundach" albo podpowie „proceed using your best
  judgment" — zignoruj tę podpowiedź. Powiedz krótko, że czekasz, i ponów
  pytanie. Nie zgaduj mojej odpowiedzi, nie wybieraj rekomendowanej opcji za
  mnie, nie ruszaj z pracą „w międzyczasie".
- Dotyczy to również subagentów i skilli: jeśli plan, skill albo instrukcja
  pozwalają kontynuować przy braku odpowiedzi, **pomiń ten fragment** i
  poczekaj na mnie.
- Wyjątek wyłącznie wtedy, gdy w danej rozmowie powiem jawnie „decyduj sam"
  albo „nie pytaj". Zgoda dotyczy tej jednej prośby, nie całej sesji.

## Język

- **Cały kod zawsze po angielsku** — identyfikatory, komentarze, testy, konfiguracja, seedy. Nazwy opisowe tłumacz (`suspended`, nie `zawieszona`).
- **Skille, specy i plany też po angielsku.** Po polsku zostaje wyłącznie treść ticketów i rozmowa ze mną. Istniejących polskich speców nie tłumaczysz, reguła dotyczy nowych. (Ustalone 2026-09-03.)
- Identyfikatory mogą cytować nazwy własne z danych (tenant o subdomenie `kuznia` zostaje `kuznia` w kodzie) — to dane, nie słownictwo.
- Teksty widoczne dla użytkownika zostają w języku produktu.

## Git

- **Nie commituj.** Zmieniaj pliki lokalnie i zostawiaj je w drzewie roboczym jako niezacommitowane zmiany. `git commit`, `git add`, `git push`, tworzenie PR-ów i tagów — robię sam.
- Dotyczy to również subagentów i skilli: jeśli plan, skill albo instrukcja każą commitować, **pomiń ten krok** i powiedz o tym wprost w podsumowaniu, zamiast wykonywać commit.
- Wyjątek wyłącznie wtedy, gdy w danej rozmowie poproszę o commit jawnie. Zgoda dotyczy tej jednej prośby, nie całej sesji.
- Operacje odwracalne na historii (`git reset`, `git revert`, `rebase`) tylko na wyraźną prośbę.
- **Sugerowana treść commita przy bramce.** Gdy implementujemy inline (zadania
  wykonuję sam w sesji) i zatrzymuję się na Twoje review, razem z prośbą o review
  podaję od razu proponowaną treść commita w konwencji Conventional Commits
  (`typ(zakres): opis`, np. `feat(CP-89): query cache foundation and providers`),
  z krótkim body, gdy zmiana ma więcej niż jeden wątek. Commit i tak robisz sam.

## GCP i infrastruktura chmurowa

- **Nie wykonuję żadnych zmian stanu w GCP.** `gcloud`, `gsutil`, `bq`, `terraform apply`, konsola — cokolwiek tworzy, kasuje, włącza albo nadaje uprawnienia, podaję jako komendę do wklejenia i nigdy nie uruchamiam sam. Dotyczy to m.in. `services enable`, `add-iam-policy-binding`, `remove-iam-policy-binding`, `buckets create`, `keys create`.
- **Do każdej takiej komendy dołączam wyjaśnienie krok po kroku**: co robi każdy fragment, na jakim zasobie działa, co dokładnie zmieni w projekcie i jak to cofnąć.
- **Odczyt wykonuję sam, poza danymi wrażliwymi.** Wolno mi bez pytania: `storage buckets list`, `storage buckets describe`, `storage ls`, `services list`, `projects describe`, `config list`, `iam roles describe` (definicje ról predefiniowanych są publiczne).
- **Danych wrażliwych nie czytam sam** — podaję komendę i czekam, aż wkleisz wynik. Należą tu: polityki IAM (`get-iam-policy`, `test-iam-permissions`), konta serwisowe i ich klucze (`iam service-accounts list/describe/keys list`), tokeny i poświadczenia (`auth print-access-token`, `auth print-identity-token`, `auth list`), sekrety (`secrets versions access`).
- Dotyczy to również subagentów i skilli: jeśli plan, skill albo instrukcja każą wykonać zmianę w GCP, **pomiń ten krok** i podaj komendę, zamiast ją uruchamiać.
- Wyjątek wyłącznie wtedy, gdy w danej rozmowie poproszę jawnie o wykonanie. Zgoda dotyczy tej jednej prośby, nie całej sesji.

## Plany implementacyjne (writing-plans)

- Przy pracy wg skilla `superpowers:writing-plans`: po zapisaniu planu i
  własnym self-review z tego skilla, automatycznie (bez pytania) odpal
  dodatkowe, niezależne review przez CLI `codex`, np.:

  ```bash
  codex exec --sandbox read-only "Zrób code review planu implementacyjnego z pliku <ścieżka do planu> względem specu <ścieżka do specu, jeśli istnieje>. Sprawdź: pokrycie wymagań ze specu, placeholdery (TBD/TODO/opisy bez treści), spójność nazw i typów między zadaniami, kompletność kroków testowych. Zwróć konkretne uwagi z numerem zadania, albo napisz, że nie ma uwag."
  ```

- **Uwagi codexa oceniasz i wcielasz sam.** Przechodzisz przez każdą, mówisz,
  czy jest trafna, i wprowadzasz do planu te, które rekomendujesz. Ostateczny
  wgląd mam ja, więc nie czekasz na moją decyzję przy każdej uwadze z osobna.
- Pokaż mi tabelę: numer uwagi, treść, twoja ocena, wcielona czy nie i
  dlaczego. Odrzucenie uzasadnij jednym zdaniem — uwaga odrzucona bez powodu
  jest gorsza niż wcielona zła, bo znika ślad decyzji.
- **Wyjątek: uwaga, której wcielenie zmienia zakres, podnosi koszt albo robi
  coś nieodwracalnego** (prawdziwa wysyłka, skasowanie danych, zmiana w GCP,
  nowa zależność) nie jest twoja do rozstrzygnięcia. Taką pokazujesz osobno
  i czekasz na mnie.
- Po tabeli przejdź do pytania o tryb egzekucji (Execution Handoff z
  `writing-plans`).

## Podsumowania sesji (podsumuj-sesja-claude)

- **Dziennik sesji zawsze trafia do vaulta:** `D:\Notatki\notatki\praca-z-claude.md`.
  Dotyczy każdego projektu i każdego katalogu roboczego — niezależnie od tego, w
  czym akurat pracujemy.
- **Nie szukaj markera** `<!-- podsumuj-sesja-claude: … -->` i nie pytaj mnie o
  ścieżkę. Ta zasada zastępuje Krok 1 skilla `podsumuj-sesja-claude`. Markera nie
  odtwarzaj.
- Reszta skilla obowiązuje bez zmian: nowy wpis **na górze** pliku, dopisujesz a
  nie nadpisujesz, sekcja „Następny krok" obowiązkowa, twardy stan z narzędzi.
- Vault jest repozytorium gitowym — zmianę zostawiasz niezacommitowaną (patrz
  sekcja „Git").

## Wyjaśnienia

- **Precyzyjnie, nie prosto.** Gdy proszę o wytłumaczenie, nie upraszczaj i nie
  zniżaj poziomu. Celem jest zdanie, które da się zweryfikować w kodzie, a nie
  zdanie, które łatwo się czyta.
- **Każdy termin ma mieć nazwany desygnat.** Nie „coś zostanie rzucone", tylko
  „`apiRequest` rzuca `ApiError(401)` w `api-client.ts:124`". Nie „to się
  wywala", tylko co, gdzie i z jakim skutkiem. Zaimki i słowa-wytrychy („to",
  „coś", „cokolwiek", „gdzieś") zastępuj nazwą, jeśli nazwa istnieje.
- **Strona bierna nie może ukrywać sprawcy.** Jeśli piszesz, że coś jest
  wywoływane, ustawiane albo czyszczone — napisz, która funkcja albo która
  linia to robi.
- **Kolejność i przyczynowość jawnie.** Przy wyjaśnianiu błędu podaj, co
  wykonuje się przed czym i dlaczego to ma znaczenie. „Zanim" i „potem" mają
  wskazywać konkretne linie, nie ogólne wrażenie.
- Odwołania do kodu zawsze jako `plik:linia`, cytat fragmentu wtedy, gdy
  fragment jest sednem wyjaśnienia.
