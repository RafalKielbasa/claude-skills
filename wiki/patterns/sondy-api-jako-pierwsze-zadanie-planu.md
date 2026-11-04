# sondy-api-jako-pierwsze-zadanie-planu

- **Skill:** superpowers:writing-plans (też superpowers:brainstorming)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Plan integracji z zewnętrznym API zaczyna od zadania z sondami na prawdziwym koncie (odczyt, potem zapis
na zgodę użytkownika), a zadania, które kodują wywołania API, idą dopiero po raporcie sond. Sondy obaliły
założenia specu, zanim powstał kod oparty na nich. Zadania niezależne od API (czyste funkcje) poszły
wcześniej i poprawki ich nie dotknęły.

## Przyczyna źródłowa
Spec opisuje API z dokumentacji i z wyobrażenia przebiegu. Uprawnienia aplikacji, zakresy tokenu
i kody odpowiedzi wychodzą dopiero na żywym koncie. Gdyby założenie wpisać od razu do klienta i testów
z mockami, testy byłyby zielone, a błąd wyszedłby dopiero przy pierwszym prawdziwym wgraniu, już po
recenzjach.

## Dowody
- 2026-11-03/04, sesja e0cd735e-fa23-4ebd-8d25-7d8684be5ab4 (id claude.ai niedostępny; Baza wiedzy, plan
  `content-deploy-vimeo-upload-plan-1`, zadanie 1 = sondy P0–P8 Vimeo). Obalone albo poprawione przed
  kodem klienta:
  - C1: token członka zespołu nie wgrywa na konto firmowe (`403 "This app can only upload to the app
    owner's account."`), potrzebny token właściciela;
  - C2: dodanie filmu do folderu wymaga zakresu `interact`, a `folder_uri` przy tworzeniu działa bez niego;
  - C3: wpis domeny dopuszcza subdomeny, więc wspólne sufiksy (`fly.dev`, `vercel.app`) trzeba odrzucać;
  - C4: utworzenie filmu odpowiada `200`, nie `201`.
  Zadanie 3 (klient API) napisane od razu na poprawionych interfejsach, nowe zadanie 3a. Zadania 2, 4 i 5
  (czyste funkcje) zrobione przed sondami bez poprawek. Pierwsze prawdziwe wgranie 15 lekcji przeszło
  bez błędu (15 × `uploaded`, weryfikacja ustawień zielona).

## Rozwiązanie
Plan integracji z zewnętrznym API: zadanie 1 to sondy na prawdziwym koncie, każda z dosłownym wynikiem
w raporcie sond (`…-probes.md`), z tabelą „założenie specu → wynik → rozstrzygnięcie”. Zadania kodujące
wywołania API mają w planie warunek „po raporcie sond” i są poprawiane według raportu przed dispatchem.
Zadania bez zależności od API mogą iść wcześniej. Sondy zapisu tylko za zgodą użytkownika, a ich
pozostałości (utworzone obiekty) idą w raporcie do usunięcia.
