---
name: wave1-backlog-2026-11-18
description: "2026-11-18 przegląd projektu (artefakt 42 propozycji) → fala 1 wysłana: epiki #220-#222 + CP-112..CP-144 = #223-#255, wszystkie w Backlogu; co odpadło i co czeka na decyzje"
metadata:
  node_type: memory
  type: project
  originSessionId: eebbc01a-9eaa-4781-bdda-f178df66d02b
  modified: 2026-11-18T14:23:40.755Z
---

**2026-11-18** Rafał poprosił o nowe zadania. Przegląd całego repo (2 agenty: API i web) dał artefakt
„Kierunki rozwoju edu-saas” z 42 propozycjami w 6 kierunkach i tabelą 13 decyzji:
https://claude.ai/artifact/AFfHff3YL3WHYTmRptUC6r

**Fala 1 wysłana** (skill github-tickets, self-check + codex, „OK” Rafała na wszystkie rekomendacje):
- nowe epiki: #220 Catalog search and list limits, #221 School team management, #222 Production readiness;
- CP-112..CP-144 = #223..#255 (numer issue = numer CP + 111), podpięte także pod #122, #128, #167, #178;
- wszystkie w kolumnie Backlog tablicy edu-saas, bez assignee; zależności „blocked by” ustawione natywnie.
- Drafty i `SPLIT.md` (ramy) w gitignorowanym `docs/superpowers/plans/tickets/2026-11-18-wave-1/`.

**Dwa realne błędy znalezione przy pisaniu** (dodane do fali za zgodą): CP-143 #254 webhook Stripe
zapisuje na kurs przy nieopłaconej płatności odroczonej i gubi e-mail potwierdzenia, gdy powrót ze
Stripe wyprzedzi webhook; CP-144 #255 `GET /lessons/:id` oddaje uczniowi quiz z `correctIndex`.

**Odpadło z fali 1 i dlaczego:** paginacja zespołu (lista to tylko kadra), „Moje kursy” i lista kursów
twórcy (mały zysk), stan pusty listy kursów (już w CP-102 #182), migracje w Cloud Build (decyzja o
dostępie do bazy), avatar z pliku (decyzja o publicznym prefiksie w GCS = zmiana GCP), UI rankingu kursu
i stron certyfikatów (brak widoków w Figmie).

**Bez ticketu:** limit rozmiaru w edytorze wideo nie działa (`maxSizeBytes` nie przychodzi z API);
tekst epiku #122 mówi Mailerlite zamiast MailerSend (poprawia Rafał).

**Decyzje przyjęte w treściach (D2, wariant A):** m.in. usunięcie z zespołu = obniżenie do `user`;
publiczna weryfikacja certyfikatu i lista certyfikatów ze wszystkich szkół jako świadome wyjątki od
reguł epiku #128; treści e-maili CP-118..122 to propozycje do review.

**How to apply:** przy pytaniu „co dalej w edu-saas” zacznij od fal 2–3 z artefaktu (decyzje i specy:
reset hasła, wypłaty dla twórców przez Stripe Connect, społeczność), nie od nowego przeglądu. Powiązane:
[[github-issue-candidates-2026-08]], [[subscription-model-spec]].
