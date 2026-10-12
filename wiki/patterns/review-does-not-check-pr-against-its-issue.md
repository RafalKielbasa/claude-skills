# review-does-not-check-pr-against-its-issue

- **Skill:** code-review-master
- **Typ:** porażka
- **Status:** otwarty

## Opis
The review never compares a PR with the issue it closes. An acceptance criterion the PR leaves unmet, and
code the PR carries from another task, both reach the report only when Claude reads the issue by hand after
the run. Rafał treats both as blocking, so the defects that decide the verdict are the ones the skill does
not look for.

## Przyczyna źródłowa
`crm plan` builds the axes from `.claude/review/config.md` and the changed files; it never fetches the PR's
linked issue. Every axis prompt carries a checklist of repository conventions, the file list and the brief's
summary, so no agent ever sees the task's requirements. A ticked checkbox in the issue is the author's claim,
and nothing in the pipeline tests it against the code. Mode `recheck` reads only the earlier review's remarks.

## Dowody
- 2026-10-09, sesja d1166696-ae05-41e9-8848-8ed9022a56fe (id claude.ai niedostępny): `recheck 198` (CP-100,
  issue #180) confirmed 3/3 remarks fixed; a manual read of the issue then showed that commit `35db0f2`
  brought quiz API changes (`GET edit`, `findForAdmin`, `passingScore`) outside the issue's scope. Rafał:
  "Jeśli trafiły na branch informacje z innego zadania, to jest to blokujące". Sent as review 5475666170.
- 2026-10-12, sesja bbf04b0a-b00e-4022-825d-4502fd8b5ab5 (id claude.ai niedostępny): `pr 202` (CP-104,
  issue #184), 11 agents on 5 axes, reported 2 findings, none about the issue. A manual pass over #184 found
  the unchecked criterion "Testy: walidacja formularza, zapis pełnej listy pytań, …" with no test in
  `apps/web`, and `passingScore ?? 70` (`quiz-lesson-editor.tsx:157`) breaking "pominięcie zostawia
  dotychczasową wartość". Both went out as Blocking in review 5491208916. Rafał: "Zawsze niewypełnienie
  elementu issue jest uwagą blokującą".

## Rozwiązanie
In modes `pr` and `recheck`, fetch the issues the PR closes (`gh pr view <n> --json
closingIssuesReferences`, then `gh issue view`) and check them against the code as a dedicated step or
axis: every acceptance criterion and every requirement in the description, ticked or not, plus every changed
file the issue's scope does not cover. Each unmet element and each foreign change is Blocking and quotes the
issue sentence it rests on. The rule source is Rafał's two decisions above, recorded in project memory
(`feedback-unmet-issue-element-blocking`, `feedback-foreign-task-changes-blocking`).
