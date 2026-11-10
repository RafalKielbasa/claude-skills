# rama-ticketu-z-grepa-przed-sprawdzeniem-per-element

- **Skill:** github-tickets
- **Typ:** porażka
- **Status:** otwarty

## Opis
W trybie pojedynczego ticketu rama pokazana na bramce 1 (numer, tytuł, zakres, label, zależność) zawierała
twierdzenia o kilku miejscach w kodzie wzięte z samego wyniku `git grep`. Użytkownik zaakceptował ramę, a dwa
twierdzenia okazały się fałszywe dopiero przy pisaniu treści, gdy zadziałała linia self-checku z 2026-10-15.

## Przyczyna źródłowa
Kontrola „twierdzenie o kilku elementach naraz sprawdź per element” stoi w `references/self-check.md`, czyli
w kroku 4, po bramce 1. Tryb pojedynczego ticketu każe pokazać zakres przed napisaniem treści, ale nie każe
sprawdzić, czy zakres jest prawdziwy. Lista trafień `grep` wygląda jak zweryfikowany inwentarz, a mówi tylko, że
ciąg znaków występuje. Ogólny mechanizm: [twierdzenie-o-pliku-bez-odczytu](twierdzenie-o-pliku-bez-odczytu.md).

## Dowody
- 2026-10-29, sesja 1f1d010e-6776-42d9-8434-75b5bef761bc: rama CP-111 („Shared mapping … in remove methods”,
  blocked by #197, bo „PR CP-107 dodaje szóstą kopię”) zbudowana z `git grep "P2025"` na `main` i na gałęzi
  CP-107; Rafał odpowiedział „ok”. Przy treści wyszło, że mapowanie siedzi we wspólnym `handlePrismaError`,
  wołanym też przy edycji i publikacji, a trafienie w `team/invitations.service.ts:295` wybiera 404/409/410
  według stanu zaproszenia, więc nie jest kopią. Tytuł zmieniony, zależność usunięta, korekta pokazana jako
  pierwsza na bramce 2; wysłane jako kodozercy/edu_saas#210.
- 2026-11-10, sesja 2755dabd-6161-454c-a435-d571c7e46f91 (id claude.ai niedostępny): rama DT-138 (porządki po
  usunięciu Circle) zbudowana z wniosków sesji, bez sprawdzenia skutków w kodzie: „przed wdrożeniem DT-92”
  i „`DRAFT` albo do usunięcia”; Rafał odpowiedział „ok”. Przy treści wyszło, że gałąź mobile DT-93 usuwa ten
  sam wyjątek (kolejność obejmuje też ją), a historia programu czyta tytuł i nagrodę z szablonu (usuwanie
  odpada). Treść odeszła od ramy w dwóch miejscach; self-check tego nie złapał, złapał `codex` („Ticket
  rozszerza kolejność wdrożenia poza zatwierdzoną ramę”). Odstępstwa wypisane na bramce 2, Rafał przyjął;
  wysłane jako devstock-org/devstock-team#916. Linia „treść nie wychodzi poza ramę” dopisana do
  `self-check.md` (2026-11-10).

## Rozwiązanie
Dopisz do sekcji „Mode: a single ticket” w `SKILL.md`, przed pokazaniem ramy: „Każde twierdzenie ramy o kilku
miejscach w kodzie (lista kopii, metody, których dotyczy, zależność od innego PR) albo o skutku zmiany (kolejność
wdrożeń, dopuszczalne warianty działania) sprawdź w kodzie, czytając go wokół każdego trafienia, nie tylko listę
z `grep`. Rama, której zakres zmienił się po akceptacji, wraca na bramkę 1 albo idzie na bramkę 2 z korektą
wypisaną jako pierwsza.” Kontrola wtórna jest już w `references/self-check.md` (linia z 2026-11-10).
