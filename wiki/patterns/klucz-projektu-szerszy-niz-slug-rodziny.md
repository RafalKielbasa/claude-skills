# klucz-projektu-szerszy-niz-slug-rodziny

- **Skill:** project-index
- **Typ:** sukces
- **Status:** otwarty

## Opis
Pierwsze uzupełnienie istniejącej rodziny skillem `project-index`: jedyny dokument rodziny
w `docs/superpowers/` (`plans/2026-10-15-design-system-pilot.md`) miał slug `design-system`,
a praca obejmowała też ekran dla niezalogowanego, stany dostępu i paywall. Zamiast wziąć slug
rodziny za klucz projektu (reguła skilla), Claude zaproponował nowy klucz `kodozercy-platform`
jako [A], a slug rodziny jako [B] z kosztem (dwa indeksy, zależność między nimi śledzona ręcznie).
Rafał przyjął [A] jednym „ok”.

## Przyczyna źródłowa
Reguła „rodzina z istniejącym slugiem zachowuje go jako klucz projektu” zakłada, że rodzina
dokumentów pokrywa się z projektem. Gdy slug nazywa tylko jedną część większej pracy, reguła
wymusza albo zbyt wąską nazwę całości, albo drugi indeks i ręczne śledzenie zależności.

## Dowody
- 2026-10-16, sesja 7875e423-9ae8-4e55-a56b-31766c608f4e (id claude.ai niedostępny): podgląd
  indeksu w rozmowie (tabela sześciu części, decyzje czekające i rozstrzygnięte z nazwami),
  pytania o klucz, metę i listę komponentów w jednej wiadomości, zapis po „ok”:
  `docs/superpowers/projects/kodozercy-platform.md`, commit `790031f0`. Stary plan został pod
  nazwą sprzed indeksu, z linkiem w kolumnie Dokumenty i dopiskiem „nazwa sprzed indeksu”.

## Rozwiązanie
Przy uzupełnianiu rodziny sprawdź, czy jej slug obejmuje całą pracę, którą indeks ma śledzić.
Gdy obejmuje tylko część, zaproponuj nowy klucz projektu jako [A] (stary slug zostaje w nazwie
części, pliki zostają pod starymi nazwami z linkiem w indeksie), a slug rodziny jako [B]
z kosztem drugiego indeksu. Zapis dopiero po potwierdzeniu.
