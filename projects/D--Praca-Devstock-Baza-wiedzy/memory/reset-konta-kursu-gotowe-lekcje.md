---
name: reset-konta-kursu-gotowe-lekcje
description: "Przy bramce B4 (start_state, autonomy full) nie chroń zasobów konta kursu potrzebnych lekcjom już nagranym i zaakceptowanym"
metadata:
  node_type: memory
  type: feedback
  originSessionId: a7fb8394-0358-4975-bc18-9da4d6298a8a
  modified: 2026-10-16T07:08:01.488Z
---

Gdy reset `start_state` nowej lekcji kasuje workflow albo credential, z którego korzystały lekcje już nagrane, zmontowane i zaakceptowane (np. "Zamowienie - proba", credential Google z M00L02 przy re-renderze M01L02), nie proponuj zachowania go "na wypadek ponownego nagrania". Rafał: stan konta dla gotowych lekcji "kompletnie nas nie interesuje" (2026-10-16).

**Why:** gotowe lekcje są nagrane, wyedytowane i gotowe do publikacji; ich ponowne nagranie nie jest planowane, więc ochrona ich stanu tylko dokłada pytań w bramce.

**How to apply:** w bramce B4 pokazuj listę trwałych usunięć jak dotąd, ale bez wariantu "zachowaj zasób dla wcześniejszej lekcji"; skutek dla gotowych lekcji co najwyżej jedną linią informacyjnie. Bramka B4 i zgoda na koszt zostają bez zmian. Powiązane: [[agenty-ai-m00l01-rerender]].
