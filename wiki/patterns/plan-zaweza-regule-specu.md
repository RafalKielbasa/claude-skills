# plan-zaweza-regule-specu

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan przepisuje regułę specu własnymi słowami pod docelowy plik i gubi warunek. Review planu
względem specu tego nie łapie, bo sprawdza pokrycie sekcji, nie listę warunków reguły; defekt
wychodzi dopiero w final review albo w użyciu.

## Przyczyna źródłowa
Przy przenoszeniu reguły do tekstu skilla albo kodu warunki złożone („gdy istnieją A, B i C")
upraszczają się do najbardziej widocznego („gdy istnieje A"). Self-review „spec coverage" pyta,
czy sekcja ma zadanie, a nie, czy zadanie niesie wszystkie warunki.

## Dowody
- 2026-10-08, sesja 8d719440 (id claude.ai niedostępny), repo Baza wiedzy: spec §9 —
  powrót do bramki `/daily`, gdy katalog ma `notatka.md`, `wpisy.yaml` i `zadania.yaml`; plan
  (Task 2, Step 4) i skill — „If `notatka.md` already exists". Codex review planu względem specu
  tego nie zgłosił; final review (opus) tak, a RED g1 potwierdził: przerwany krok 6 bez
  `zadania.yaml` dawał bramkę bez zadań. Naprawione w `ea378033`.
- 2026-10-19, sesja e81e95d7-be5a-457d-884b-77d8d63c4251 (id claude.ai niedostępny), plan 1 biblioteki komponentów Kodożerców: spec
  §4.1 miał paletę grupowaną z aliasem `{palette.<group>.<name>}` i synchronizację źródłowego
  `pixel.json` do mobile; plan (zadania 2, 5, 7) użył płaskiej palety `{palette.<name>}` i synchronizacji
  wygenerowanego `pixel-icons.js`, bez poprawki specu. Tym razem złapał codex (dwie uwagi „Wysoki”:
  sprzeczność ze specem); spec poprawiony z datą. Nowe: plan upraszcza decyzję projektową specu (kształt
  danych), nie tylko warunek reguły.
- 2026-10-22, sesja session_01UTQuE3EwUpLuJMEs83YJwD (lokalnie 362d75a8-47e4-4b51-a94a-5c747a21b5c6), plan W1 migracji Kodożerców (Task 3, harness bramek): spec §6.5 każe WCAG 2.2 AA w obu motywach, więc 3:1 dla dużego tekstu; plan dał płaskie „below 4.5 (text)”. Złapał recenzent zadania (oznaczone plan-mandated), nie review planu; ruling R12 przywrócił 3:1 dla dużego tekstu. Bez tego każdy arkusz bramki flagowałby własny token biblioteki `accent-ink-lg`, zatwierdzony w testach tokenów właśnie na 3:1.

## Rozwiązanie
W self-review planu, dla każdej reguły specu z warunkami („gdy", „tylko", „wszystkie", „i"),
postaw obok siebie cytat ze specu i odpowiadające mu zdanie planu i porównaj listy warunków
element po elemencie. To samo pytanie dopisz do promptu niezależnego review planu.
