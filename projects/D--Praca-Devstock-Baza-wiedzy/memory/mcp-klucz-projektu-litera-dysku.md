---
name: mcp-klucz-projektu-litera-dysku
description: "VS Code otwiera repo jako d:\\..., terminal jako D:\\... - serwery MCP z zasięgiem local widać tylko pod jednym kluczem; `claude mcp remove` kasuje token OAuth serwera"
metadata:
  node_type: memory
  type: reference
  originSessionId: fda79c08-275f-4424-9045-38899980dee1
  modified: 2026-10-08T11:01:51.086Z
---

`~/.claude.json` trzyma serwery MCP zasięgu `local` pod kluczem ścieżki projektu, a wielkość litery dysku się liczy:
terminal zapisuje `D:/Praca/Devstock/Baza wiedzy`, sesja VS Code czyta `d:/Praca/Devstock/Baza wiedzy` (to samo dotyczy
`saas app`). Serwer dodany z terminala nie istnieje w sesji VS Code. Zmiana nazwy folderu tego nie naprawia.

Sprawdzone 2026-10-08:
- dopisanie wpisu pod drugi klucz: `cmd /c "cd /d d:\... && claude mcp add ..."` (`cmd` zachowuje małą literę dysku);
  token OAuth był wtedy współdzielony - nowy wpis od razu `Connected`.
- **`claude mcp remove <nazwa>` kasuje zapisany token OAuth serwera** - po usunięciu duplikatu `heygen` oba wpisy
  wymagały ponownego logowania. Nie usuwaj wpisu OAuth, jeśli nie chcesz logować się od nowa.
- wpis zasięgu `user` nie dziedziczy tokenu wpisu `local` (`Needs authentication`).
- wpis z tokenem w nagłówku (`n8n-prod`) kopiuje się bez logowania (`claude mcp add-json` z treścią starego wpisu,
  skrypt w Node, bez wypisywania nagłówka; ścieżki Windows przez Write, nie heredoc - [[bash-heredoc-backslash-halved]]).
- sesja nie wczytuje nowego serwera sama: `/mcp` albo nowa rozmowa.

Stan 2026-10-08: `heygen` i `n8n-prod` lokalnie pod oboma kluczami tego repo; `heygen` czeka na jedno logowanie OAuth.
