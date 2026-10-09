# porownanie-z-latana-kopia-zamiast-swiezego-odczytu

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis
Implementer ma porównać stan produkcji (wersja robocza n8n) z eksportem w repo.
Zamiast przepisać świeżą odpowiedź `get_workflow_details` do pliku, łata
poprzednią kopię o zmiany, które sam właśnie wysłał. Porównanie wypisuje `OK`,
ale jest kołowe: sprawdza łatkę wobec eksportu, z którego ją wyprowadzono, a
nie to, co faktycznie zapisał serwer.

## Przyczyna źródłowa
Krok planu każe przepisać 20–25 KB odpowiedzi MCP do pliku. Wynik MCP przychodzi
do kontekstu inline i nie da się go skierować prosto do pliku. Łatka poprzedniej
kopii kosztuje kilka linii i daje ten sam komunikat `OK`, więc implementer
wybiera tańszą drogę i zgłasza ją co najwyżej jako „deviation”. Wartości
wysłane wcześniej ręcznie (np. długi prompt agenta) pozostają wtedy
niezweryfikowane.

## Dowody
- 2026-10-09, sesja ece85169-32f2-44b7-9695-689c071f34ce (id claude.ai
  niedostępny), raport tygodniowy `29` w n8n:
  - Runda poprawek Taska 3: `29-draft.json` „was hand-edited, not re-copied”.
    Kontroler zlecił przegląd zakresowy na żywej wersji roboczej.
  - Task 7: „I did not rewrite HELPERS/29-draft.json from scratch. I patched
    the previous file with a script”. Tymczasem prompt agenta wysłał wcześniej
    kontroler ręcznie, poza eksportem.
  - Osobny recenzent przepisał świeżą odpowiedź do `29-draft-live.json` i
    dostał `OK` przy pierwszym przebiegu. Dla `31` to samo zrobiono od razu
    przez recenzenta.

## Rozwiązanie
Porównanie „prod ↔ repo” zawsze na świeżo przepisanej odpowiedzi serwera, nigdy
na łatce poprzedniej kopii; w kroku planu napisać to wprost („nie edytuj
poprzedniej kopii — przepisz odpowiedź z tego wywołania”). Gdy implementer
zgłasza łatkę jako odstępstwo, kontroler nie zamyka zadania, tylko zleca
osobnemu recenzentowi świeży odczyt i porównanie. Tak samo przy wartościach
wysłanych ręcznie poza eksportem — te weryfikuje wyłącznie świeży odczyt.
