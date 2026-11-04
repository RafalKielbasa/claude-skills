# historia-luki-podstawia-ocene-odpowiedzi

- **Skill:** nauka-z-claude
- **Typ:** porażka
- **Status:** otwarty

## Opis
Odpowiedź w sprawdzianie zawiera słowo pasujące do luki zapisanej w pliku postępu, więc Claude
ocenia ją jako nawrót tej luki, zamiast sprawdzić jej sens wobec zadanego pytania. Błędna ocena
od razu trafia do pliku jako reset pozycji, a koryguje ją dopiero użytkownik.

## Przyczyna źródłowa
Plik postępu, czytany na starcie sesji, opisuje lukę dosłownymi cytatami, więc podobne
sformułowanie wygląda jak jej potwierdzenie, a nie jak dana do oceny. Skill każe oceniać odpowiedź
i resetować pozycję, ale nie każe sprawdzić, czy słowo ma też poprawne znaczenie ani czy odpowiedź
trafia w zadane pytanie.

## Dowody
- 2026-11-04, sesja e1ab7466-0cf9-4fe2-a13b-36465045bb16 (id claude.ai niedostępny): naprowadzenie
  pytało „Kto decyduje o tym, że po wyszukiwaniu pada odczyt”, a Rafał odpowiedział „Narzędzia
  wywołuje model”. Pozycja „Podział ról” miała zapis „Luka: role odwracane”, więc Claude uznał
  odpowiedź za odwrócenie ról i zresetował pozycję (commit `42c3284`). Rafał: „Nie zgadzam się
  z interpretacją że że jeśli model zamawia to znaczy że nie wywołuje, nie chodziło mi o kod, ale
  to model podaje nazwę narzędzia do wykonania”. Reset cofnięty w `82f2dbe`.

## Rozwiązanie
Hipoteza do `nauka-z-claude`, sekcja „Pomoc w dialogu sokratejskim”: przed uznaniem odpowiedzi za
nawrót zapisanej luki odczytaj ją względem zadanego pytania. Słowo, które ma też poprawne
znaczenie, nie jest dowodem luki: rozstrzygnij je z reszty odpowiedzi albo zapytaj, co użytkownik
ma na myśli, i dopiero potem resetuj pozycję. Takie doprecyzowanie nie liczy się jako naprowadzenie.
