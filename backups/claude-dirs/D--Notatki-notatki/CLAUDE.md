# CLAUDE.md

Ten plik zawiera wskazówki dla Claude Code (claude.ai/code) do pracy w tym vaultcie.

## Czym jest ten vault

To osobista baza wiedzy w Obsidianie — nie projekt programistyczny. Nie ma tu builda, lintera, testów ani manifestu pakietów. Treść to pliki Markdown pisane po polsku: notatki z życia prywatnego i pracy.

## O mnie

- Rafał — programista JS/TS; w firmie odpowiadam też za zagadnienia DevOps.
- Buduję system wieloagentowy w n8n + kod.
- Kierunki rozwoju: DevOps, chmura, agenci AI.
- Prywatnie: mąż, ojciec dwójki dzieci, w trakcie budowy domu.
- Zainteresowania: sport, motoryzacja, budowa domu i ogrodu, podróże, gry komputerowe — na hobby mam mało czasu.
- Aktualne cele: dbanie o zdrowie i intensywny rozwój zawodowy.

## Do czego używam Claude

- Tworzenie i redagowanie notatek (np. z artykułów, dokumentacji, spotkań).
- Organizacja vaulta: struktura folderów, linkowanie, tagi.
- Wsparcie nauki: DevOps, chmura, agenci AI — streszczenia, plany nauki, notatki z nauki.
- Notatki prywatne: budowa domu, zdrowie, plany rodzinne.

## Zasady współpracy

- Proponuj ulepszenia (strukturę, linki, tagi, poprawki), ale pytaj o zgodę przed każdą zmianą w notatkach.
- Styl odpowiedzi zależny od tematu: zwięźle i konkretnie przy codziennych sprawach, z kontekstem i wyjaśnieniem „dlaczego" przy nauce nowych zagadnień.
- Odpowiadaj po polsku.

## Konwencje Obsidiana

- Linki wewnętrzne w składni Obsidiana `[[Wikilink]]`, nie w standardowym Markdownie.
- Nazwy plików i folderów w kebab-case (małe litery, myślniki): np. `nauka/tech/agenci-ai/`, `budowa-domu.md`. Wyjątek: notatki dziennika nazywane datą `RRRR-MM-DD.md`.
- Włączone pluginy podstawowe: Daily Notes, Templates, Canvas, Bases, Bookmarks, Backlinks, Outgoing Links, Outline, Properties.
- Włączone pluginy społeczności: Terminal, Show Hidden Files.
- Skille Claude Code mają zawsze angielskie nazwy w kebab-case (np. `start-day`, `tidy-journal`); ich treść i opisy są po polsku.

## Struktura vaulta

