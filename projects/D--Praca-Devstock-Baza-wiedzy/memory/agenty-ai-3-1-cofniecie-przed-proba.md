---
name: agenty-ai-3-1-cofniecie-przed-proba
description: "Lesson 3.1 agenty-ai - Rafał revokes n8n.cloud Google access by hand before every dry pass and the final take (decision 2026-10-30, variant B); Google's repeat-consent screen otherwise stops step 7"
metadata:
  node_type: memory
  type: project
  originSessionId: 8c81b3d1-cb64-4c72-97ce-98d2b72ade56
  modified: 2026-11-03T10:23:35.707Z
---

Lesson 3.1 of agenty-ai (issue #795) runs `google_sign_in` for Drive in step 7. After each attempt Google remembers the Drive grant. The next attempt then gets "n8n Cloud ma już niektóre uprawnienia dostępu" ("Usługi: 3", no checkboxes), and the core does not pass that screen: dry passes 4 and 7 stopped there.

On 2026-10-30 Rafał chose variant B: he revokes n8n.cloud access by hand before every dry pass and before the final take. He rejected the alternative, a core key that would let the automat revoke on its own.

**Why:** the revocation kills every n8n Google credential. The reset recreates Gmail and Sheets (shared_state `recreate`), and step 7 then shows the incremental Drive consent, which the core passes (passes 6 and 8).

**How to apply:**
- Before each 3.1 attempt, ask him to revoke on a G2 card, with the station marked `waiting`.
- After his reply:
  1. run `google-grant <lekcja> --revoked <time of his reply> --by "..."`;
  2. add a `karta dopisz konto` entry;
  3. mark the station `working`;
  4. run the pass.

**Not for 3.3:** on 2026-11-03 (consistency gate of lesson 3.3, issue #847) Rafał decided he does NOT revoke before 3.3's dry passes and take. 3.3 shows no Google consent screen, and a revoke kills the "Google Drive - Zielony Ogrod" OAuth credential, which is not in `shared_state`, so the reset stops on STAN. Recorded in 3.3's `video/konspekt-nagrania.md` ("Przygotowanie przed nagraniem").

Related: [[skrzynka-kursu-agenty-ai]], [[profil-kursu-drugie-konto-google]].
