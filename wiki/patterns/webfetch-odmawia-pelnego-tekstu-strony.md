# webfetch-odmawia-pelnego-tekstu-strony

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Prośba „zwróć pełny tekst tej strony dosłownie" skierowana do `WebFetch` wraca
nie treścią, tylko wyjaśnieniem, że polecenie kłóci się z limitem długości
cytatu. Tura przepada, a strona wciąż jest nieprzeczytana.

## Przyczyna źródłowa
`WebFetch` odpowiada na prompt małym modelem, który ma własne ograniczenie
długości cytowanego fragmentu. Polecenie „w całości, dosłownie" jest z tym
ograniczeniem wprost sprzeczne, więc model rozstrzyga konflikt na rzecz limitu
i pisze o konflikcie zamiast pobrać treść. Pokusa jest naturalna przy surowych
plikach (`raw.githubusercontent.com`, `.md`), które wyglądają jak zwykły plik do
odczytania, a nie jak strona do streszczenia.

## Dowody
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: research do lekcji kursu.
  `WebFetch` na `raw.githubusercontent.com/n8n-io/n8n-docs/.../tools-agent.md`
  z promptem „Return the full text of this page verbatim" wrócił odpowiedzią
  „you've asked me to return the full page verbatim (...) These instructions
  are in direct conflict with each other" i propozycją streszczenia. Ta sama
  strona pobrana wcześniej z pytaniem o konkretne parametry („what parameters
  it has, what sub-nodes it requires, quote key sentences") dała komplet
  potrzebnych cytatów za pierwszym razem.
- 2026-09-11, sesja session_01M1roR3MszbAgi1a1AE3xqh: **kontrprzykład**, ten sam
  prompt i ta sama domena, wynik odwrotny. `WebFetch` na
  `raw.githubusercontent.com/n8n-io/n8n-docs/main/docs/build/integrate-ai/ai-examples/use-ai-for-parameters.md`
  z promptem „Return the raw markdown content of this page verbatim" zwrócił
  całą stronę: nagłówki, oba warianty mechanizmu, pełną tabelę czterech
  parametrów `$fromAI()` z opisami co do słowa i wszystkie przykłady kodu.
  To była jedyna droga do tej treści - wersja HTML na `docs.n8n.io` wracała
  streszczeniem, a stary adres 404. Tego samego dnia ten sam prompt na innym
  pliku (`.../n8n-nodes-base.gmail.md`) zwrócił `HTTP 404 Not Found`, czyli
  porażkę ze ścieżki, nie z limitu cytowania. Wniosek: „verbatim wróci pusto"
  nie jest regułą pewną - bywa, że wraca komplet.

## Rozwiązanie
Pytaj `WebFetch` o fakty i krótkie cytaty, nigdy o pełną treść: wymień z nazwy
to, czego szukasz („jakie ma parametry", „zacytuj zdanie o limicie"), i poproś
o cytaty kluczowych zdań. Prompt „zwróć w całości / dosłownie / verbatim"
traktuj jak wywołanie, które na pewno wróci pusto.

Gdy naprawdę potrzebna jest cała treść pliku tekstowego, pobierz go poza
`WebFetch` (`curl` do pliku w scratchpadzie, potem odczyt) — wtedy limit
cytowania w ogóle nie wchodzi w grę.

**Korekta po kontrprzykładzie (2026-09-11).** Reguła „verbatim zawsze wraca
pusto" jest za mocna. Rozstrzyga rozmiar i kształt strony, nie samo słowo
„verbatim": surowy plik `.md` mieszczący się w limicie cytowania potrafi wrócić
w całości, a strona HTML z nawigacją, stopką i reklamą - nie. Praktyczna
kolejność jest więc taka: pytaj o konkretne fakty i cytaty, gdy strona jest
duża albo gdy chodzi o jedno zdanie; przy surowym pliku dokumentacji z repo,
z którego potrzebujesz kompletu tabel i przykładów, spróbuj raz o pełną treść,
a odpowiedź „to kłóci się z limitem cytatu" traktuj jak sygnał, żeby przejść
na pytania szczegółowe albo pobrać plik poza `WebFetch`. Odpowiedź
`HTTP 404 Not Found` to inna porażka - błąd ścieżki, nie limitu.
