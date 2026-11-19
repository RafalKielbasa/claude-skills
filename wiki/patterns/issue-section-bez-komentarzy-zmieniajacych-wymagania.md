# issue-section-bez-komentarzy-zmieniajacych-wymagania

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
Opiekun zadania doprecyzowuje wymaganie w komentarzu pod issue (np. jak ma wyglądać stan
pusty), a przegląd ocenia PR według samej treści issue i Figmy. Różnicy względem komentarza
nikt nie zgłasza albo sesja znajduje ją przypadkiem.

## Przyczyna źródłowa
`crm plan` pobiera issue jako `number,title,body,url`; `issueSection` niesie tylko `body`.
Komentarze issue — także te od właściciela repo, które zmieniają zakres — nie trafiają ani do
osi `issue-conformance`, ani do Kroku 4b (Figma), ani do weryfikatora.

## Dowody
- 2026-11-13, sesja niedostępna (saas app, PR #213, pamięć projektu
  `code-review-master-config-2026-09-07`): „Niezgłoszone: komentarz Rafała w #182 z 02.11 mówi
  »karta pustego kursu bez własnego przycisku«, a `empty-course.tsx:29` go ma”.
- 2026-11-19, sesja 9273a288-9ea2-4ef5-8c9a-2ddbe8af2dff (id claude.ai niedostępny; saas app,
  PR #213, run `20261119-123337-yj2y`): ten sam komentarz („karta z przerywaną obwódką i tekstem
  zachęty, bez własnego przycisku — sekcję dodaje się formularzem nad nią”) przeczytany ręcznie
  przez `gh issue view 182 --json comments` przy porównaniu z węzłem 259-389; kod ma przycisk
  i formularz pod kartą. Żadna oś go nie znała. Rafał zdecydował (D3 A) nie podnosić, bo review
  13.11 dopuściło zmianę etykiety — decyzja możliwa tylko dlatego, że sesja sama doczytała komentarz.

## Rozwiązanie
W `crm plan` pobierać też `comments` issue i dołączać do `issueSection` komentarze autora issue
i właścicieli repo (z datą i autorem) pod nagłówkiem „Doprecyzowania w komentarzach”, z regułą
dla `issue-conformance`: późniejszy komentarz opiekuna zmienia wymaganie z treści. Komentarze
autora PR-a zostają poza sekcją (to argumenty, nie wymagania). Krok 4b: czytać te doprecyzowania
przed porównaniem z Figmą.
