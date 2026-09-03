---
name: feedback-per-task-review-gate
description: "Po każdym zadaniu planu zatrzymaj się na review Rafała i jego commit, zanim ruszysz następne"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7844f44c-0244-4d6d-b515-5c3902552ad9
  modified: 2026-08-31T13:00:47.130Z
---

Przy egzekucji planów wykonawczych (subagent-driven albo `executing-plans`): po
domknięciu **każdego pojedynczego zadania** zatrzymaj się i oddaj robotę Rafałowi
do review i do commita. Nie startuj następnego zadania, dopóki nie powie, że
można. Ustalone 2026-08-31 w trakcie egzekucji etapu 1 modelu członkostwa.

**Why:** ciągła egzekucja bez przerw daje na końcu jeden wielki diff, którego nie
da się sensownie przejrzeć, i miesza w drzewie roboczym pracę wielu zadań naraz.
W tej sesji pokazało to skutek wprost: Rafał zacommitował w trakcie biegu
(`7d12b73`) i złapał zadanie 5 w fazie RED — testy bez implementacji, commit
czerwony. Bramka po każdym zadaniu daje mu spójny, mały diff do oceny i naturalny
moment na commit. Zob. [[feedback-no-commits-user-only]].

**How to apply:** zadanie kończy się dopiero wtedy, gdy review subagenta jest
czyste **i** Rafał zamknął swoje review oraz commit. Zamiast „idę dalej" napisz,
co jest gotowe, w których plikach, i czekaj. To nadpisuje regułę „Continuous
execution" ze skilla `superpowers:subagent-driven-development`, która każe nie
przerywać między zadaniami — ta reguła Rafała jest ważniejsza. Commitów nadal nie
robisz sam.

**Kształt raportu (ustalone 2026-09-02):** każdy raport zamykający zadanie kończy
się **propozycją treści commita, jako ostatnią rzeczą w wiadomości** — nic po
niej, żadnego podsumowania ani pytania „co dalej". Rafał kopiuje ją prosto z dołu
ekranu, więc wszystko, co po niej postawisz, musi przewijać. Wiadomość commita po
angielsku (zob. [[feedback-code-always-english]]), w stylu `feat: <opis>` plus
ciało wyjaśniające *dlaczego*. Jeśli commit wymaga dodania plików nieśledzonych,
podaj komendy `git add` **przed** treścią commita, nie po niej.

Bramka stoi na granicy zadania, nie po każdej rundzie poprawek: runda poprawek
wewnątrz zadania to nadal to samo zadanie, a zatrzymywanie się po każdej dałoby
Rafałowi kilka niepełnych stanów zamiast jednego kompletnego.
