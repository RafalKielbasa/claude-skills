---
name: feedback-plan-review-comment-scope
description: "Komentarz do planu kursanta/praktykanta na GitHubie zawiera wyłącznie niewypełnione elementy mierzone wytycznymi do przygotowania planu — bez rad do kodu, rubryki i kryteriów akceptacji"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: f69c1f28-4175-5f77-be8c-444dcd5d50bf
  modified: 2026-09-26T14:11:26.617Z
---

Recenzując plan implementacyjny praktykanta (PR z planem), komentarz publikowany na GitHubie ma zawierać
**tylko to, czego plan nie zawiera, mierzone wytycznymi do przygotowania planu** — czyli sekcją „Szablon
planu" z briefu/README i decyzjami, które brief każe rozstrzygnąć w planie. Każda pozycja cytuje wytyczną,
w którą trafia. Poza komentarz wypada: rady implementacyjne i diagnozy kodu, sprzeczności wewnętrzne planu,
uwagi z rubryki oceny, kryteria akceptacji implementacji. Format, który zadziałał: tabela
`Sekcja | Wytyczna | Czego brakuje` plus zamykający akapit wyliczający, co jest zgodne.

**Why:** Rafał nazwał mieszanie tych miar „wszędzie były pomarańcze" — plan oceniany naraz rubryką,
kryteriami akceptacji i moim czytaniem kodu przestaje być sprawdzalny dla autora, a recenzja przestaje
być porównywalna między kandydatami. Pełną analizę (błędy, sprzeczności, jakość) chce dostać w rozmowie,
nie w komentarzu.

**How to apply:** najpierw zweryfikuj twierdzenia planu w kodzie i pokaż mu całość w czacie, potem złóż
z tego wąski komentarz w powyższym zakresie. Nie publikuj bez jawnego „wyślij" — zgoda dotyczy jednej
prośby. Trzymaj ten sam próg dla obu kandydatów; różnicę w traktowaniu tej samej luki zgłoś przed
wysyłką. Powiązane: [[internship-exam-2026-09]], [[feedback-no-commits-user-only]],
[[feedback-junior-tickets-no-code]].
