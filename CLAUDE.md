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

## Forma odpowiedzi

Sekcja ogólna, obowiązuje w każdej odpowiedzi. „Wyjaśnienia" ją zawężają, gdy
proszę o wytłumaczenie — przy konflikcie wygrywają „Wyjaśnienia".

### Struktura

- **Odpowiedź w pierwszym zdaniu.** Wniosek, decyzja albo „nie da się" idzie na
  początek, uzasadnienie potem. Bez preambuł i bez powtarzania mojego pytania.
- **Stała kolejność:** (1) odpowiedź, (2) uzasadnienie albo dowód, (3) zastrzeżenia
  i to, czego nie sprawdziłeś, (4) następny krok. Sekcję pomijasz, gdy jest pusta —
  nie wypełniasz jej watą.
- **Nagłówki dopiero od trzech sekcji.** Krótka odpowiedź to akapit i ewentualnie
  lista, nie dokument.
- **Domyślną formą jest lista punktowana.** Proza tylko wtedy, gdy treść jest
  jednym ciągiem myśli, którego rozbicie na punkty by go zepsuło. Ciąg zdań
  opisujących osobne rzeczy zawsze rozbijasz na punkty.
- **Tabela, gdy tylko się da.** Zawsze przy porównaniu ≥3 rzeczy wg ≥2 kryteriów,
  ale też przy listach plików ze zmianami, uwagach z review, wynikach testów,
  wariantach do wyboru — wszędzie, gdzie punkty mają powtarzalną strukturę.
  Listę punktowaną zostawiasz tam, gdzie punkty nie dzielą wspólnych kolumn.
- **Każda odpowiedź zaczyna się od poziomej linii `---` i nagłówka.** Linia odcina
  ją od poprzedniej wiadomości, nagłówek nazywa **temat i intencję** tej konkretnej
  odpowiedzi — np. „Tłumaczenie architektury aplikacji", „Pytania do specu
  onboardingu", „Raport z migracji bazy", „Propozycja: cache zapytań". Sam temat
  bez intencji („Architektura aplikacji") to za mało — z nagłówka ma wynikać, czy
  tłumaczysz, pytasz, raportujesz, czy proponujesz.
- **Nagłówek otwierający jest bezwarunkowy** — dajesz go też przy odpowiedzi
  jednozdaniowej, i nie zwalnia Cię z reguły „Odpowiedź w pierwszym zdaniu":
  wniosek idzie zaraz pod nagłówkiem.
- **Wewnątrz odpowiedzi też odcinasz bloki tematyczne linią `---`.** Ma być widać,
  gdzie kończy się jedna myśl, a zaczyna następna — bez wczytywania się w treść.

### Prezentacja kodu

- **Nie wklejasz treści kodu do terminala.** Ani nowych plików, ani zmienionych
  fragmentów, ani „przed/po". Cały diff i tak przeglądam w edytorze — powtórka w
  odpowiedzi tylko zabiera miejsce.
- **Zamiast kodu podajesz `plik:linia` i jedno zdanie, co się tam zmieniło.**
- **Wyjątki, gdzie blok kodu jest dozwolony:** komenda do wklejenia przeze mnie
  (patrz „GCP i infrastruktura chmurowa"), dosłowny komunikat błędu albo wynik
  narzędzia, oraz fragment, o którego pokazanie proszę wprost.

### Długość

- **Domyślnie zwięźle, bez utraty desygnatów.** Skracasz przez wycięcie tła, nigdy
  przez zamianę nazw na ogólniki.
- **Zwięźle to nie znaczy za mało.** Pokazujesz dość, żebym nie musiał dopytywać o
  rzecz, którą już masz sprawdzoną. Gdy wybierasz między jednym punktem więcej a
  moim pytaniem uzupełniającym, dajesz ten punkt. Ucinasz tło i powtórzenia, nie
  fakty.
- **Nie streszczaj tego, co przed chwilą pokazałeś.** Po tabeli, diffie albo bloku
  kodu nie przepisujesz ich treści prozą.
- **Nie wyliczaj alternatyw.** Rekomendacja plus jedno zdanie o odrzuconej opcji
  tylko wtedy, gdy odrzucenie jest nieoczywiste.
- **Rozwinięcie na żądanie.** Gdy świadomie ucinasz coś istotnego, dopisz jedną
  linię „mogę rozwinąć: X" zamiast rozwijać z własnej inicjatywy.

### Odwołania i dane

- **Kod zawsze jako `plik:linia`**, ścieżka względem katalogu roboczego. Cytat
  fragmentu tylko wtedy, gdy fragment jest sednem.
- **Rozdzielaj sprawdzone od wywnioskowanego.** „Sprawdziłem: …" kontra
  „Zakładam: …". Plik, funkcja albo flaga, których nie otworzyłeś w tej sesji, są
  hipotezą i mają być tak oznaczone.
- **Wyniki narzędzi cytujesz dosłownie**, gdy brzmienie ma znaczenie (komunikat
  błędu, wynik testu, treść ticketu). Parafraza wyniku komendy jest niedopuszczalna
  tam, gdzie decyduję na jej podstawie.

### Raport po zadaniu

Stały szkielet, w tej kolejności:

1. **Co zrobione** — jedno zdanie na wątek.
2. **Pliki** — po jednej linii na plik: `ścieżka:linia` i co się zmieniło.
3. **Weryfikacja** — uruchomiona komenda i jej wynik. Jeśli nie uruchomiłeś
   testów albo builda, piszesz wprost „nie zweryfikowane" i dlaczego. Brak tej
   linii oznacza, że coś przemilczałeś.
4. **Następny krok** — a przy zatrzymaniu na review dodatkowo propozycja treści
   commita w Conventional Commits (patrz „Git").
