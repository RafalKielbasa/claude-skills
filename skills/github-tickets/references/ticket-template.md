# Ticket body template

The body is Polish, the title is English. Sections in this order; drop a section
that has nothing to say rather than leaving an empty heading. Angle brackets mark
what to replace.

There is no worked example in the repository to copy wholesale. Issue #168 has
the right section order but the wrong depth: it names files, options and call
sites, which the depth rule removes. Read it for structure, not for how much to
say.

---

**Zanim zaczniesz.** <Skąd zadanie wynika: który spec i które jego sekcje. Jaki
stan repozytorium zakłada opis: scalony PR, wcześniejszy ticket. Co przeczytać
przed startem.>

<Osobny akapit na pułapkę, jeśli jest jedna, która wywróci pierwszą godzinę
pracy: rzecz wyglądająca na błąd, a nią niebędąca, albo miejsce łatwe do
pomylenia z innym.>

**Co użytkownik ma zauważyć.** <Zdanie mówiące, ile zmian jest i że każda inna
różnica w zachowaniu to regresja.>

1. <zmiana widoczna dla użytkownika>
2. <kolejna>

**Opis:**

<Co zbudować i z którego istniejącego mechanizmu skorzystać. Cel i ograniczenia,
nie kolejność edycji: jak mechanizm jest podpięty, wykonawca ustala sam,
otwierając projekt.>

<Przy zadaniu będącym listą usterek dodaj zdanie: "Każdy punkt to objaw; miejsce
w kodzie znajdziesz sam." Potem opisuj objawy, nie pliki.>

**<Nazwa kontraktu>**

| <Pole> | <Typ> | <Reguła> |
|---|---|---|
| <pole> | <typ> | <opis> |

**Kryteria akceptacji:**

- [ ] <fakt sprawdzalny bez pytania autora, co miał na myśli>
- [ ] <kolejny>

**Weryfikacja ręczna:**

1. <krok, który pokazuje działanie>
2. <kolejny>

**Poza zakresem:** <co celowo nie należy do tego ticketu i dlaczego, jeśli powód
nie jest oczywisty>

**Zależności:** <numery ticketów, które muszą wejść wcześniej, albo "brak">

---

## Two things that always survive the depth rule

Neither can be found by reading the code, so the ticket is the only source.

**A constraint the code does not express.** A forced ordering, a race, a protocol
quirk, an environment trap. Name it in a sentence or two, with the consequence of
getting it wrong, and stop there. Do not unfold it into steps.

> Wylogowanie ma czyścić cache, więc provider cache'u musi być przodkiem
> providera sesji, nie odwrotnie.

**A contract that does not exist yet.** An endpoint shape, a field table, the
response on the empty case, user-facing copy that has been agreed. Give it in
full, as a table.

## Writing the acceptance criteria

Criteria state behaviour, not structure. A criterion naming a file lets the
walk-through back in through a side door.

> Nie: `app/providers.tsx` z `QueryClientProvider` nad `AuthProvider`
> Tak: wylogowanie czyści cache i żaden komponent nie odczytuje danych
> poprzedniego użytkownika

## What must not appear

- Solution code of any kind: models, services, controllers, DTOs, components.
  A contract is a table. A reference implementation is a path to read.
- A walk-through of the repository: which files to open, in what order, and where
  to call what. Name the mechanism, not the wiring.
- An em dash or an en dash.
- An argument for why the feature is worth building. That is the spec's job.
- A repetition of the epic's scope.
