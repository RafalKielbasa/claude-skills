# sdd-usuniecie-workspace-gubi-odlozone-uwagi

- **Skill:** superpowers:subagent-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skill każe po czystej recenzji końcowej usunąć katalog roboczy planu (`.superpowers/sdd/<plan>/`). Uwagi z recenzji oznaczone „może poczekać” (tu około 30) leżą wyłącznie w ledgerze tego katalogu. Git go ignoruje, więc usunięcie kasuje jedyny zapis tych uwag.

## Przyczyna źródłowa
Skill traktuje katalog jak brudnopis, a jednocześnie każe parkować w ledgerze ustalenia, które przeżywają plan („Park findings in ledger with rulings”). Żaden krok nie przenosi otwartych ustaleń do repo przed usunięciem katalogu.

## Dowody
- 2026-11-09, sesja f83b042b-5c80-43ff-8320-902beeeba944 (id claude.ai niedostępny; Baza wiedzy, DT-134 #910, plan `weekly-sprints-card-links-plan-1`): przed usunięciem katalogu zebrałem z ledgera otwarte uwagi „deferred”/„can wait”, bez tych naprawionych w rundach poprawek i w fali końcowej. Trafiły do `docs/superpowers/plans/2026-11-09-weekly-sprints-card-links-followups.md`, podlinkowanego z indeksu projektu (`9aa58468`). Dopiero potem `rm -rf`.

## Rozwiązanie
Przed usunięciem katalogu roboczego planu:
- przenieś otwarte ustalenia „może poczekać” z ledgera, bez naprawionych, do commitowanego dokumentu części (`<data>-<projekt>-<część>-followups.md`);
- podlinkuj ten dokument z indeksu projektu;
- podaj rulingi w raporcie końcowym.

Dopiero potem usuń katalog.