- Notatki dzienne `RRRR-MM-DD.md` leżą bezpośrednio w korzeniu vaulta (bez osobnego folderu) — brudnopis dnia wyłącznie na notatki: szybkie zapiski, które docelowo są porządkowane i rozdzielane do folderów tematycznych (skill `tidy-journal`), a przetworzone oryginały trafiają do `archiwum/`. Zadań nie zapisujemy w dzienniku — ich miejsce to `zadania.md`.
- `zadania.md` — centralna lista zadań, jedyne źródło prawdy. Trzy warstwy jedna nad drugą: opisowy blok `start dnia` (analiza wczoraj + sugestia na dziś, nadpisywany codziennie), sekcja `## na dziś` (zadania świadomie wybrane na bieżący dzień) i sekcja `## backlog` (cała reszta). Obie sekcje zadań dzielą się na podsekcje kontekstów (`### praca`, `### dom`, `### nauka`, `### prywatne`); wszystkie cztery zostają zawsze w obu sekcjach, także puste. Zadanie istnieje w dokładnie jednym miejscu — `na dziś`, `backlog` albo archiwum; nowe dopisuje się domyślnie do backlogu, a sekcję „na dziś" kuruje ręcznie użytkownik (skill nie przenosi zadań między warstwami). Obsługiwane głównie przez skill `start-day`.
- `nauka-z-claude.md` — żywy plik postępu nauki prowadzonej skillem `nauka-z-claude`: sekcja na temat z roadmapą, powtórkami interwałowymi i notatkami. Tematów w trakcie nie ruszamy poza tym skillem; temat z ukończoną roadmapą destyluje do bazy wiedzy i archiwizuje skill `tidy-journal` (w żywym pliku zostaje kikut z aktywnymi powtórkami, aż się utrwalą). Na końcu pliku żyje sekcja `## Powtórki z notatek` — pozycje powtórek dla notatek wiedzowych z `nauka/tech/` (bez hubów; pozostałe gałęzie `nauka/` są poza rotacją), rejestrowane przez `tidy-journal` przy każdym utworzeniu lub dopisaniu notatki i przepytywane przez `nauka-z-claude`. To drugie źródło powtórek obok pozycji tematycznych. Trzecim jest sekcja `## Koncepty do poznania` (przed `## Powtórki z notatek`) — rejestr osi wiedzy leżących warstwę poniżej tematów, wraz z podsekcją `### Powtórki fundamentów`. Wpisy zakłada tryb „pytania" po teście fundamentu albo tryb „wyjaśnij", jedyny tryb tego skilla, w którym Claude wykłada; wchodzi wyłącznie na jawne `/nauka-z-claude wyjaśnij <koncept>`. Wszystkie trzy pule przepytuje jedna sesja powtórek, w kolejności fundamenty → tematyczne → notatki.
- `archiwum/` — wszystkie archiwa vaulta, płasko: przetworzone notatki dzienne (`RRRR-MM-DD.md`), `zadania-archiwum.md` (ukończone zadania z datami wykonania, grupowane po miesiącach), `nauka-z-claude.md` (ukończone tematy nauki jako sekcje `## <Temat>`) oraz podfolder `notion/` (stary import). Treści archiwalnej nie edytujemy — tylko dopisujemy przy archiwizacji.
- `praca/` — notatki zawodowe: `projekty/` (folder na projekt: `praca/projekty/<projekt>/` z dwiema notatkami utrzymywanymi skillem `sync-project` — notatką stanu `<projekt>.md` z frontmatterem `sciezka:` wskazującym repo na dysku i sekcjami podsumowanie stanu / postępy / planowane prace, oraz dokumentacją techniczną `<projekt>-dokumentacja.md`; repo czytamy, nigdy nie zapisujemy) i `spotkania/`.
- `nauka/` — nauka i rozwój: `tech/` (wiedza techniczna: `agenci-ai/`, `chmura/` m.in. `google-cloud/`, `devops/`, `linux/`, `programowanie/` — tylko ta gałąź podlega powtórkom z notatek), `biznes/`, `jezyki/`, `czytelnia/`.
- `dom/` — budowa domu i ogrodu.
- `zdrowie/` — zdrowie i aktywność fizyczna.
- `szablony/` — szablony notatek (folder pluginu Templates): `dziennik.md` (notatka dzienna), `notatka-wiedzowa.md` (notatka atomowa), `hub.md` (notatka spinająca notatki atomowe folderu), `spotkanie.md` (notatka ze spotkania w `praca/spotkania/`).
- `.claude/` — konfiguracja Claude Code: `CLAUDE.md`, `skills/` (`SKILL.md` ma każdy skill; `PURPOSE.md` z jego pochodzeniem przybywa stopniowo, przy pierwszej zmianie wprowadzanej skillem `evolve-skill`), `specs/` i `plans/`, oraz `wiki/` — wzorce z pracy z Claude (`patterns/`), indeks, log ewolucji i rejestr prób zmian skilli. To stan narzędzia, nie treść wiedzowa: notatki wiedzowe nie linkują do wiki, a `tidy-journal` go nie dotyka.
- `eksport/` — pliki wygenerowane skillem `compile-notes`: wersjonowane kompilacje notatek z folderu (`<slug>-notebooklm-v<N>.md` — v1 pełna, kolejne przyrostowe, tylko notatki nowe i zmienione, np. pod NotebookLM) oraz manifesty `.manifest.json` z hashami śledzącymi zmiany. To pochodne, regenerowalne artefakty, nie treść wiedzowa — nie podlegają konwencji hub + notatka atomowa.
- `.obsidian/` — konfiguracja aplikacji Obsidian (pluginy, layout, wygląd). To stan aplikacji, nie treść vaulta — nie edytuj, chyba że użytkownik prosi o zmianę ustawień Obsidiana.
- Nowe foldery tematyczne dokładamy dopiero, gdy pojawiają się notatki z nowego obszaru — ustalaj to z użytkownikiem, zamiast zakładać własny system.

