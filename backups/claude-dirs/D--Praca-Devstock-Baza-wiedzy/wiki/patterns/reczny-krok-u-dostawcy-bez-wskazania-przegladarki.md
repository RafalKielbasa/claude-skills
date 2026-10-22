# reczny-krok-u-dostawcy-bez-wskazania-przegladarki

- **Skill:** kurs-nagrywanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Proszę Rafała o ręczny krok na koncie dostawcy, np. odebranie n8n.cloud dostępu w koncie Google, i nie mówię,
w której przeglądarce ma to zrobić. Rafał otwiera nową kartę w oknie automatu, które jest akurat na wierzchu.
Strażnik ją zamyka, a krok się nie odbywa.

## Przyczyna źródłowa
Okno sondy i przebiegu (profil kursu) jest zalogowane na konto kursu, więc wygląda na naturalne miejsce do pracy
na tym koncie. Strażnik okna blokuje jednak nowe karty i hosty spoza `kurs.yaml`, a `myaccount.google.com`
na tej liście nie ma. Polecenie bez wskazania przeglądarki zostawia wybór Rafałowi, a ten wybiera okno, które
ma przed sobą.

## Dowody
- 2026-10-20/21, sesja 0f2e4f59-44c4-458e-a9ee-2d4d39543321 (id claude.ai niedostępny), lekcja agenty-ai 2.1,
  przygotowanie konta przed przebiegiem 3:
  - dwa okna sondy (`probe-ui-n8n-2026-10-20T19-13-22-032Z`, `…2026-10-21T06-32-00-338Z`) zamknięte bez zmian,
    zapisały tylko zablokowane nowe karty (`chrome://new-tab-page/`);
  - dopiero po wariancie „[A] okno incognito w zwykłej przeglądarce” Rafał odebrał dostęp („Oderałem dostęp”),
    a credential Sheets połączył w trzecim oknie (`…2026-10-21T06-34-32-214Z`).

## Rozwiązanie
Każdy ręczny krok Rafała na stronie spoza hostów `kurs.yaml` (konto Google, panel dostawcy, skrzynka) opisuj
z miejscem wykonania: „w zwykłej albo incognito przeglądarce, nie w oknie automatu - okno automatu zamyka nowe
karty i nie wpuszcza tej strony”. Przy okazji podaj kolejność względem okna automatu: krok poza oknem przed
otwarciem okna (np. odebranie dostępu przed ponownym połączeniem credentiala) czy po nim.
