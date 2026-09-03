# Epic body template

The epic is a plain issue. Its children are attached as GitHub sub-issues, so the
body carries no checklist of them: the sub-issue list renders that already, and a
hand-written copy goes stale the moment a ticket is added.

Title: English, no number, naming the outcome. Example: `Application shell and
account hub`.

Body: Polish, four parts, prose rather than bullets. Issues #167 and #178 are the
worked examples; unlike the ticket template, they are good models, because the
depth rule constrains tickets, not epics.

---

<Część pierwsza: stan świata dzisiaj i dlaczego jest problemem. Konkretnie,
z liczbami i nazwami tam, gdzie je znasz: ile komponentów robi tę samą rzecz, co
się przez to psuje, czego użytkownik nie dostaje. Bez tej części epik brzmi jak
lista życzeń.>

<Część druga: co epik dowozi od początku do końca. Nie lista zadań, tylko obraz
stanu po jego zamknięciu. Czytelnik ma zrozumieć, czym aplikacja będzie się
różnić, nie ile ticketów wejdzie.>

<Część trzecia: skąd to wynika i co przeczytać. Ścieżka do specu w repozytorium,
zdanie o tym, że tickety odsyłają do jego sekcji i nie powtarzają uzasadnień,
oraz stan repozytorium, który opisy zakładają.>

**Poza zakresem:** <co do epiku nie należy, wraz z tym, gdzie te rzeczy trafiły,
jeśli mają już swoje miejsce, oraz co czeka na decyzję i jaką>

---

## Why an epic may say more than its tickets

The depth rule keeps a ticket from doing the implementer's discovery. An epic has
no implementer: nobody codes an epic. Its job is to let a reader decide whether a
ticket in front of them belongs to something coherent, so naming today's mess
concretely is the point, not a violation.

What an epic still must not do is repeat what its tickets say. If a sentence
would be equally at home in one child ticket, it belongs there instead.

## The out-of-scope part earns its place

Two different things go there and both matter:

- what belongs to another epic, named, so nobody files a duplicate;
- what is blocked on a decision nobody has taken, with the decision stated.

The second is the one people skip, and it is the one that saves an argument in
review three weeks later.
