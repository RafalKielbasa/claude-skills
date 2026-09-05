# brief-nieaktualny-po-zmianie-planu

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis

`scripts/task-brief` wycina tekst zadania z planu do osobnego pliku. Gdy plan
zmienia się później — bo review wcześniejszego zadania wymusiło poprawkę we
wspólnym wzorcu — briefy pozostałych zadań nadal niosą wersję sprzed poprawki.
Implementer przepisuje je wiernie i **przywraca defekt naprawiony gdzie indziej**.

## Przyczyna źródłowa

Brief jest migawką planu, a nic tej migawki nie unieważnia przy zmianie źródła.
Kontroler regeneruje briefy na granicy batcha, bo tam widzi „nowy etap" — ale
zmiany planu przychodzą w środku etapu, z pętli poprawek poprzedniego zadania.

## Dowody

- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: w zadaniu 10
  wprowadzono `readRunFile`, żeby brakujący artefakt kończył kodem 2 zamiast 1
  (jedynka znaczy „przeszła uwaga blokująca"). Briefy 14–19 wygenerowano
  **przed** tą poprawką i nie odświeżono ich po niej, więc `crm fixable` z
  zadania 16 dostał stary `readJson` i wywalał stack trace z kodem 1.
  Zweryfikowane wprost: `crm fixable --run nosuchrun` → ENOENT, exit 1.
  Implementer przepisał brief poprawnie; wadliwy był brief.

## Rozwiązanie

Regeneruj briefy po **każdej** zmianie planu dotykającej wzorca wspólnego dla
wielu zadań — nie tylko na granicy batcha. Gdy pętla poprawek zmienia plan,
potraktuj to jako unieważnienie wszystkich briefów jeszcze niewykonanych zadań
i wygeneruj je od nowa przed następnym dispatchem.
