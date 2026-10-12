# opcje-z-tego-co-mierzalne-nie-z-celu

- **Skill:** superpowers:brainstorming
- **Typ:** porażka
- **Status:** otwarty

## Opis
Pytanie o cel pracy dostaje zestaw opcji zbudowany z tego, co Claude zdążył
zmierzyć w artefakcie, a nie z hipotez o tym, co użytkownikowi przeszkadza.
Użytkownik odrzuca wszystkie warianty i wpisuje własny.

## Przyczyna źródłowa
Krok „zbadaj kontekst projektu” poprzedza krok „zapytaj o cel”, więc w chwili
formułowania opcji Claude ma w ręku wyłącznie metryki: rozmiar, kolejność,
niespójne nazwy, powtórzenia. Metryki opisują formę artefaktu. Ból użytkownika
bywa po stronie treści — czy to, co tam stoi, jest jeszcze prawdą — a tego
z inspekcji struktury nie widać, bo wymaga wiedzy spoza pliku.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: na prośbę „chcę zrobić
  w nim porządek” Claude zbadał `praca-z-claude.md` i zaproponował cztery opcje
  celu: „nie widzę, co wisi”, „plik za duży”, „nie da się nawigować”, „chcę to
  zautomatyzować”. Rafał odrzucił wszystkie i wpisał własną: „Wiele notatek nie
  ma już sensu, implementacja była zakończona lub się zdezaktualizowały”.
  Nieaktualność treści nie występowała w żadnej z czterech opcji, mimo że
  diagnoza struktury była trafna i została później w całości potwierdzona.
- 2026-10-12, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny): to the question why the
  recording automation cannot do everything on a course-only account, Claude offered "Etap 1 teraz / Etap 1 i 2
  / Zostaje jak jest", built from the list of the tool's current guards. Rafał rejected the question and stated
  his own goal: "Chciałbym, żeby to było konfigurowane per kurs, poziom autonomii". The options described the
  tool's restrictions, not the policy he wanted; brainstorming was not invoked before the options.

## Rozwiązanie
Pierwsze pytanie o cel zadawaj otwarte albo z co najmniej jedną opcją nazywającą
aktualność i trafność treści, nie tylko jej formę. Gdy opcje powstają po
inspekcji artefaktu, sprawdź, czy któraś mówi o tym, czego z artefaktu nie
widać — jeśli żadna, zestaw opisuje twoje pomiary, nie cudzy problem.
