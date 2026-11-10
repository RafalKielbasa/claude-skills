# plan-z-nowa-zmienna-env-pomija-deklaracje-monorepo

- **Skill:** superpowers:writing-plans (też subagent-driven-development, recenzja)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan dodaje zmienną środowiskową, którą kod czyta, i wpisuje ją do `.env.example` oraz konfiguracji
wdrożenia, ale pomija listy deklaracji monorepo (`turbo.json`: `globalEnv` i `env` zadania). Ani
recenzje po zadaniach, ani recenzja całości tego nie łapią, bo idą za listą plików planu.

## Przyczyna źródłowa
Rozpoznanie do planu idzie ścieżką kodu (middleware, trasa, `.env.example`), a nie wszystkimi
miejscami, w których repo deklaruje istniejącą zmienną-rodzeństwo. Recenzent sprawdza zgodność ze
specem i planem, więc brak pliku, którego plan nie wymienił, jest dla niego niewidoczny.

## Dowody
- 2026-11-10, sesja 66df8097-5d05-43de-91f6-b84bd9bfc361 (id claude.ai niedostępny; code-busters-v2,
  DT-101, plan 2): `COURSE_PIPELINE_COURSE_CREATE` trafiła do `apps/cms/.env.example` i
  `apps/cms/fly-main.toml`, a nie do `turbo.json:27` i `:113`, gdzie stoi `COURSE_PIPELINE_SECRET`.
  Recenzje po zadaniach i recenzja całości (opus, „Ready to merge”) to przepuściły; PR #1744 był już
  wypchnięty. Złapał to Rafał checklistą osi ci-devops („zmienna dodana w kodzie stoi w `.env.example`
  i w `globalEnv` `turbo.json`”); poprawka drugim commitem `bff480c2e`.

## Rozwiązanie
Plan, który dodaje zmienną środowiskową: najpierw `git grep -n <zmienna-rodzeństwo>` (istniejąca
zmienna tej samej funkcji) i wypisz w planie każdy plik, w którym ona jest zadeklarowana
(`turbo.json` `globalEnv` i `env` zadania, `.env.example`, konfiguracje wdrożeń). Te pliki idą do
listy „Files” zadania, a recenzent dostaje w briefie zdanie, że sprawdza deklaracje zmiennej w
całym repo, nie tylko pliki z planu.
