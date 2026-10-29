# prisma-migrate-reset-wymaga-zgody-uzytkownika-dla-agenta

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
`npx prisma migrate reset --force` uruchomiony przez Claude Code kończy się błędem, zanim dotknie bazy:
„Prisma Migrate detected that it was invoked by Claude Code”. Komenda przechodzi dopiero ze zmienną
`PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`, której wartością ma być dosłowna treść wiadomości
użytkownika wyrażającej zgodę. Krok planu oparty na resecie staje i kosztuje turę.

## Przyczyna źródłowa
Prisma (tu 7.8) sama wykrywa wywołanie przez agenta AI i traktuje destrukcyjne komendy migracji jak
wymagające jawnej zgody człowieka, niezależnie od tego, czy baza jest deweloperska. Komunikat zastrzega,
że żadna wcześniejsza wiadomość użytkownika nie liczy się jako zgoda, więc zgody nie da się „odziedziczyć”
z ogólnego polecenia („uruchom projekt”). Claude planuje reset odruchowo, bo jest najkrótszą drogą do
świeżego seeda.

## Dowody
- 2026-10-29, sesja 1f1d010e-6776-42d9-8434-75b5bef761bc (id claude.ai niedostępny; saas app): na prośbę
  „uruchom projekt na branchu konrada” `npx prisma migrate reset --force` na osobnej bazie
  `course_platform_cp106_dev` dostał odmowę Prismy. Reset okazał się zbędny: `npx prisma migrate status`
  („Database schema is up to date!”) i zapytanie `psql` o nieprzeczytane powiadomienia kont z seeda
  pokazały świeży stan, więc aplikacja wstała bez resetu, a powtórkę od zera opisałem jako wymagającą zgody.

## Rozwiązanie
Zanim zaplanujesz `prisma migrate reset` (albo inną destrukcyjną komendę Prismy), sprawdź, czy jest
potrzebny: `npx prisma migrate status` plus jedno zapytanie o dane, na których stoi zadanie. Gdy jest
potrzebny, poproś użytkownika o zgodę jednym zdaniem z nazwą bazy i skutkiem („skasuje wszystkie dane
w <baza>”), a jego dosłowną odpowiedź przekaż w `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`. Nigdy nie
wpisuj tam własnego tekstu ani parafrazy.
