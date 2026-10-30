# blad-narzedzia-w-kroku-czatu-wyglada-jak-zmiennosc-modelu

- **Skill:** kurs-nagrywanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
A chat step stops with "run N has no call of <tool> with {…}" (class `INNY`). That reads like model variance: the agent
did not use the tool. In lesson 3.1 the same message had two different causes in two takes in a row:
- a Google Drive API error (`Forbidden`, quota exceeded);
- the model not descending into the subfolder.

## Przyczyna źródłowa
The `sprawdz` predicate of a chat step only checks whether the expected tool call is in the run. The tool's own error
output (the node in red, "Forbidden - perhaps check your credentials?" in Output) never reaches the stop message.
Triage has to go by the class line, which is `INNY` for both causes. For the no-progress rule both stops have the same
signature (`krok 23, INNY, run # has no call…`).

## Dowody
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny), lesson agenty-ai 3.1, take
  `lekcja-v1`.
  - Attempt 1, run 948: the frame `ffmpeg -ss 344.5 surowe.mp4` showed "Quota exceeded for quota metric 'Queries' …
    drive.googleapis.com", with the node "Search files and folders" in red.
  - Attempt 2, run 951: the frame showed an answer about `wiosna-2026` with no second call.
  - Without the frames both would have gone to the card as model variance. The no-progress refusal still counted them
    as the same signature.

## Rozwiązanie
For an `INNY` stop of a chat step (`send_chat_message`, a `chat_reply` / tool-call check), extract the frame at the
step's end and read the tool output panel before triage:
- a quota or availability error (`Forbidden`, `quota exceeded`, 429, 5xx) is `LIMIT_SIEC` (wait and retry; it does not
  count as no progress);
- an answer with no call is model variance.

In the core: an error from a tool node in the run should go into the stop message and the triage class.
