---
name: daily-tablica-przed-egzekucja
description: "/daily i /spotkanie — przed tworzeniem issues po bramce sprawdź issues założone od odczytu tablicy; zespół zakłada karty sam w trakcie dnia (2026-11-12: #926 zdublowałoby zadanie)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 215a59b4-6abb-4f41-9232-20cbc645aef7
  modified: 2026-11-15T19:12:20.475Z
---

Między odczytem tablicy (deduplikacja przed bramką) a egzekucją po „Akceptuj i wykonaj” mija nawet kilka godzin, a zespół w tym czasie sam zakłada karty. 2026-11-12 Mateusz założył #926 (landingi kursów pod subskrypcję) o 13:46 UTC, po odczycie tablicy — zatwierdzone na bramce zadanie 8 z daily 12.11 byłoby duplikatem. Wyłapane przypadkiem przy liczeniu numeru DT; Rafał wybrał „Odrzuć jako duplikat”.

Powtórzyło się 2026-11-15 (daily 13.11): w trakcie bramki Mateusz założył #978 (DT-155, kampania A z `StartTrial` i wykluczeniami), które pokryło zatwierdzone zadanie 2 dla Wiktora; Rafał wybrał „Skomentuj #978” (zadanie przeszło na `supplement`).

**Why:** deduplikacja zadań działa tylko na stanie tablicy z chwili odczytu; decyzja z bramki opiera się na nieaktualnym obrazie.

**How to apply:** tuż przed pierwszym `gh issue create` w egzekucji wylistuj issues z `devstock-org/devstock-team` założone od odczytu tablicy (`gh issue list --state all --limit 20`, porównaj `createdAt`). Gdy któreś pokrywa się z zatwierdzonym `new`, nie twórz — zapytaj Rafała jednym pytaniem (Odrzuć jako duplikat / Skomentuj / Utwórz mimo to) i zapisz decyzję z komentarzem w `zadania.yaml`. Powiązane: [[bramka-punkt-po-punkcie]], [[tablica-3-auto-dodawanie-issue]].
