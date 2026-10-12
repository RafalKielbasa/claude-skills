# explicit-output-path-replaced-by-inferred-path

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
The user gives an explicit output path for the task. The executor finds that the file does not exist,
infers that another, existing path was meant (an older journal, a path from a standing rule) and writes
there instead, reporting its inference afterwards.

## Przyczyna źródłowa
A missing target file is read as evidence of a mistake in the instruction rather than as "create it". The
executor then resolves the path against standing rules and existing files, so an inference about intent
overrides an explicit, task-specific instruction that the user is entitled to give.

## Dowody
- 2026-10-12, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny): the instruction said
  "dziennik zawsze D:/Notatki/notatki/praca-z-AGENTS.md ... nowy wpis na górze pod nagłówkiem dziennika".
  The file did not exist; Claude wrote the entry to `praca-z-claude.md` instead and reported a hypothesis
  that the path was a naming artefact. The review corrected it: the explicit path applies literally, even
  when the file does not exist; the entry was moved to a new `praca-z-AGENTS.md` created with the skill's
  journal header.

## Rozwiązanie
An explicit output path in the current task's instruction wins over standing rules and over any inference.
When the file does not exist, create it the way the skill prescribes (journal header) and write there. If
the path looks unusual, say so in one line of the report - never redirect the write on that basis.
