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

## Rozwiązanie
Po ręcznej zmianie pliku, który czyta narzędzie projektu (bilet, manifest, konfiguracja), wczytaj go funkcją
odczytu tego narzędzia i pokaż jej wynik (błędy albo sparsowany obiekt). Dopiero potem rób commit. W zwykłych
skalarach YAML unikaj `": "` i `" #"`; gdy tekst ich potrzebuje, użyj `>-` albo cudzysłowu.
