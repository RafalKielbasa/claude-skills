---
name: daily-tablica-przed-egzekucja
description: "/daily i /spotkanie — przed tworzeniem issues po bramce sprawdź issues założone od odczytu tablicy; zespół zakłada karty sam w trakcie dnia (2026-11-12: #926 zdublowałoby zadanie)"
metadata:
  node_type: memory
  type: feedback
  originSessionId: 215a59b4-6abb-4f41-9232-20cbc645aef7
  modified: 2026-11-12T19:02:27.541Z
---

Między odczytem tablicy (deduplikacja przed bramką) a egzekucją po „Akceptuj i wykonaj” mija nawet kilka godzin, a zespół w tym czasie sam zakłada karty. 2026-11-12 Mateusz założył #926 (landingi kursów pod subskrypcję) o 13:46 UTC, po odczycie tablicy — zatwierdzone na bramce zadanie 8 z daily 12.11 byłoby duplikatem. Wyłapane przypadkiem przy liczeniu numeru DT; Rafał wybrał „Odrzuć jako duplikat”.

**Why:** deduplikacja zadań działa tylko na stanie tablicy z chwili odczytu; decyzja z bramki opiera się na nieaktualnym obrazie.

**How to apply:** tuż przed pierwszym `gh issue create` w egzekucji wylistuj issues z `devstock-org/devstock-team` założone od odczytu tablicy (`gh issue list --state all --limit 20`, porównaj `createdAt`). Gdy któreś pokrywa się z zatwierdzonym `new`, nie twórz — zapytaj Rafała jednym pytaniem (Odrzuć jako duplikat / Skomentuj / Utwórz mimo to) i zapisz decyzję z komentarzem w `zadania.yaml`. Powiązane: [[bramka-punkt-po-punkcie]], [[tablica-3-auto-dodawanie-issue]].
