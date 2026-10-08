# n8n-mcp-renamenode-nie-przepisuje-kodu

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Operacja `renameNode` w `update_workflow` serwera MCP n8n zmienia nazwę węzła i połączenia, ale
nie przepisuje odwołań `$('Stara nazwa')` w `jsCode` innych węzłów Code. Walidacja przechodzi, a
workflow po publikacji rzuca błąd przy pierwszym wykonaniu, które dojdzie do takiego węzła.

## Przyczyna źródłowa
Edytor n8n przy zmianie nazwy przechodzi po wyrażeniach i kodzie, a operacja MCP robi tylko
podmianę w strukturze węzłów i połączeń. Kod Code to dla niej nieprzezroczysty string, a
walidator workflowu nie sprawdza, czy nazwy w `$()` istnieją.

## Dowody
- 2026-10-08, sesja claude.ai/code/session_01PEmJYYAK5hBJGhZ3cKxfgs: `Parse Classification` →
  `Compute Meeting Date` w `01_Process_meeting`; draft na prodzie zapisany (41 operacji, bez
  błędów), ale `Apply Cuts` dalej czytał `$('Parse Classification')`. Wyłapał to dopiero test
  repo „każde `$(...)` wskazuje istniejący węzeł" na eksporcie draftu (RED: „Apply Cuts nie czyta
  daty z Compute Meeting Date"); naprawione jednym `setNodeParameter /jsCode` przed publikacją.

## Rozwiązanie
Po każdym `renameNode` przez MCP: w tej samej operacji `setNodeParameter /jsCode` dla węzłów
czytających starą nazwę (znaleźć grepem po eksporcie). Przed publikacją wyeksportować draft
(`get_workflow_details`) i sprawdzić, że każde `$('…')` w parametrach wskazuje istniejący węzeł.
Dodatkowo: `get_workflow_details` nie zwraca `credentials`, więc przypisania credentiala nie
zweryfikujesz z MCP.
