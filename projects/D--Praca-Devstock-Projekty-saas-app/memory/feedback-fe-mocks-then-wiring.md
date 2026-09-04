---
name: feedback-fe-mocks-then-wiring
description: "Zasada dzielenia zadań: FE na fixture'ach jako osobny ticket, podpięcie FE→BE jako drugi; wiring czeka na TanStack Query z CP-89"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 3118f5b2-86f2-4fb0-9cbc-b994c837b92a
  modified: 2026-09-04T09:20:17.521Z
---

Zadania na funkcjonalność dzielimy na **FE na mockach** i **podpięcie FE→BE** jako osobne tickety (plus ticket BE, jeśli backendu jeszcze nie ma). Brak backendu przestaje blokować rozpoczęcie frontu.

**Why:** Aplikacja nie jest produkcyjna, więc front na fixture'ach nikomu nie szkodzi, a odblokowuje równoległą pracę. Dodatkowo wymusza to spec app-shell: decyzja 9 przenosi stan serwera na TanStack Query, a reguła przejściowa zakazuje nowych użyć `useApiResource`. Dopóki CP-89 nie wprowadzi `lib/query/`, nowy kod FE nie ma czym pobierać danych, więc podpięcie i tak musi poczekać. Spec stosuje ten wzorzec już raz: CP-90 rysuje „Odkryj szkoły” na klockach, a CP-93 podpina je po CP-92.

**How to apply:**
- **Ticket FE na mockach** dowozi wszystkie stany wizualne z Figmy (dane, pusty, ładowanie, błąd), komponent prezentacyjny bierze dane przez propsy i sam nic nie pobiera, dane siedzą w pliku fixture o kształcie **przepisanym z udokumentowanego kontraktu** (tabela na górze opisu issue na GitHubie, jak w CP-94 #173, albo spec), nigdy wymyślonym. Testy jednostkowe piszemy tu i przeżywają podpięcie bez zmian. Sekcja „Jak sprawdzić ręcznie” brzmi „otwórz trasę i porównaj z węzłem w Figmie”, bez seeda i bez logowania.
- **Ticket podpięcia** zamienia fixture na `useQuery` z kluczem z `queryKeys`, decyduje który stan wizualny kiedy się pokazuje, dopisuje regułę unieważniania w `lib/query/invalidation.ts` i kasuje fixture. Zależy od CP-89 i od ticketu BE.
- Kolejność w opisie zawsze jawnie: „ten ticket nie pobiera danych, robi to CP-XX”.

**Uwaga na harmonogram:** wszystkie tickety podpięcia kolejkują się za CP-89, którego nie dajemy na praktyki. Jeśli CP-89 się ślizga, rośnie stos gotowego, niepodpiętego frontu.

Zob. [[feedback-junior-tickets-no-code]] (styl ticketów), [[app-shell-account-hub-spec]] (CP-89 i reguła o `useApiResource`), [[fe-screen-gaps-2026-08-28]] (co jest do zrobienia).
