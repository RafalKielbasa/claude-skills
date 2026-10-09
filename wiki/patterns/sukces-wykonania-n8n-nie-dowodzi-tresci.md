# sukces-wykonania-n8n-nie-dowodzi-tresci

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Wykonanie n8n kończy się statusem `success`, a wynik jest pusty albo błędny.
Error Workflow (alert) się nie uruchamia, bo nic nie rzuciło błędem. Bez
kontroli treści taki tydzień przechodzi po cichu: „cichy tydzień”, pusta
wiadomość albo tekst zastępczy.

## Przyczyna źródłowa
Kilka węzłów n8n zamienia porażkę w dane:
- HTTP Request z paginacją oddaje treść błędu (`{message, status}`) jako
  zwykły element, a wtedy `retryOnFail` nigdy nie startuje;
- agent LangChain przy `finishReason: MALFORMED_FUNCTION_CALL` zwraca
  `output: ""`;
- `onError: continueRegularOutput` z fallbackiem w tekście Slacka zamienia
  błąd w „(analiza niedostępna…)”;
- wyłączony węzeł Slack przepuszcza dane ze statusem `success` (0 ms).

Status wykonania mierzy więc to, czy węzły rzuciły, a nie to, co wyprodukowały.

## Dowody
- 2026-10-09, sesja ece85169-32f2-44b7-9695-689c071f34ce (id claude.ai niedostępny), `29_weekly_project_report`:
  - exec 27934: 401 „Bad credentials” wrócił jako strona bez `items`, a
    `Compute Metrics` złożył z tego raport „cichy tydzień” z ostrzeżeniami o
    organizacjach;
  - exec 27962: `success`, ale narracja pusta (Gemini
    `MALFORMED_FUNCTION_CALL`);
  - `31_daily_trends_digest`: `continueRegularOutput` z fallbackiem w tekście
    Slacka.
  - Obie dziury zamknięto węzłami-strażnikami, które rzucają błąd (strona bez
    `items`, pusta narracja), więc `40_error_notify` alarmuje.

## Rozwiązanie
W każdym workflowie n8n, który publikuje wynik HTTP albo LLM, dodać przed
publikacją węzeł Code rzucający błąd przy pustej lub błędnej treści. Nie
używać `continueRegularOutput` z tekstem zastępczym tam, gdzie porażka ma
alarmować. W biegu testowym czytać wyjścia węzłów (treść, `finishReason`), a
nie sam status wykonania.
