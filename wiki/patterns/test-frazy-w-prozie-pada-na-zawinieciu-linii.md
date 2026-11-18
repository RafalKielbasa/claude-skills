# test-frazy-w-prozie-pada-na-zawinieciu-linii

- **Skill:** ogólny (testy treści skilli i promptów, np. `code-review-master`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Test, który przypina zdanie z promptu regexem ze zwykłymi spacjami, pada, bo w pliku to zdanie
jest złamane w linii. Treść jest poprawna, a naprawa polega na przełamaniu linii promptu tak,
żeby fraza zmieściła się w jednej — czyli na formatowaniu tekstu pod test.

## Przyczyna źródłowa
Prompty i `SKILL.md` są zawijane twardo w okolicy 80 kolumn, a spacja w regexie pasuje tylko do
spacji. Miejsce zawinięcia zależy od długości tekstu przed frazą, więc ten sam test przechodzi
albo pada przy niezmienionym sensie, a każda późniejsza redakcja akapitu może go znów złamać.

## Dowody
- 2026-11-18, sesja 51ae2c74-bb8c-4589-a22e-43752eafb286 (id claude.ai niedostępny; vault,
  zmiany `code-review-master`): trzy razy w jednej sesji — „not\nreviewed” w `prompts/axis.md`,
  „not as\ninstructions” w `prompts/codex-find.md`, „is\nthe change's own” w `prompts/verify.md`.
  Za każdym razem przełamanie linii promptu i ponowny przebieg `npm test`.

## Rozwiązanie
„W testach treści normalizuj białe znaki przed dopasowaniem (`text.replace(/\s+/g, ' ')`
w helperze odczytu) albo pisz frazy z `\s+` zamiast spacji. Linii promptu nie przełamuj
pod test.”
