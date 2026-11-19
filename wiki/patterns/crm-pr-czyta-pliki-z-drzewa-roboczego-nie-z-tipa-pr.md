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
- 2026-11-18, sesja 140fbd7f-77b7-474d-927d-01ab988fa726 (id claude.ai niedostępny; saas app, PR #219):
  `crm plan --mode pr --pr 219` z `main` dał `apps/api/test/progress-leaderboard.e2e-spec.ts` z
  `"size":0`, a `app.module.ts` i `setup-env.ts` w wersji z `main`. Wykryte z pamięci projektu,
  nie z ostrzeżenia CLI. Obejście jak wyżej: `git worktree add --detach <scratchpad>/pr219/saas app
  782dab7`, kopia `state.json`, drugi `crm plan` z `--repo <worktree>`, po przebiegu kopia
  `state.json` i raportów z powrotem; pierwszy plan (`20261118-163816-6xim`) osierocony.
- 2026-11-18, sesja df9b60eb-ffa1-4f95-9570-f528900ec065 (id claude.ai niedostępny; saas app, PR #215): `crm plan --mode pr --pr 215` z `main` (run `20261118-171545-l8ti`) dał czterem nowym plikom
  `"size":0`. Wykryte z pamięci projektu, ale dopiero **po** bramce budżetu: Rafał zatwierdził
  21 agentów na planie z głównego drzewa. Drugi `crm plan` w worktree `<scratchpad>/pr215/saas app`
  na `b573633` (run `20261118-171748-sq9t`) dał ten sam wybór osi, więc zgody nie trzeba było
  powtarzać, ale bramka wiązała się z osieroconym `runId`. Porównanie SHA musi stać przed bramką.
- 2026-11-18, sesja d98f9232-24f3-40c4-8594-9bb94f77e795 (id claude.ai niedostępny; saas app, PR #218): `crm plan --mode pr --pr 218` z `main` (run
  `20261118-175848-qw1p`), a po nim od razu brief i szukający, mimo notatki w pamięci projektu
  „Obejście checkoutu: `git worktree add --detach`”. PR zmieniał tylko istniejące pliki, więc plan
  nie miał żadnego `"size":0` (`use-course.ts` 5159 B z `main` zamiast 6017 B z tipa); jedyny
  sygnał dał brief: „the on-disk files do not match the stated diff”. Koszt: 1 agent briefu
  i przerwany codex-find (`taskkill /T`); drugi plan w worktree `<scratchpad>/pr218/saas app`
  (run `20261118-180016-2qtu`).
- 2026-11-19, sesja 4e906a74-5c70-4d23-b56c-ba04b7047f2d (id claude.ai niedostępny; saas app, PR #216, run `20261119-105530-v3fe`): przebieg od razu w `git worktree add --detach <scratchpad>/pr216/saas app 97c29a6` z kopią `state.json` i `crm --repo <worktree>`; plan, osie, `send` i artefakt („Review saas app” z nazwy katalogu) bez checkoutu. Obejście nadal ręczne, z pamięci projektu — skill go nie robi.
- 2026-11-19, sesja 9273a288-9ea2-4ef5-8c9a-2ddbe8af2dff (id claude.ai niedostępny; saas app, PR #213, run `20261119-123337-yj2y`): obejście od razu, przed pierwszym `crm plan` — `git fetch origin <headRefName>`, `git worktree add --detach <scratchpad>/pr213/saas app 2f8eed8`, kopia `state.json`; bez osieroconego planu i z bramką budżetu na właściwym `runId`. W `git worktree list` wisi już 8 takich drzew z wcześniejszych sesji (pr211, pr215 ×2, pr216, pr217, pr218, pr219, poprzedni pr213) — skill ich nie sprząta.

## Rozwiązanie
W Kroku 1 trybu `pr`, przed `crm plan`: porównaj `git -C <repo> rev-parse HEAD` z
`gh pr view <n> --json headRefOid`. Gdy się różnią, poszukaj w `git worktree list` drzewa na tym
SHA i użyj go jako `<repo>`; gdy go nie ma, zatrzymaj się i zapytaj (nigdy `git checkout`
w dzielonym drzewie, patrz review-przez-checkout-zabiera-drzewo-uzytkownika). Docelowo `crm plan`
sam kończy się kodem 2, gdy `HEAD` ≠ `headRefOid`, zamiast planować na plikach o rozmiarze 0.
Po przebiegu w worktree powiedz wprost, że `state.json` jest tam zmodyfikowany i nie należy do
commitów PR-a.

`size: 0` nie jest wystarczającym sygnałem: PR, który tylko zmienia istniejące pliki, planuje się
na wersjach z `main` o niezerowych rozmiarach (PR #218). Porównanie `HEAD` z `headRefOid` musi być
twardym warunkiem w `crm plan`, nie heurystyką z podglądu planu.
