# kontrola-lektora-wycisza-poczatek-fonetycznej-nazwy

- **Skill:** kurs-video (krok 4b, kontrola lektora w trybie biletu)
- **Typ:** porażka
- **Status:** otwarty

## Opis
`kontrola-lektora --decyzje` proponuje wyciszenie słowa „dodanego” przez lektora. Tym słowem jest jednak początek poprawnie wymówionej nazwy z zapisem fonetycznym. W trybie biletu `--zastosuj` wpisuje wyciszenia do EDL bez bramki, więc film straciłby początek nazwy.

## Przyczyna źródłowa
Kontrola porównuje zapis rozpoznania mowy ze scenariuszem przez równoważności z `kursy/<slug>/wymowa.md`. Rozpoznanie (scribe_v2) zapisuje wymówione „en osiem en” jako „EN8N” albo rozbite na „EN” i „8N”. Brak pary dla takiego zapisu sprawia, że pierwszy token wygląda na słowo spoza scenariusza.

## Dowody
- 2026-11-03, sesja e1d033e0-b255-476e-aac9-b2900ad7d9a9 (id claude.ai niedostępny), lekcja agenty-ai 3.2:
  - `--decyzje` proponowało 3 wyciszenia „EN”.
  - Odsłuch zapisu pokazał rozbite „en osiem en”.
  - Dopisałem w `wymowa.md` wiersz tylko dla kontroli: `n8n` ↔ `EN8N` / `EN 8N`, zaznaczony „nie do scenariusza”.
  - Po ponownym `--decyzje`: 0 wyciszeń.
  - Wiersz wszedł do cudzego commitu `e6762379`, bo `wymowa.md` miał niezacommitowane zmiany sesji 3.3.

## Rozwiązanie
Do kroku 4b `kurs-video`: „Przed `--zastosuj` sprawdź każde proponowane wyciszenie z sąsiednim słowem scenariusza. Wyciszenie na początku albo na końcu nazwy z `wymowa.md` oznacza brak równoważności, a nie słowo dodane przez lektora. Dopisz do `wymowa.md` wiersz tylko dla kontroli (zapis rozpoznania ↔ nazwa) i powtórz `--decyzje`.”
