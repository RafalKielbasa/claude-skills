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

## Rozwiązanie
W self-review planu, dla każdej reguły specu z warunkami („gdy", „tylko", „wszystkie", „i"),
postaw obok siebie cytat ze specu i odpowiadające mu zdanie planu i porównaj listy warunków
element po elemencie. To samo pytanie dopisz do promptu niezależnego review planu.
