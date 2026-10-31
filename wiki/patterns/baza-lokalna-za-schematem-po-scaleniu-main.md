# baza-lokalna-za-schematem-po-scaleniu-main

- **Skill:** ogólny (bramki na lokalnym stosie)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Gałąź dostaje przez scalenie `main` zmianę modelu danych (kolumna dodana albo usunięta), testy, TSC i build
przechodzą, a wspólna lokalna baza zostaje na starym schemacie. Bramka wizualna na stosie przechodzi z zerowymi
licznikami, bo ekrany, które czytają nową kolumnę, po cichu nic nie pokazują. Wychodzi dopiero w teście, który
sprawdza konkretną treść.

## Przyczyna źródłowa
Schemat w repo (`schema.prisma`) jest generowany i przechodzi przez scalenie, ale stan bazy nie jest częścią
gita, a `db push` na wspólnej bazie wymaga zgody, więc nikt go nie robi przy okazji. Resolver łapie błąd Prismy
(P2022, „column does not exist”) i zwraca `null`, więc front renderuje stan pusty, a harness bramki liczy tylko
błędy konsoli i nieudane żądania — błąd GraphQL w odpowiedzi 200 nie jest dla niego błędem.

## Dowody
- 2026-10-31, sesja a65d3063-3840-4e65-beaf-1f6c93f7abc0 (id claude.ai niedostępny; code-busters-v2, okno stosu W5):
  gałąź W5 scaliła #1713 (`Survey.reputationPointsReward`, usunięta `LoyaltyProgramTask.tallyQuestionnaireId`);
  lokalna baza `code-busters-v2-db-1` nie dostała `db push`. Bramka W1–W4 przeszła 404/0/0/0, a `PendingSurvey.ts`
  zwracał `null` dla każdego konta, więc karta ankiety z W5-D1 ani razu się nie wyrenderowała. Wykrył to dopiero
  funnel smoke, któremu implementer dodał jawny warunek wstępny („The CMS cannot read the Survey list (Prisma
  error: … does not exist in the current database) … run db:push”). Po zgodzie Rafała `keystone prisma db push
  --accept-data-loss` (usunięta kolumna z 2 wartościami), potem smoke 3/3 i ponowna bramka W3.

## Rozwiązanie
Przed pierwszym przebiegiem na lokalnym stosie po scaleniu `main` (albo innej gałęzi zmieniającej model)
porównaj schemat z bazą: `prisma db push` w trybie podglądu / `migrate diff` albo jedno zapytanie GraphQL
o nowe pole. Rozjazd = prośba o zgodę na `db push` (z wymienionymi kolumnami usuwanymi i skutkiem dla innych
sesji na tej bazie) przed bramką, nie po niej. W testach E2E dodaj warunek wstępny, który czyta nowe pole i pada
głośno z nazwą komendy naprawczej, zamiast pozwolić ekranowi pokazać pustkę.
