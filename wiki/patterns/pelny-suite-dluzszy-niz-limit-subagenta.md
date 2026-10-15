# pelny-suite-dluzszy-niz-limit-subagenta

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis
Szablon implementera każe uruchomić pełny suite przed commitem. Gdy suite trwa dłużej niż limit
pierwszoplanowego wywołania Bash (domyślnie 120 s, maks. 600 s), implementer albo przerywa po limicie,
albo czeka do 10 minut i oddaje „full suite not run”, a zadanie kosztuje kilka razy więcej czasu.

## Przyczyna źródłowa
Kontroler nie zna czasu suite'u przed pierwszym dispatchem, a dispatch nie mówi, co implementer ma
uruchomić. Subagent nie ma wygodnego sposobu, żeby poczekać na komendę w tle dłużej niż limit.

## Dowody
- 2026-10-15, sesja ad16420c-5965-4484-a54d-32148a48f6ea (id claude.ai niedostępny), repo Baza wiedzy,
  plan `switch_tab` w tools/nagrywanie: implementer Taska 2 „full `npx vitest run` exceeded the 120 s
  timeout”; implementer Taska 3 pracował 688 s, raport „the full `npx vitest run` did not finish in
  10 min”. Pomiar kontrolera w tle: 635–694 s na pełny suite (42–47 plików, testy Chrome). Od Taska 4
  dispatch: „run only the test files the brief names”, pełny suite kontroler odpala sam w tle
  z `timeout 2400`.

## Rozwiązanie
Przed pierwszym dispatchem zmierz czas pełnego suite'u (albo weź go z poprzedniej sesji). Gdy przekracza
~5 minut: w dispatchu „run only the test files the brief names; the controller runs the full suite”,
a pełny suite kontroler odpala w tle po zadaniach, które dotykają współdzielonego kodu, i przed końcowym
raportem.
