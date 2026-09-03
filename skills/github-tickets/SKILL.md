---
name: github-tickets
description: Use when turning a spec or a session finding into GitHub issues — triggers like "zrób tickety", "wystaw zadania na GitHuba", "rozpisz spec na issues", "wyślij zadania", "create tickets from the spec". Also covers the retrospective mode that reads what happened to issues created earlier. NOT for writing the spec itself (superpowers:brainstorming) and NOT for implementation plans (superpowers:writing-plans).
---

# GitHub tickets

## Overview

Turn a spec into an epic and its child issues, or a single finding into a single
issue, and publish them on GitHub. Two gates belong to the user: the split, and
the send. Two readers check the drafts before either gate closes: this skill's
own checklist, and codex.

**The rule that shapes everything else: nothing is created or changed on GitHub
until the user says to send.** Absence of an answer is not permission. A user who
says they are busy and to carry on is not giving permission for this send.

## When to use

- The user asks for tickets from a spec, or for a batch of tasks on GitHub.
- The user asks for one ticket from something found in this session.
- The user asks what happened to tickets sent earlier (retrospective mode).

**Not for:** writing the spec (`superpowers:brainstorming`), writing an
implementation plan for your own work (`superpowers:writing-plans`), or editing
one issue the user dictates word for word (that is a plain `gh` call).

## Step 0: read the project parameters

Read `docs/ticket-conventions.md` from the working directory. It gives the
repository, the number prefix, the title and body languages, the spec directory,
how epics link to children, how dependencies are recorded, the area labels and
the audience.

**No such file means this project has no ticket conventions yet.** Do not fall
back to another project's values and do not guess. Ask the user for the
parameters, offer to create the file, and stop until they answer.

## Step 1: collect state

From tools, never from memory. Substitute `<repo>` and `<prefix>` with what step
0 read; a skill that counts one project's prefix in another project reserves
numbers that collide.

```bash
gh issue list --repo <repo> --state all --limit 300 --json title --jq '.[].title' | grep -o '<prefix>-[0-9]\+' | sed 's/<prefix>-//' | sort -n | tail -1
grep -rho '<prefix>-[0-9]\+' docs/ | sed 's/<prefix>-//' | sort -n | tail -1
```

Take the larger of the two and reserve from there plus one. Both sources matter:
numbers get reserved in documents that never reach GitHub.

Also collect the open epics and the labels:

```bash
gh issue list --repo <repo> --state open --limit 100 --json number,title
gh label list --repo <repo>
```

**Do this immediately before drafting, not once at the start of a long session.**
On 2026-09-03 the highest number rose from 98 to 103 inside one hour, because
another session created five issues while this one was working.

## Step 2: propose the split, then stop

Read the spec. Propose the breakdown as one table:

| Nr | Title (EN) | Spec sections | Depends on | Epic | Label |
|---|---|---|---|---|---|

Say which spec sections you are deliberately leaving out and where they go.

**Gate one.** The user accepts the split or rearranges it. Wait. A correction
here costs a sentence; the same correction after the bodies are written costs
rewriting every one of them.

## Step 3: write the bodies

One Markdown file per ticket plus one for the epic, UTF-8 without BOM. Follow
`references/ticket-template.md` and `references/epic-template.md`.

Put them where the user can open them. A path inside the project that git
ignores beats a temp directory: the user reviews these files, and a path they
cannot click is a path they cannot review. Give absolute paths when you name
them.

Write them with the file-writing tool, never with a shell heredoc. Ticket text
carries apostrophes and Windows paths, and both break shell quoting.

## Step 4: self-check

Run `references/self-check.md` against every draft. Report your own failures to
the user before showing them anything else, and say how many checks you ran. Fix
what you can fix without a decision; raise what needs one.

## Step 5: codex review

Follow `references/codex-review-prompt.md`. Write the prompt to a file and feed
it on stdin; never pass it as an argument.

```bash
codex exec --sandbox read-only - < <prompt file>
```

Use prompt A for a new batch and **prompt B whenever the drafts replace bodies
that already exist**. A rewrite fails by silently losing information, which
prompt A does not ask about.

Evaluate every finding, say whether it is right, and apply the ones you
recommend. Show the user a table: finding, your verdict, applied or not, and why.
A finding whose fix would change the scope, raise the cost, or do something
irreversible is not yours to rule on: show it separately and wait.

## Step 6: present, then stop

Give the user the drafts, the self-check result and the codex table together, in
one place. Name anything you are leaving to them.

**Gate two.** Wait for an explicit instruction to send.

## Step 7: deliver

Only after that instruction. Epic first, because children need its number.

```bash
gh issue create --repo <repo> --title "<Epic title>" --body-file <epic.md>
gh issue create --repo <repo> --title "<PREFIX>-<n> <Title>" --body-file <ticket.md> --label <area>
```

Attach each child to the epic. The endpoint takes the child's **database id**,
not its issue number, and `gh` has no sub-issue subcommand:

```bash
CHILD_ID=$(gh api repos/<owner>/<repo>/issues/<child_number> --jq '.id')
gh api repos/<owner>/<repo>/issues/<epic_number>/sub_issues -X POST -F sub_issue_id=$CHILD_ID
```

Then set the dependencies from the table the user approved at gate one, as native
relations rather than prose alone. Same rule: a database id, not an issue number.

```bash
BLOCKER_ID=$(gh api repos/<owner>/<repo>/issues/<blocker_number> --jq '.id')
gh api repos/<owner>/<repo>/issues/<blocked_number>/dependencies/blocked_by -X POST -F issue_id=$BLOCKER_ID
```

Set no assignees. That is the repository owner's decision.

