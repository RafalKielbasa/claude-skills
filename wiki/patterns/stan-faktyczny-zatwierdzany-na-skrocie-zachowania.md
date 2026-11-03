# stan-faktyczny-zatwierdzany-na-skrocie-zachowania

- **Skill:** ogólny (protokół decyzji)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Wariant „zatwierdzić stan faktyczny” opisuje działanie kodu skrótem wyniku („Premium 10”), a kod daje
coś węższego: opcję, którą użytkownik musi sam odblokować i wybrać. Rafał zatwierdza „taki jaki jest”
na podstawie skrótu. Różnica wychodzi dopiero w jego pytaniu po zamknięciu issue i kosztuje dwa
przepisania zapisu decyzji.

## Przyczyna źródłowa
Weryfikacja szła od blokady, czyli od tego, co jest zamknięte dla kogo (`isLocked`, `premium: true`).
Nie szła ścieżką każdej roli od zera, czyli od tego, co rola dostaje bez żadnej akcji (domyślny cel 3,
którego subskrypcja nie zmienia). Tabela z mechanizmem stała w 📄. Natomiast 🎯 i treść wariantu, na
podstawie których Rafał decyduje, przełożyły blokadę na język korzyści: na to, co obiecują teksty
aplikacji, a nie na to, co robi kod.

## Dowody
- 2026-11-03, sesja 1bb3295d-0143-449c-a32a-2455751c1556 (id claude.ai niedostępny), DT-80 #814:
  - 🎯 brzmiało „za darmo do 5 zadań dziennych, 10 w Premium”, a wariant [A]: „darmowo 3 albo 5
    (do wyboru), Premium 10”. Tabela w 📄 mówiła tymczasem, że `goal-card-list.tsx:35` „blokuje tylko
    kafelek wyboru celu”.
  - Rafał: „Zatwierdzamy limit dzienny taki jaki jest”. Po raporcie zamknięcia („subskrybent nie będzie
    mógł wybrać 10”) zapytał: „Czy na subskrypcji automatycznie nie będzie więcej zadań? tak to powinno
    działać”.
  - Dopiero wtedy sprawdziłem ścieżkę subskrybenta. `use-daily-goals.ts:35` daje `dailyTaskGoal ?? 3`,
    a `:73-78` przekazuje poziom subskrypcji tylko jako etykietę. Tymczasem tekst „Odblokuj 10 zadań
    dziennie” (`daily-goals-screen.tsx:171`) obiecuje, że 10 zadań przyjdzie samo.
  - Skutek: zapis decyzji przepisany dwa razy (`cb1c79ba`, `82afc6ad`), ślad w #814 edytowany dwa razy.

## Rozwiązanie
Gdy wariant prosi o zatwierdzenie istniejącego zachowania (dostęp, limit, cena), opisz je w treści
wariantu osobno dla każdej roli, od zera:
- co rola dostaje bez żadnej akcji, z wartością domyślną;
- co może zmienić sama i gdzie.

Słowa „ma” i „dostaje” zostaw dla tego, co dzieje się samo. Opcję do odblokowania nazywaj „może
wybrać”. Porównaj ten opis z tekstami, które produkt pokazuje użytkownikowi, a rozjazd wpisz do treści
wariantu, nie do 📄.
