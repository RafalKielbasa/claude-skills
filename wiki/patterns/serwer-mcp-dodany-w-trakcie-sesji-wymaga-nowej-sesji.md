# serwer-mcp-dodany-w-trakcie-sesji-wymaga-nowej-sesji

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Użytkownik dodaje serwer MCP przez `claude mcp add` w trakcie rozmowy i pisze „połączony",
oczekując pracy w tej samej sesji. Serwer jest zdrowy, ale jego narzędzi nie ma — trzeba nowej
sesji, a przekazanie kontekstu do niej powstaje dopiero wtedy, gdy wyjdzie, że narzędzi brak.

## Przyczyna źródłowa
Definicje narzędzi MCP ładują się przy starcie sesji. Instrukcja „przeładuj okno" kosztuje
użytkownika utratę kontekstu rozmowy, więc ją pomija, jeśli nie dostał jednocześnie gotowego
punktu wznowienia.

## Dowody
- 2026-10-08, sesja c653066f-3e46-4d11-8f8b-71a5c9d865a7: instrukcja dodania `n8n-prod`
  zawierała krok „przeładuj okno", Rafał został w sesji i napisał „zrobione, prod połączony".
  `claude mcp list` → `✔ Connected`, `ToolSearch "+n8n-prod"` → `No matching deferred tools
  found`; prompt startowy dla nowej sesji podany dopiero w następnej turze. Obserwacja cienka
  (jedna stracona tura), zapisana, bo dodawanie serwerów MCP w trakcie pracy się powtarza.

## Rozwiązanie
Gdy prosisz o dodanie serwera MCP, w tej samej wiadomości podaj komendę, zdanie „narzędzia będą
dopiero w nowej sesji" i gotowy prompt startowy do wklejenia w nowej rozmowie (zadanie, stan,
ścieżki do planów).
