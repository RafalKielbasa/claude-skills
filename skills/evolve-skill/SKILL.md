---
name: evolve-skill
description: Use when the user asks to evolve, improve or update a Claude Code skill based on accumulated experience — triggers like "/evolve-skill <nazwa>", "ulepsz skill X", "wyewoluuj skill", "popraw skill na podstawie wiki", or a session summary signalling patterns ready for evolution. NOT for authoring a brand-new skill from scratch, and NOT for a one-off manual edit the user dictates.
---

# Ewolucja skilla na podstawie wiki

## Overview

Proponujesz **jedną atomową zmianę jednego skilla**, opartą na wzorcach zebranych
w `.claude/wiki/` przez krok Wiki Maintainer skilla `podsumuj-sesja-claude`.
Bramką jest użytkownik — nie automatyczny wynik.

**Zasada nadrzędna: nie zgadujesz, co poprawić.** Zmiana ma wynikać z dowodów
zapisanych w wiki. Gdy wiki nie uzasadnia zmiany, mówisz to i nic nie proponujesz.
Propozycja „z głowy" to porażka tego skilla, nawet jeśli jest trafna.

## Kiedy używać

- Użytkownik pisze `/evolve-skill <nazwa-skilla>`.
- Użytkownik prosi o poprawienie skilla na podstawie doświadczeń.
- Podsumowanie sesji zasygnalizowało wzorzec gotowy do ewolucji, a użytkownik
  zdecydował, że rusza.

**Nie do:** pisania nowego skilla od zera (to `superpowers:writing-skills`),
jednorazowej ręcznej poprawki dyktowanej przez użytkownika (to zwykła edycja).

## Krok 1 — znajdź skill i jego wiki

1. Skill: najpierw `<katalog roboczy>/.claude/skills/<nazwa>/`, potem
   `~/.claude/skills/<nazwa>/`. Brak w obu → powiedz i zakończ.
2. Wiki: skill z repo → `<repo>/.claude/wiki/`; skill globalny →
   `~/.claude/wiki/`.
3. **Wiki globalne czytasz zawsze**, także dla skilla z repo — wzorzec ogólny
   (np. ruszanie bez decyzji użytkownika) często wymaga reguły w konkretnym
   skillu.

## Krok 2 — czytaj w tej kolejności

1. `index.md` — co w ogóle jest.
2. `skill-impact.md` — **co już próbowano**. Propozycje odrzucone są zakazane
   do powtórzenia; czytasz ich pełne diffy, żeby rozpoznać powtórkę także po
   przeformułowaniu.
3. Strony wzorców dotyczących tego skilla oraz wzorce ogólne. Bierzesz pod
   uwagę wzorce o statusie `otwarty` i `nawrót`; `zaadresowany` bez nawrotu
   pomijasz.
4. `SKILL.md` skilla — obecna treść.
5. `PURPOSE.md`, jeśli istnieje — po co skill powstał i co już adresuje.

## Krok 3 — zaproponuj dokładnie jedną zmianę

Propozycja zawiera cztery elementy:

1. **Diff** `SKILL.md` w bloku ```diff — patch, nie przepisanie pliku.
2. **Adresowane wzorce** — nazwy stron i cytat ich sekcji „Rozwiązanie".
3. **Czego już próbowano** — co mówi `skill-impact.md` o tym skillu i dlaczego
   ta propozycja jest inna.
4. **Czego zmiana nie robi** — jedno zdanie o wzorcach zostawionych na później.

Ograniczenia:

- **Jedna zmiana, jeden skill.** Wiele wzorców naraz → wybierz ten z największą
  liczbą dowodów i powiedz, które zostawiasz.
- **Patch, nie przepisanie.** Jeśli zaadresowanie wzorca wymaga zmiany
  większości pliku, powiedz to wprost i zatrzymaj się — to zadanie dla
  `superpowers:writing-skills`, nie dla ewolucji.
- **Nie tworzysz nowych skilli.** Wzorzec wymagający nowego skilla zgłaszasz
  i odsyłasz do `writing-skills`.
- **Za mało dowodów to wynik, nie porażka.** Powiedz „wzorce mają po jednym
  dowodzie, proponuję poczekać" i zakończ.

## Krok 4 — bramka

Użytkownik akceptuje, odrzuca albo modyfikuje. **Bez jego decyzji nie
zapisujesz niczego** — ani `SKILL.md`, ani wiki. Brak odpowiedzi nie jest zgodą.
Timeout narzędzia do pytań nie jest zgodą. Deklaracja użytkownika, że jest
zajęty i „działaj dalej", też nie jest zgodą na tę konkretną zmianę — jest
prośbą o poczekanie.

## Krok 5 — zapis po akceptacji

**Reguła kierowania zapisu.** Rejestr prób (`skill-impact.md`) i log (`log.md`)
prowadzi **wiki tego skilla**, który zmieniasz — wiki repo dla skilla z repo,
wiki globalne dla skilla globalnego — niezależnie od tego, z którego wiki
pochodzi adresowany wzorzec. Status samego wzorca zmieniasz natomiast **w tym
wiki, w którym ten wzorzec leży** — może to być inne wiki niż to z rejestru.

1. Zastosuj diff do `SKILL.md`.
2. `PURPOSE.md` skilla: jeśli nie istnieje, załóż go — sekcja „Pochodzenie"
   odtworzona z gita (`git log --follow -- <ścieżka>`), speców i dziennika
   sesji, z `?` przy każdym elemencie bez źródła. Jeśli istnieje — dopisz wpis
   do „Historii ewolucji". Obok tego wpisu dopisz w sekcji „Adresowane wzorce"
   link do adresowanego wzorca w postaci `[nazwa](../../wiki/patterns/nazwa.md)`;
   jeśli w tej sekcji stoi „brak — skill sprzed wiki", zastąp tę wartość nowym
   wpisem.
3. `skill-impact.md` — zgodnie z regułą kierowania zapisu wyżej: wpis z datą,
   nazwą skilla, wzorcami, streszczeniem i **pełnym diffem**.
4. Wzorce: status na `zaadresowany (data, <skill>)` — zgodnie z regułą
   kierowania zapisu wyżej, w wiki, w którym dany wzorzec leży; przepisz
   `index.md` tego wiki w całości.
5. `log.md` — zgodnie z regułą kierowania zapisu wyżej: wpis o decyzji.
6. Jeśli zmiana dotyka opisu skilla widocznego dla użytkownika w vaultcie —
   zaktualizuj wiersz w tabeli skilli `README.md` vaulta.
7. **Nie commituj.** Zmiany zostają w drzewie roboczym.

## Krok 6 — zapis po odrzuceniu

Wpis w `skill-impact.md` — zgodnie z regułą kierowania zapisu z Kroku 5 (wiki
tego skilla, nie wiki adresowanego wzorca) — z **pełnym diffem odrzuconej
propozycji** i powodem podanym przez użytkownika. Statusy wzorców bez zmian.
Wpis w `log.md` tego samego wiki. Bez tego zapisu ta sama propozycja wróci za
miesiąc.

## Red flags — zatrzymaj się

- „Ta odrzucona propozycja była słaba, moja jest lepiej sformułowana" —
  przeformułowanie odrzuconej propozycji to ta sama propozycja.
- „Użytkownik jest zajęty, wprowadzę zmianę i pokażę mu wynik" — brak odpowiedzi
  nie jest zgodą.
- „Plik i tak jest zabałaganiony, przepiszę go przy okazji" — przepisanie to
  `writing-skills`; ewolucja jest patchem.
- „Wzorzec ma jeden dowód, ale widać, o co chodzi" — jeden dowód to hipoteza.
- „Zaadresuję trzy wzorce naraz, są powiązane" — jedna zmiana na raz, inaczej
  nie wiadomo, która pomogła.
- „Wiki nic nie mówi, ale wiem, co poprawić" — to nie jest ewolucja, tylko
  zwykła edycja; powiedz to wprost.

## Częste błędy

| Błąd | Zamiast tego |
|---|---|
| Propozycja z własnej oceny skilla | Propozycja z dowodów w wiki |
| Pominięcie `skill-impact.md` | Czytasz go **przed** propozycją |
| Zapis bez decyzji użytkownika | Bramka w Kroku 4 |
| Odrzucona propozycja bez wpisu | Wpis z pełnym diffem, inaczej wróci |
| Przepisanie całego `SKILL.md` | Patch albo odesłanie do `writing-skills` |
| Kilka zmian w jednej propozycji | Jedna atomowa zmiana |
| Commit po akceptacji | Zmiany zostają niezacommitowane |