## Step 8: trace and verify

Read back what you wrote, from GitHub, not from your own assumption that the
commands worked.

```bash
gh api repos/<owner>/<repo>/issues/<epic_number>/sub_issues --jq '.[].number'
gh issue view <n> --repo <repo> --json number,labels --jq '"#\(.number) [\(.labels|map(.name)|join(","))]"'
```

Diff at least a couple of published bodies against their drafts, ignoring a
trailing blank line, which GitHub adds. Then report a table: number, issue
number, title, epic, label, URL.

## Step 9: evidence

The run just produced signal about this skill. Collect it and offer it to the
wiki, in the pattern-page template that `podsumuj-sesja-claude` defines, under
`~/.claude/wiki/patterns/`.

Signals, weakest first:

1. Corrections the user made to the split at gate one.
2. Corrections the user made to the bodies at gate two.
3. **Codex findings you judged right and applied.** This is the strongest signal
   and the point of the whole construction: a correct finding is by definition
   something `references/self-check.md` failed to catch. Its "Rozwiązanie"
   section writes itself, because it reads "add this check to
   `references/self-check.md`", and you add it there in the same breath.

An observation that is one-off, or caused by the state of one document, is not a
pattern. Skip it and say so. A clean run is evidence too, of the success kind.

**Show the list and wait.** Write nothing to the wiki without approval. Then say
plainly whether anything is ready for `/evolve-skill github-tickets`.

## Mode: a single ticket

One ticket, no epic. The number still comes from step 1, because a single ticket
collides just as easily as a batch.

Gate one has no split to approve, so it approves the ticket's frame instead.
Before writing a single word of the body, put four things in front of the user
and stop: the reserved number, the English title, one sentence saying what is in
scope and what is not, and the area label. That is the cheapest moment to learn
that the user meant something narrower.

Steps 3 to 9 run unchanged, gate two included.

## Mode: retrospective

Run when the user asks what happened to tickets sent earlier. This mode measures
a ticket by its fate rather than by how it read, which is the only measure that
does not depend on anyone's impression. It creates nothing and changes nothing on
GitHub.

It is worth running only once tickets have had time to be worked on. A batch sent
this morning has no fate yet.

Pick the issues to examine: a batch by numbers, an epic's children, or everything
created in a date range. For each one, gather four things.

**Questions in the comments.** Someone asking what something means is a ticket
that left it out.

```bash
gh issue view <n> --repo <repo> --json comments --jq '.comments[] | "\(.author.login): \(.body)"'
```

**Body edited after delivery.** The owner rewriting the body is the same signal,
stronger. REST does not expose it; GraphQL does.

```bash
gh api graphql -f query='query($owner:String!,$repo:String!,$num:Int!){repository(owner:$owner,name:$repo){issue(number:$num){userContentEdits(first:20){totalCount nodes{editedAt editor{login}}}}}}' -F owner=<owner> -F repo=<repo> -F num=<n>
```

Compare against `createdAt` from `gh issue view <n> --json createdAt`. An edit
later than creation, by the owner, is a finding. Your own bulk edit of a batch is
not: exclude edits you made yourself, or every rewrite would look like a defect.

**Closed with no pull request.** A ticket that closed without code either should
not have existed or was folded into another. Both are findings about the split.
Ask GitHub which pull requests closed it rather than reading the timeline: a
`cross-referenced` event does not say whether the reference came from a pull
request or from another issue, so it cannot answer this question.

```bash
gh api graphql -f query='query($owner:String!,$repo:String!,$num:Int!){repository(owner:$owner,name:$repo){issue(number:$num){state closedByPullRequestsReferences(first:5){totalCount nodes{number title}}}}}' -F owner=<owner> -F repo=<repo> -F num=<n>
```

`state` of `CLOSED` with `totalCount` of `0` is the finding.

**Reopened.** Its scope was named wrong the first time.

```bash
gh api repos/<owner>/<repo>/issues/<n>/timeline --jq '[.[] | select(.event == "reopened")] | length'
```

Any number above zero is the finding.

Turn what you find into the same pattern pages as step 9, under
`~/.claude/wiki/patterns/`, and show the list before writing anything. A single
question on a single ticket is not a pattern; the same question on three tickets
is. Where a finding names a check the drafts should have passed, add that check
to `references/self-check.md` under "From findings" with today's date.

## Red flags

| Thought | Reality |
|---|---|
| "The user is busy, I will send and show them after" | Absence of an answer is not permission. Nothing reaches GitHub without an explicit send. |
| "I collected the highest number earlier in this session" | Numbers move while you work. Read them again immediately before drafting. |
| "The spec is clear, the split is obvious" | Gate one exists because a wrong split is discovered after eight bodies are written. |
| "Codex is nitpicking, I will drop that finding" | You may reject it, but the rejection goes in the table with its reason. A finding dropped silently is a decision nobody can review. |
| "This finding needs a real send to fix, I will just do it" | A fix that changes scope, cost, or does something irreversible is not yours. Show it and wait. |
| "This project is like the last one, I will reuse its conventions" | No conventions file means ask. Guessing produces a ticket nobody can use. |
| "I will paste the body into the gh command" | Multi-paragraph text on a Windows command line breaks on quoting and encoding. Always `--body-file`, always a real file. |
| "The commands returned no error, so it worked" | Read it back from GitHub. Step 8 exists because a silent partial failure looks exactly like success. |
| "Nothing went wrong, so there is no evidence" | A clean run is evidence of the success kind. Say so instead of skipping the step. |
| "I am shortening a ticket, so less is always better" | Cutting a constraint or a contract does not shorten a ticket, it breaks it. The self-check has a line for exactly this. |
