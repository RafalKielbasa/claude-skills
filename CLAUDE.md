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

- **Tryb commitów ustala repo.** Domyślna dla repo bez własnej konfiguracji:
  nie commituję i nie pushuję — zmiany zostają w drzewie roboczym jako
  niezacommitowane. Repo, w którym jest inaczej, deklaruje to w swoim
  `.claude/settings.json` albo `.claude/settings.local.json`:
  - „Baza wiedzy" (`D:\Praca\Devstock\Baza wiedzy`) — **commituję sam, bez
    pytania**, w całym repo łącznie z `tools/`.
  - vault „Notatki" (`D:\Notatki\notatki`, repo `my-second-brain`) —
    **commituję i pushuję sam, bez pytania, po każdej zmianie**, wyłącznie
    pliki zmienione w danej sesji; szczegóły w `.claude/CLAUDE.md` vaulta.
    (Ustalone 2026-10-15.)
  - repo z kodem (devstock-team-agent, company-agent-chat, saas app,
    code-busters-v2, code-busters-mobile) — **domyślnie nie commituję**;
    commit ma tam regułę `ask`, więc gdy mi każesz, dostajesz prompt
    uprawnień zamiast blokady.
- **Pusha nie robię nigdy domyślnie**, w żadnym repo — także w „Bazie wiedzy".
  Wykonuję go tylko po Twoim jawnym zdaniu w danej rozmowie („commituj
  i wypychaj"); zgoda dotyczy tej prośby, nie całej sesji. `git push` ma
  wszędzie regułę `ask`. Jedyny wyjątek: vault „Notatki" (wyżej), gdzie push
  jest domyślny i ma regułę `allow`.
- **Domyślną znosisz w rozmowie w obie strony** — „commituj" włącza commity
  tam, gdzie są wyłączone, „nie commituj" wyłącza je tam, gdzie są domyślnie
  włączone. Obowiązuje do końca tej rozmowy.
- **Przed każdym commitem sprawdzam gałąź** (`git branch --show-current`)
  i podaję ją w raporcie. Powód: working tree bywa współdzielony z drugą
  sesją i commit potrafi wylądować na cudzej gałęzi.
- Dotyczy to również subagentów i skilli: **idą za domyślną repo, ale nie
  pushują nigdy**. Jeśli plan, skill albo instrukcja każą pushować, **pomiń
  ten krok** i powiedz o tym wprost w podsumowaniu. Wyjątek: w vaultcie
  „Notatki" subagenci i skille pushują tak jak sesja główna.
- Tworzenie PR-ów i tagów robisz sam.
- Operacje odwracalne na historii (`git reset`, `git revert`, `rebase`) tylko na wyraźną prośbę.
- **Sugerowana treść commita przy bramce.** W repo, gdzie commit jest
  wyłączony: zatrzymując się na Twoje review, podaję od razu proponowaną treść
  commita w konwencji Conventional Commits (`typ(zakres): opis`, np.
  `feat(CP-89): query cache foundation and providers`), z krótkim body, gdy
  zmiana ma więcej niż jeden wątek — commit robisz sam. W repo, gdzie commit
  jest włączony: commituję sam w tej samej konwencji i podaję w raporcie hash
  oraz gałąź.

## Tablica (board-tracker)

- W repo z rejestru `tools/board-tracker/trackers.json` („Baza wiedzy", edu_saas, code-busters,
  code-busters-mobile) każda sesja, która coś zmienia, jest przypięta do issue przez skill
  `board-tracker`. Brief z hooka `SessionStart` mówi, co mam w toku i w gotowych.
- Praca rusza od razu. Na moje „tak” czeka tylko założenie issue, dopisanie mnie jako assignee,
  zamknięcie i każda zmiana statusu poza przejściem do „w toku” przy przypięciu.

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

- **Dziennika sesji nie prowadzimy** (od 2026-10-12). Podsumowanie stanu sesji
  robi wtyczka; `D:\Notatki\notatki\praca-z-claude.md` jest usunięty — nie
  zakładasz go ponownie i nie piszesz briefów do vaulta.
- Skill `podsumuj-sesja-claude` pisze wyłącznie do wiki (`.claude/wiki/` repo
  i `~/.claude/wiki/`).

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
proszę o wytłumaczenie — przy konflikcie wygrywają „Wyjaśnienia" (dotyczą sekcji
📄 TREŚĆ).

### Protokół odpowiedzi (BLUF)

