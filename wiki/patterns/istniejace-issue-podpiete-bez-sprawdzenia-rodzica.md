# istniejace-issue-podpiete-bez-sprawdzenia-rodzica

- **Skill:** github-tickets
- **Typ:** porażka
- **Status:** otwarty

## Opis
Podział na gate 1 zaproponował podpięcie istniejących issues pod nowy epik jako podzadania, nie
sprawdzając, czy mają już rodzica. GitHub pozwala na jednego rodzica, więc „podpięcie” to w
praktyce przeniesienie z innego epiku, czyli decyzja, której gate 1 nie pokazał.

## Przyczyna źródłowa
Krok 1 skilla zbiera numery, epiki i etykiety, ale nie relacje rodzic–dziecko istniejących issues.
Tabela podziału ma kolumnę „Epic” tylko dla nowych ticketów.

## Dowody
- 2026-10-25, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf): epik #741 w `devstock-org/devstock-team`; gate 1 („ok”) obejmował „podpięte #650 i #651”. Dopiero przy pisaniu draftów `GET …/issues/650/parent` pokazał rodzica #528 „Płatności subskrypcyjne kodozercy” (tak samo #651). Rafał przerwał i zdecydował „zmień rodzica”; przy wysyłce poszło `replace_parent=true`.

## Rozwiązanie
W kroku 1 dla każdego istniejącego issue, które podział podpina pod epik, odczytaj
`gh api repos/<owner>/<repo>/issues/<n>/parent` (404 = brak rodzica). W tabeli gate 1 pokaż obecnego
rodzica w kolumnie „Epic” jako „#<stary> → #<nowy>”. Przeniesienie (`replace_parent=true`) wykonuj
tylko, gdy użytkownik zatwierdził je wprost.
