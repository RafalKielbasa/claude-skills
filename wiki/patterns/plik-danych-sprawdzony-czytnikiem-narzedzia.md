# plik-danych-sprawdzony-czytnikiem-narzedzia

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Ręcznie edytowany plik danych, który czyta narzędzie (bilet produkcyjny YAML), zostaje po edycji wczytany tą
samą funkcją, której używa narzędzie, a nie oceniony wzrokiem albo ogólnym parserem. Błąd składni wychodzi
od razu, zanim plik trafi do commita albo do przebiegu na koncie.

## Przyczyna źródłowa
Plik wygląda poprawnie, a o jego ważności decyduje parser narzędzia z jego walidacją (znane klucze, typy, daty).
Edycja przez `sed` albo heredoc nie widzi składni YAML. Na przykład zwykły skalar w wielu liniach z `": "` w
środku staje się dla parsera mapą.

## Dowody
- 2026-10-26, sesja 4bd53d28-0d05-40dd-bf31-94901ea828ea (id claude.ai niedostępny; Baza wiedzy, bilet lekcji
  agenty-ai 2.2).
  - Edycja: `sed` podniósł `tts_regenerations` z 1 na 2 i dopisał w `notes` zdanie z „(…, D2 A): the …”.
  - Sprawdzenie: `readTicket` z `tools/nagrywanie/src/ticket.js`, uruchomione przez `node --input-type=module`,
    zwróciło „niepoprawny YAML - Nested mappings are not allowed in compact mappings at line 13”.
  - Poprawka: przecinek zamiast dwukropka, ponowny odczyt z `"bledy":[]`.
  - Bez tego sprawdzenia bilet z błędem wszedłby do `main`, a pierwszy przebieg lekcji stanąłby na G1.
- 2026-10-27, sesja 520bd4df-d397-46bb-a9d4-6bab0ba6c1fb (id claude.ai niedostępny; Baza wiedzy, bilet lekcji
  agenty-ai 2.3).
  - Bilet zapisałem przez `Write`, z `notes` jako zwykłym skalarem w wielu liniach, bez `": "`.
  - Przed commitem uruchomiłem dwie komendy narzędzia, które czytają bilet. `sprawdz` dał czysty wynik:
    „39 kroków automatu … 41 kroków planu i 47 akapitów lektora pokryte”. `budzet --dry-passes 14 --retakes 3`
    dał `executions = 2 × (14 + 1 + 3) + 10 … = 46`, zgodnie z budżetem w pliku.
  - Dopiero potem commit `3674d860`.
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny; Baza wiedzy, bilet lekcji
  agenty-ai 3.1). Tym razem kolejność była odwrotna i kosztowała dodatkowy commit.
  - Edycja `Edit`: `budget.tts_regenerations` 2 → 3 i notatka „(bilet produkcyjny (G1), Rafał "A, podnieś licznik
    do 3"): tts_regenerations 2 -> 3”, z `": "` w zwykłym skalarze.
  - Commit `308f8add` przed sprawdzeniem.
  - Dopiero `sprawdz` wypisał „video/ticket.yaml odrzucony … Nested mappings are not allowed in compact mappings at
    line 16”.
  - Poprawka `) -` zamiast `):` w commicie `49aee05c`, potem ponowny `sprawdz` i `YAML.parse` z
    `budget.tts_regenerations: 3`.
  - Ten sam znak co 2026-10-26: reguła jest w Rozwiązaniu, ale przy szybkiej dopłacie do biletu commit poszedł
    pierwszy.

## Rozwiązanie
Po ręcznej zmianie pliku, który czyta narzędzie projektu (bilet, manifest, konfiguracja), wczytaj go funkcją
odczytu tego narzędzia i pokaż jej wynik (błędy albo sparsowany obiekt). Dopiero potem rób commit. W zwykłych
skalarach YAML unikaj `": "` i `" #"`; gdy tekst ich potrzebuje, użyj `>-` albo cudzysłowu.