## Notatki wiedzowe

- Cel notatki: uczyć zagadnienia (nauka i powtórki) oraz łączyć się z resztą wiedzy w vaultcie (second brain). To kryterium każdej decyzji redakcyjnej.
- Ziarno: jedna notatka = jedno spójne zagadnienie (np. `cloud-storage` razem z klasami składowania i Autoclass), nie mikro-koncept ani mechaniczne „jedna lekcja kursu = jedna notatka". Szablon: `szablony/notatka-wiedzowa.md` (sekcje: Podsumowanie, Szczegóły, Powiązane). Rozrośniętą notatkę dzielimy tylko ręcznie, po sygnale w raporcie skilla. W `praca/projekty/` obowiązuje konwencja projektowa: dokładnie dwie notatki na projekt (stan + dokumentacja techniczna), generowane skillem `sync-project`.
- Styl Szczegółów mieszany: krótka narracja tam, gdzie trzeba zrozumieć „dlaczego" i jak elementy współgrają; listy punktowane do wyliczeń (klasy, opcje, kroki); bloki kodu dla komend i konfiguracji. Terminy branżowe zostają po angielsku.
- Wzbogacaj własną wiedzą tylko, gdy treść jest niekompletna (gołe hasło, luka uniemożliwiająca zrozumienie) albo zawiera nieścisłość/błąd — wtedy uzupełnij lub sprostuj, wyraźnie oznaczając sprostowanie w propozycji zmiany. Kompletnych treści nie dopychaj. Przy niepewności nie zgaduj — oznacz `?` i zapytaj.
- Linkowanie: temat mający już notatkę (również w innym folderze) staje się wikilinkiem inline w Szczegółach; sekcja Powiązane służy szerszym kontekstom i powiązaniom niewystępującym w treści. Każdy folder liściowy w `nauka/` ma notatkę-hub o nazwie folderu (np. `nauka/tech/devops/devops.md`) wg `szablony/hub.md`, spinającą linki do notatek atomowych w tym folderze.
- Bez pól źródeł we frontmatterze i bez sekcji pytań kontrolnych — notatka to czysta treść.
- Typy treści: powyższe reguły w pełni dotyczą wiedzy technicznej. Lżej prowadzimy: słówka językowe (`#nauka/jezyki`) — wyłącznie dopisanie wierszy do tabeli w `nauka/jezyki/slowka-angielski.md` z polskim tłumaczeniem (uzupełnij, gdy w zapisku go brak); książki (`nauka/czytelnia/`) — jedna notatka na książkę (nazwa od tytułu), przemyślenia i techniki z lektury zapisywane wiernie, bez weryfikowania tez autora i bez własnych interpretacji, ale gołe hasło techniki (np. „intencja paradoksalna") dostaje 1–2 zdania wyjaśnienia; dom i zdrowie (`dom/`, `zdrowie/`) — zwięzły zapis faktów i decyzji, bez rozbudowy i bez weryfikacji.
- Powstają głównie przez skill `tidy-journal`, który rozlokowuje wpisy z dziennika wg powyższych zasad, scalając treść (nie doklejając płaskiej listy dat) i aktualizując huby.