Każda odpowiedź idzie w tym schemacie, wniosek albo pytanie zawsze na początku
(Bottom Line Up Front). Bez uprzejmości, bez wstępów („Przeanalizowałem
sytuację…"), bez powtarzania mojego pytania i bez podsumowań na końcu.

1. **`---` i `## <temat i intencja>`.** Linia odcina odpowiedź od poprzedniej
   wiadomości, nagłówek nazywa **temat i intencję** — np. „Tłumaczenie
   architektury aplikacji", „Pytania do specu onboardingu", „Raport z migracji
   bazy", „Propozycja: cache zapytań". Sam temat bez intencji („Architektura
   aplikacji") to za mało — z nagłówka ma wynikać, czy tłumaczysz, pytasz,
   raportujesz, czy proponujesz.
2. **`### 🎯 STATUS / DECYZJA`** — jedno zdanie: wynik, wniosek, „nie da się"
   albo konkretna decyzja, której ode mnie potrzebujesz. Zawsze, także w
   odpowiedzi jednozdaniowej.
3. **`### 📌 SEDNO (TL;DR)`** — 1–3 punkty, każdy w jednej linii: fakt albo
   wniosek, w tym zastrzeżenia i to, czego nie sprawdziłeś. Pomijasz, gdy 🎯
   mówi wszystko.
4. **`### 📄 TREŚĆ`** — tylko gdy prosiłem o treść, której nie da się zwinąć do
   sedna: wyjaśnienie, tabela z review, przegląd sesji. Obowiązują tu
   „Wyjaśnienia" i „Prezentacja kodu".
5. **`### ❓ PYTANIE I WARIANTY`** — tylko gdy potrzebujesz mojej decyzji, w
   formacie z „Decyzje: Recommendation-First".
6. **`<details><summary>Szczegóły…</summary> … </details>`** — dosłowne wyniki
   narzędzi, logi, pełne dane, lista zmienionych plików, propozycja commita.
   Kodu nie wklejasz także tutaj. Pomijasz, gdy nie ma czego włożyć.
7. **Marker `⏸ Czeka na decyzję: …`** — gdy tura czeka na mnie, zawsze w
   ostatniej linii, za `</details>`. Hub czyta marker wyłącznie z ostatniej
   linii.

Sekcję spoza punktów 1–2 pomijasz, gdy jest pusta — nie wypełniasz jej watą.

### Struktura treści

- **Domyślną formą jest lista punktowana.** Proza tylko wtedy, gdy treść jest
  jednym ciągiem myśli, którego rozbicie na punkty by go zepsuło. Ciąg zdań
  opisujących osobne rzeczy zawsze rozbijasz na punkty.
- **Tabela, gdy tylko się da.** Zawsze przy porównaniu ≥3 rzeczy wg ≥2 kryteriów,
  ale też przy listach plików ze zmianami, uwagach z review, wynikach testów,
  wariantach do wyboru — wszędzie, gdzie punkty mają powtarzalną strukturę.
  Listę punktowaną zostawiasz tam, gdzie punkty nie dzielą wspólnych kolumn.
- **Wewnątrz sekcji 📄 odcinasz bloki tematyczne linią `---`.** Ma być widać,
  gdzie kończy się jedna myśl, a zaczyna następna — bez wczytywania się w treść.

### Decyzje: Recommendation-First

- **Gdy potrzebujesz mojej decyzji, nigdy nie zadajesz pytania otwartego.**
  Dajesz konkretne warianty i swoją rekomendację.
- **Kolejność:** najpierw **Rekomendacja agenta** — który wariant i dlaczego,
  jedno zdanie; potem warianty `[A]`, `[B]`… — rekomendowany zawsze jako `[A]`;
  na końcu `[Domyślnie] Wpisz "OK", aby przejść do realizacji wariantu
  rekomendowanego.`
- **Wariant to konkretne działanie ze skutkiem.** Przy nieodwracalnym piszesz,
  czego nie da się cofnąć.
- **Kilka decyzji naraz numerujesz** `D1`, `D2`…; „OK" przyjmuje wszystkie
  rekomendacje, „D2 B" zmienia jedną.
- **W narzędziu do pytań** (AskUserQuestion) rekomendowana opcja idzie pierwsza,
  z dopiskiem „(Rekomendowane)".
- **„OK" to moja odpowiedź.** Cisza, timeout i „proceed using your best
  judgment" nie są „OK" — obowiązuje „Czekanie na moją odpowiedź".
- **Wyjątki od zakazu pytań otwartych:** pytania sprawdzające wiedzę (skill
  `nauka-z-claude`) i prośba o dane, których nie da się wyliczyć (ścieżka,
  nazwa, treść) — wtedy domysł, jeśli go masz, podajesz jako `[A]`.

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
- **Nie wyliczaj alternatyw** poza wariantami decyzji w sekcji ❓. Rekomendacja
  plus jedno zdanie o odrzuconej opcji tylko wtedy, gdy odrzucenie jest
  nieoczywiste.
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

Stały szkielet, w tej kolejności, osadzony w protokole: 🎯 to wynik zadania,
SEDNO to punkty 1, 3 i 5 (po jednej linii), a punkty 2 i 4 oraz propozycja
commita idą do `<details>`.

1. **Co zrobione** — jedno zdanie na wątek.
2. **Pliki** — po jednej linii na plik: `ścieżka:linia` i co się zmieniło.
3. **Weryfikacja** — uruchomiona komenda i jej wynik. Jeśli nie uruchomiłeś
   testów albo builda, piszesz wprost „nie zweryfikowane" i dlaczego. Brak tej
   linii oznacza, że coś przemilczałeś.
4. **Tablica** — `#N` i link do śladu w issue (skill `board-tracker`), albo „sesja bez
   przypięcia” (repo spoza rejestru albo sesja bez zmian).
5. **Następny krok** — a przy zatrzymaniu na review dodatkowo propozycja treści
   commita w Conventional Commits (patrz „Git").

<!-- BEGIN hub-global-rules -->
## Orchestrator hub

- **Gate marker.** A turn that ends waiting for Rafal's decision ends with the line

  ⏸ Czeka na decyzję: <one sentence>

- **Isolation.** A project session does not message another project session on its own
  initiative; the hub is the only channel between projects. Exception: Rafal asks for it
  explicitly in that session.
<!-- END hub-global-rules -->
