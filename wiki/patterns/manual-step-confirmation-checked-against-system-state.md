# manual-step-confirmation-checked-against-system-state

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
When the user confirms a manual change in an external system ("gotowe"), Claude reads the system's state
through its API before starting the automated step that depends on it. A confirmation that does not match the
state stops the next step instead of running it on a wrong start.

## Przyczyna źródłowa
A manual step in a web UI can look finished to the person and still not be saved: a modal closed before
"Save", a browser closed before autosave, a change made in another window or account. The confirmation
describes what the person did, not what the system holds.

## Dowody
- 2026-10-12, sesja 96436fe2-135f-4db8-9a6a-e2d0011a65cc (id claude.ai niedostępny): before take 2 of the
  M00L02 dry pass Rafał answered "Gotowe" twice for the Google credential (create, rename to
  "Google - Zielony Ogrod", select in the node). The n8n API read showed first no credential, then
  `Google Sheets account 2` not renamed and `cred=null` on the node. Take 2 was not started; its steps 12, 24
  and 28 would have failed on that state.

## Rozwiązanie
After a user confirms a manual change that an automated step depends on, read the state from the system (API,
list, file) and compare it with what the step needs. Quote the literal readout to the user when it differs,
and name the most likely reason (unsaved modal, closed too early, other window) instead of asking again in
general terms.
