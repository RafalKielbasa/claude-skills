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

## Rozwiązanie
Pytaj `WebFetch` o fakty i krótkie cytaty, nigdy o pełną treść: wymień z nazwy
to, czego szukasz („jakie ma parametry", „zacytuj zdanie o limicie"), i poproś
o cytaty kluczowych zdań. Prompt „zwróć w całości / dosłownie / verbatim"
traktuj jak wywołanie, które na pewno wróci pusto.

Gdy naprawdę potrzebna jest cała treść pliku tekstowego, pobierz go poza
`WebFetch` (`curl` do pliku w scratchpadzie, potem odczyt) — wtedy limit
cytowania w ogóle nie wchodzi w grę.
