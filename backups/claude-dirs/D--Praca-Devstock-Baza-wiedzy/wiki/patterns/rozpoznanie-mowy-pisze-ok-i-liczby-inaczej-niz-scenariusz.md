# rozpoznanie-mowy-pisze-ok-i-liczby-inaczej-niz-scenariusz

- **Skill:** kurs-video (step 4b, `kontrola-lektora --decyzje`), kurs-lekcja and kurs-montaz (`video/plansze.yaml` phrases)
- **Typ:** porażka
- **Status:** otwarty

## Opis
ElevenLabs speech-to-text writes some words in a different form than the scenario, even when the narrator says them
correctly: "OK" becomes "Okej", a number written as words becomes digits ("Ogrodnika dwadzieścia cztery" becomes
"Ogrodnika24"), and a case ending can come out with a different diacritic ("niedziele?" heard as "niedzielę?"). Two
tools compare the scenario with that transcript word for word, so both fail on the same pairs: the narrator check
marks them for regeneration, and the board phrase search does not find the phrase.

## Przyczyna źródłowa
`tools/course-pipeline/src/kontrola-lektora.js` takes its only list of equivalent forms from the course's
`wymowa.md` (`parsujWymowe`, `zastosujRownowaznosci`), and `normalizuj` only lowercases and strips punctuation. It
has no digit-to-word or "OK"/"Okej" equivalence, so a normalization looks the same as a real generator artifact.
The `--decyzje` mode then says "regeneracja: potrzebna (N)", and the ticket procedure spends its only
`tts_regenerations` on it. The new audio is transcribed the same way, so every candidate comes back as "powtórzone".
The `plansze.yaml` rule lists names and number words as forbidden in phrases, but it does not list "OK".

## Dowody
- 2026-11-03, session 8e329826-e681-498d-a1e3-e48dd7c84bc0 (claude.ai id not available; agenty-ai lesson 3.3, #847):
  `kontrola-lektora --decyzje` returned "Wyciszenia: 0; regeneracja: potrzebna (11); do karty: 5". 10 of the 11
  were normalizations: "Ogrodnika dwadzieścia cztery" as "Ogrodnika24" (3 words × 2 places) and "OK" as "Okej"
  (4 places). The eleventh was "niedziele?" heard as "niedzielę?", the only one that could be a real artifact. I spent
  the ticket's 1/1 regeneration on them (a full V4 chain, about 13,600 characters). After it,
  `video/audio/kontrola/decyzje.json` sent all 11 to the card as "podejrzenie powtórzone po regeneracji", because the
  same pairs came back. In the same lesson, the montage refused the board
  `blad-zamiast-odpowiedzi`: its `do` phrase "OK, i tu jest pierwsze" did not match the STT "Okej". The phrase became
  "i tu jest pierwsze", with a comment in `plansze.yaml`.

## Rozwiązanie
For kurs-video step 4b in a lesson with a ticket: before `--regeneruj-lektora`, read the candidates in
`video/audio/kontrola/decyzje.json`. If every candidate is a pair whose heard form is the digit or "Okej" spelling of
the scenario form, or differs from it by one diacritic, do not regenerate. Those candidates go to the card, and the
regeneration stays in the ticket. For `plansze.yaml` phrases (kurs-lekcja and kurs-montaz): avoid "OK"/"okej" and
numbers in any form, just as names are avoided. Durable fix in the tool: equivalences in `kontrola-lektora.js` for
"OK"↔"okej" and for number words ↔ digits glued to a name.
