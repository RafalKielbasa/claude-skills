# sprawdzian-przed-powtorkami-tego-samego-materialu

- **Skill:** nauka-z-claude
- **Typ:** sukces
- **Status:** otwarty

## Opis
Hook SessionStart zgłasza zaległe powtórki, a ten sam temat ma zaległy sprawdzian kroku na
tych samych mechanizmach. Claude zestawia oba tryby w jednym pytaniu z rekomendacją
„najpierw sprawdzian, powtórki na koniec”, Rafał wybiera ją jednym „A”, a sprawdzian mierzy
pamięć bez ściągi.

## Przyczyna źródłowa
Skill opisuje propozycję powtórek z hooka i wznowienie tematu osobno, nie mówi, co zrobić,
gdy oba celują w ten sam materiał. Powtórka wyjaśnia każdą lukę na miejscu, więc sprawdzian
puszczony po niej mierzy wyjaśnienie sprzed kilku minut — to samo, przed czym skill chroni
zakazem sprawdzianu w sesji materiału.

## Dowody
- 2026-10-26, sesja 13cf4e4b-eabc-4759-85fd-9f693f32f51f (id claude.ai niedostępny; id
  z katalogu zadań tła), vault „Notatki”, temat „Agent notatek”: 6 zaległych pozycji, wszystkie
  z kroku 1 i porcji 1 kroku 2, oraz ponowny sprawdzian kroku 1. Warianty [A] sprawdzian →
  materiał → propozycja powtórek na koniec, [B] powtórki → sprawdzian, [C] tylko powtórki.
  Rafał: „A”. Sprawdzian 3/3 bez naprowadzenia, krok 1 odhaczony.

## Rozwiązanie
Do sekcji „Wznowienie” albo „Powtórki”: gdy zaległe pozycje i zaległy sprawdzian kroku
dotyczą tego samego materiału, sprawdzian idzie pierwszy, a powtórki proponujesz na koniec
sesji jednym zdaniem. Powtórka przed sprawdzianem daje mu ściągę.
