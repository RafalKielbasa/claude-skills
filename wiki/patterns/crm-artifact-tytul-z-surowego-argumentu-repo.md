# crm-artifact-tytul-z-surowego-argumentu-repo

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
`crm artifact` wpisuje do `<title>` strony „Review .”, gdy skill wołany jest z `--repo .`,
a „Review pr-<n>”, gdy przebieg idzie w worktree nazwanym od PR-a. SKILL.md (Krok 9) zapewnia, że
tytuł jest już poprawny i nie trzeba nic przekazywać, więc bez ręcznej poprawki artefakt trafia
do galerii z bezużyteczną nazwą.

## Przyczyna źródłowa
`bin/crm.mjs:676` składa tytuł z ostatniego segmentu surowego argumentu `--repo`
(`repo.replace(/[\\/]+$/, '').split(/[\\/]/).pop()`), bez `path.resolve` i bez nazwy repo
z gita. Dla `.` daje `.`, dla worktree w scratchpadzie daje nazwę katalogu worktree.

## Dowody
- 2026-10-22, sesja niedostępna (saas app, przebiegi `pr 205`/`pr 207`, pamięć projektu
  `code-review-master-config-2026-09-07`): „`crm artifact --repo .` daje tytuł „Review .””
  oraz „`crm artifact` daje tytuł z nazwy katalogu (poprawić na „Review saas app”)”. Obejście
  utrwalone w kolejnych sesjach: worktree zakładany jako `<scratchpad>/pr<n>/saas app`.
- 2026-11-18, sesja d98f9232-24f3-40c4-8594-9bb94f77e795 (id claude.ai niedostępny; saas app, PR #218): w worktree `<scratchpad>/pr218/saas app` skill wołany
  z `--repo .` dał `<title>Review .</title>`; poprawione przez `edits` przy publikacji
  (https://claude.ai/artifact/6jk9xU9cG1i7G7NT8zGBK3).

## Rozwiązanie
W `crm artifact` brać nazwę repo z `git remote get-url origin` (ostatni segment bez `.git`),
a gdy remote'u nie ma, z `path.basename` katalogu `git rev-parse --git-common-dir` po
`path.resolve`; nigdy z surowego `--repo`. Test: `--repo .` i worktree o innej nazwie dają
ten sam tytuł co główne drzewo.
