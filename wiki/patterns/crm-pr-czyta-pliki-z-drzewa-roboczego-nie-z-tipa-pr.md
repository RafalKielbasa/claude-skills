# crm-pr-czyta-pliki-z-drzewa-roboczego-nie-z-tipa-pr

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
`/code-review-master pr <n>` uruchomione w checkoutcie, który nie stoi na tipie PR-a, planuje
przebieg na plikach, których w drzewie roboczym nie ma: nowe pliki PR-a dostają `size: 0`, agenci
osi nie mają czego czytać, a `crm assemble` odrzuciłby każdy dowód. Skill tego nie wykrywa i nie
mówi, co zrobić.

## Przyczyna źródłowa
Tryb `pr` bierze listę plików i oba SHA z `gh pr view` (`lib/target.mjs`, gałąź `mode === 'pr'`),
ale treść plików czyta z dysku: `sizeOf(repoDir, path)` w `collectTarget` i
`readFileSync(join(repo, path))` w `assemble` (`bin/crm.mjs`). Nic nie porównuje `HEAD` drzewa
z `headRefOid` PR-a. SKILL.md definiuje `<repo>` jako katalog roboczy i nie wspomina o worktree.

## Dowody
- 2026-11-12, sesja 35a425f6-9ecb-4c57-96c1-1edac5c3bd05 (id claude.ai niedostępny;
  code-busters-v2, PR #1749): `crm plan --mode pr --pr 1749` z `main` zwrócił cztery nowe pliki
  z `"size":0`. Wykryte przed dispatchem tylko dlatego, że podgląd planu pokazał zera. Obejście:
  drugi `crm plan` z `--repo` = istniejący worktree `code-busters-v2-dt102` na tipie `f19bc4b63`;
  pierwszy plan (`…-nmwy-plan.json`) został osierocony w `main`. Skutki uboczne: raport i
  zmodyfikowany, śledzony `.claude/review/state.json` wylądowały w worktree gałęzi PR-a, a tryb
  `send` wymaga potem tego samego `--repo`.

## Rozwiązanie
W Kroku 1 trybu `pr`, przed `crm plan`: porównaj `git -C <repo> rev-parse HEAD` z
`gh pr view <n> --json headRefOid`. Gdy się różnią, poszukaj w `git worktree list` drzewa na tym
SHA i użyj go jako `<repo>`; gdy go nie ma, zatrzymaj się i zapytaj (nigdy `git checkout`
w dzielonym drzewie, patrz review-przez-checkout-zabiera-drzewo-uzytkownika). Docelowo `crm plan`
sam kończy się kodem 2, gdy `HEAD` ≠ `headRefOid`, zamiast planować na plikach o rozmiarze 0.
Po przebiegu w worktree powiedz wprost, że `state.json` jest tam zmodyfikowany i nie należy do
commitów PR-a.
