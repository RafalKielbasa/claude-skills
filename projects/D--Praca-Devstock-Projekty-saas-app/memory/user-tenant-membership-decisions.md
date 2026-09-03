---
name: user-tenant-membership-decisions
description: "2026-08-21 decyzje produktowe o modelu członkostwa user↔organizacja (owner wyłączny, 4 role, tenantId out of JWT); 2026-08-22 napisane 5 planów wykonawczych po review codexa, next: wybór trybu egzekucji"
metadata: 
  node_type: memory
  type: project
  originSessionId: 186fb72c-2e4e-4d5d-93f6-475dc226170a
  modified: 2026-08-21T12:49:45.596Z
---

Spec `docs/superpowers/specs/2026-08-21-user-tenant-membership-design.md`
(2026-08-21). **Status: review Rafała PRZESZEDŁ 2026-08-21 (sekcja po
sekcji, 7 uwag rozstrzygniętych interaktywnie i naniesionych), zero
implementacji, NIE zacommitowany.** 2026-08-22 napisane plany (niżej,
sekcja „Plany"). Następny krok: wybór trybu egzekucji. ZERO otwartych decyzji
— decyzja o panelu twórcy zapadła 2026-08-21: **panel przenosi się pod
subdomenę organizacji** (wzorem widoków studenckich); wariant proxy
odrzucony (po etapie 3 brak user→org w JWT + niejednoznaczność dla adminów
wielu org). Onboarding zostaje na apeksie, redirect po logowaniu z
`GET /users/me`. Przeniesienie panelu = osobne zadanie FE, warunek wstępny
etapu 2.

Decyzje z review 2026-08-21 (naniesione do specu, nie relitygować):

- **Wyjątek płatności od bramki 503**: `TenantContextMiddleware` dla tras
  `POST /payments/subscription*` **oraz `GET /users/me` i `GET /tenants/me`**
  (dwa `GET`-y dopisane do specu 2026-08-22 przy pisaniu planów — bez nich
  nikt nie dojdzie do ekranu, z którego woła się `POST`) pomija
  `resolveTenantAccess` (nadal 404 i nadal ustawia kontekst) — inaczej wygasły właściciel nie zapłaci za
  reaktywację (dziś ratuje go furtka apex+JWT, którą etap 2 usuwa).
  `PaymentsController` nie ma `TenantAccessGuard`, więc middleware to
  jedyna bramka.
- **FK enrollments→tenants przez relację w schemacie Prisma**, nie surowy
  SQL (drift). Indeksy częściowe muszą zostać surowe — plan etapu 1 zaczyna
  się od eksperymentu `migrate dev` vs ręczne indeksy, wynik do
  `apps/api/README.md`.
- **Trasy subskrypcyjne (`payments.controller.ts:53,67`) na
  `@Roles(MembershipRole.owner)`**, pozostałe 18 dekoratorów na `admin`.
- Nota o interakcji ze specem `platform-types` w OBU specach (`UserRole`
  znika w etapie 3; kolejność wdrożeń otwarta).
- Drobne: relacje zwrotne w snippecie, jedno miejsce enrollmentów
  (`EnrollmentsService.enroll`), transakcja do utworzenia, znika końcowy
  throw resolvera, super_admin w backfillu zaakceptowany.

Rozstrzygnięcia o super_adminie (2026-08-21, po inwentaryzacji roli;
naniesione do specu, sekcja „Trzy predykaty" + etap 3 + dziennik):

- `sections.service.ts:64` (inline'owa kopia predykatu draftów) = trzeci
  predykat przechodzący na członkostwo; bez tego etap 2 daje niespójność
  (draft kursu widoczny, sekcje nie), a etap 3 się nie kompiluje.
- super_admin JAWNIE zachowuje wgląd w drafty w `canViewUnpublishedCourses`
  (spójnie ze ścieżką owner i RolesGuard) — bypass we wszystkich trzech
  predykatach albo w żadnym.
- Martwy bypass `tenant-access.guard.ts:27` usuwany w etapie 3, nie
  migrowany na PlatformRole (middleware tnie 503 przed guardami — gałąź
  nieosiągalna). Wgląd super_admina w zawieszone organizacje = decyzja
  middleware, należy do PRZYSZŁEGO projektu roli platformowej (razem z:
  panel platformowy, kuracja landingu z follow-upu darmowych treści,
  ProtectedRoute+super_admin z follow-upu platform-types).
- Kontekst z inwentaryzacji: super_admin istnieje TYLKO w seedzie
  (`admin@platform.local`), zero tras `@Roles(super_admin)`, zero obsługi
  w FE; dziś ma pełny zapis w każdej aktywnej organizacji przez subdomenę
  (bypass w RolesGuard + resolver z ALS).

Decyzje podjęte interaktywnie — **nie relitygować przy implementacji**:

- Organizacje są wieloosobowe (roadmapa), więc model członkostwa powstaje teraz.
- **Owner wyłączny**: 1 na organizację, max 1 właścicielskie członkostwo na
  email. Admin może być w wielu organizacjach — to korekta Rafała do mojego
  pytania i to ona przesądziła, że `tenantId` wypada z JWT.
- Role w organizacji: `owner` > `admin` > `instructor` > `user`, dokładnie
  jedna na parę (user, organizacja), hierarchia.
- `User.role` kurczy się do roli platformy (`super_admin` | zwykłe konto).
- `tenantId` **znika z tokenu JWT** w etapie 3; tenant zawsze z subdomeny.
- `Enrollment` zostaje **jedynym** predykatem dostępu do treści — członkostwo
  `user` nie może stać się drugim (to jest ta sama klasa błędu co predykat
  „opłacony" w 4 kopiach, CP-87).
- Członkostwo `user` powstaje automatycznie przy pierwszym zapisie na kurs.
- `@Roles` przyjmuje **minimalną rangę**, nie listę.
- Wdrożenie **warstwami**: (1) schemat + backfill + podwójny zapis,
  (2) autoryzacja na członkostwie, (3) sprzątanie tokenu i roli globalnej.
- Front bierze rolę z `GET /users/me` — **CP-79 / issue #155 rozszerza się**
  o rolę w organizacji i jest warunkiem wstępnym etapu 3.


## Plany (2026-08-22, `docs/superpowers/plans/`, katalog gitignorowany)

Pięć plików, kolejność wykonania jest zarazem kolejnością zależności:
`2026-08-22-membership-stage-1-schema-and-backfill.md` (7 zadań) →
`2026-08-22-users-me-profile-and-membership.md` (CP-79, 5 zadań; moduł
`users` NIE istnieje w repo, ticket kłamie że jest sam serwis) →
`2026-08-22-creator-panel-subdomain-move.md` (8 zadań) →
`2026-08-22-membership-stage-2-authorization.md` (8 zadań) →
`2026-08-22-membership-stage-3-cleanup.md` (8 zadań).

Trzy rozstrzygnięcia, których w specu nie było, a bez których praca się nie
składa (wyszły przy pisaniu planów; pierwsze naniesione na spec):

1. Lista wyjątków od 503 musi objąć `GET /users/me` i `GET /tenants/me`.
2. `app/tenant/[subdomain]/layout.tsx` (bramka „szkoła niedostępna") musi
   zejść do nowej grupy tras `(public)`, inaczej panel jest niedostępny
   dokładnie wtedy, kiedy jest potrzebny — layouty App Routera nakładają
   się w dół i nie da się z nich wypisać inaczej niż grupą.
3. `success_url`/`cancel_url` checkoutu subskrypcji muszą wskazywać
   subdomenę (dziś budowane z gołego `FRONTEND_URL`, czyli apeksu).

Odstępstwa od specu zapisane w planach: etap 3 rozbija jedną migrację
destrukcyjną na dwie (addytywna → przepisanie kodu → destrukcyjna),
etap 1 dokłada helper `uniqueTargets()` do `meta.target` z surowych indeksów.

Review codexa 2026-08-22: 5 uwag, wszystkie wcielone (spec + 4 poprawki w
planach). Indeks częściowy daje „najwyżej jeden właściciel", nie „dokładnie
jeden" — „dokładnie" trzyma się konstrukcyjnie, bo nie ma ścieżki kasującej
ani degradującej członkostwo; trigger celowo NIE dokładany.

Poza zakresem (osobne tickety): scoping instruktora, zapraszanie do
organizacji, transfer własności, zawieszanie kursanta, rename Tenant →
Organization.

**Fakty z kodu ustalone przy pisaniu specu** (oszczędzają ponownego szukania):
`JwtStrategy.validate` i tak uderza w bazę przy każdym żądaniu, więc
członkostwa idą tym samym `include` i `RolesGuard` zostaje synchroniczny;
`creatorUserId` już dziś autoryzuje w 3 miejscach (`tenants.service.ts:105`,
`payments.service.ts:62,283`); `@Roles(UserRole.creator)` jest w 20 miejscach,
a `UserRole.student` w jednym; front to tylko 8 wystąpień w 5 plikach.

Rozstrzyga otwarte pytanie produktowe z [[auth-multitenancy-audit-2026-08]].
CP-83 zostaje wchłonięty przez etap 2; CP-84 sprowadza się do scopingu
instruktora. Zob. [[github-issue-candidates-2026-08]].
