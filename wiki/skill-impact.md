# Wiki — rejestr zmian skilli (globalne)

Ślad każdej próby zmiany skilla: zaakceptowanej i odrzuconej. Skill
`evolve-skill` czyta ten plik przed propozycją i nie wolno mu powtórzyć
propozycji już odrzuconej. Pełny diff zostaje także przy odrzuceniu — to
jedyny sposób, żeby rozpoznać powtórkę.

Format wpisu:

    ## YYYY-MM-DD — <skill> — zaakceptowana | odrzucona
    - **Wzorce:** <nazwy stron wiki>
    - **Zmiana:** <streszczenie w 1–3 zdaniach>
    - **Powód decyzji:** <przy odrzuceniu: powód użytkownika>
    - **Nawrót:** YYYY-MM-DD, <wzorzec>
    (pod spodem blok diff z pełnym diffem SKILL.md)

## Wpisy

## 2026-09-03 — podsumuj-sesja-claude — zaakceptowana
- **Wzorce:** instrukcja-zakotwiczona-na-pozycji-nie-na-naglowku
- **Zmiana:** Krok 4 dostał punkt precyzujący, że „góra pliku" znaczy „pod nagłówkiem `# Praca z Claude — dziennik sesji`", a sekcje leżące nad tym nagłówkiem zostają nietknięte. Powód: w `praca-z-claude.md` stanęła nad dziennikiem sekcja `# Pomysły` z tabelą, a dotychczasowe brzmienie pozwalało wstawić brief przed nią.
- **Powód decyzji:** zmiana wprowadzona wprost na prośbę użytkownika („tak, dopisz to zdanie do skilla"), poza ścieżką `evolve-skill`; wpis dopisany ręcznie, żeby rejestr pozostał kompletny.

```diff
--- SKILL.md (przed)
+++ SKILL.md (po)
@@ ## Krok 4 — dopisz na GÓRZE pliku @@
 - Nowy wpis idzie **nad** poprzednie (odwrotnie chronologicznie) — rano partner widzi najnowszy pierwszy.
+- „Góra pliku" znaczy **pod nagłówkiem `# Praca z Claude — dziennik sesji`**, nie na fizycznym początku pliku. Nad tym nagłówkiem mogą leżeć inne sekcje (np. tabela pomysłów) — nie ruszasz ich i nie wstawiasz wpisu przed nimi.
 - Jeśli plik pusty/nie istnieje: załóż go z nagłówkiem `# Praca z Claude — dziennik sesji`, potem wpis.
 - **Dopisuj, nie nadpisuj** — starych wpisów nie kasujesz.
 - Po zapisie podaj partnerowi ścieżkę i 1-zdaniowe potwierdzenie.
```
