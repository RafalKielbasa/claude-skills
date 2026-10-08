# odczyt-tokenu-z-konfiguracji-mcp-blokowany-przez-klasyfikator

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Użytkownik zgłasza „chyba błędny klucz" przy serwerze MCP. Claude sięga do `~/.claude.json`, żeby
zobaczyć wpis z nagłówkiem `Authorization`, i dostaje twardą odmowę klasyfikatora auto mode
(`[Credential Materialization]`), mimo że skrypt wypisywał token zredagowany.

## Przyczyna źródłowa
Naturalna ścieżka diagnozy („zobacz, co jest skonfigurowane") prowadzi przez pole z
poświadczeniem. Klasyfikator ocenia odczyt pola, nie to, co trafia na wyjście, więc redakcja
w skrypcie nie ma znaczenia; odmowa obejmuje też każde obejście tym samym celem.

## Dowody
- 2026-10-08, sesja c653066f-3e46-4d11-8f8b-71a5c9d865a7: `node -e` czytający `mcpServers`
  z `~/.claude.json` i maskujący nagłówki → odmowa. Diagnoza przeszła na stronę Rafała:
  `claude mcp list` (status bez nagłówków), test tokenu przez `Read-Host` + `Invoke-WebRequest`
  na `/mcp-server/http` (200/401), `claude mcp remove` i ponowne `add`. Po poprawce
  `claude mcp list` → `n8n-prod … ✔ Connected`.

## Rozwiązanie
Problemy z autoryzacją MCP diagnozuj wyłącznie przez `claude mcp list` i przez sondę końcówki
bez poświadczeń (`curl` → kod i komunikat 401). Token sprawdza użytkownik u siebie (`Read-Host`,
żeby nie trafił do historii ani do rozmowy); nie otwieraj wpisów konfiguracji zawierających
`headers` ani `env`, także zredagowanych.
