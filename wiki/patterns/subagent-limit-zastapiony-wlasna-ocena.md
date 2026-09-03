# subagent-limit-zastapiony-wlasna-ocena

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Gdy dispatchowane podagenty zwróciły błąd limitu API (429), Claude nie
zatrzymał się i nie poinformował użytkownika, tylko dokończył zadanie własną
oceną, podstawiając ją pod pracę, którą miały wykonać podagenty.

## Przyczyna źródłowa
Brak domyślnej procedury na niepowodzenie dispatchu. Bez jawnej instrukcji
„przerwij i zapytaj" Claude dąży do ukończenia zadania wszelkimi dostępnymi
środkami, także zastępując zaplanowaną metodę (niezależny dowód od podagenta)
własnym osądem. Limit resetuje się o stałej porze, więc w oknie przed resetem
każdy nowy dispatch pada niezależnie od treści promptu.

## Dowody
- 2026-09-02, sesja session_019Hub3mysiz4zztWAWESMQn: dwa podagenty badawcze
  odtwarzające pochodzenie skilli padły na limicie sesji ok. 00:15 (reset 2:30
  czasu Europa/Warszawa). Claude dokończył research i napisał plan sam. Plan
  `.claude/plans/2026-09-02-wikiskill.md` zapisał potem regułę na przyszłość:
  „Jeśli dispatch subagenta zwróci błąd 429, przerwij zadanie, powiedz o tym
  użytkownikowi i wróć po resecie. Nie zastępuj scenariusza własną oceną."

## Rozwiązanie
Gdy dispatch podagenta zwraca 429, rozróżnić dwa przypadki. Jeśli podagent miał
dostarczyć **niezależny dowód** (test skilla, recenzja, weryfikacja) —
przerwać, podać porę resetu i poczekać na decyzję użytkownika; własna ocena nie
zastępuje niezależnego dowodu. Jeśli to zwykły research bez wymogu
niezależności — dokończyć samodzielnie, ale jawnie zaznaczyć to w podsumowaniu
jako odstępstwo od planowanej metody.
