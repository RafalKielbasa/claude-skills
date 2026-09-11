# zgloszenie-faktu-wziete-za-wybor-srodka

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Użytkownik zgłasza **fakt** („w segmencie 8 agent bierze odpowiedź z pamięci,
nie z narzędzia"), a ja od razu wybieram **środek zaradczy** i wdrażam go
w komplecie plików. Środek okazuje się nie ten — użytkownik uchyla go jednym
zdaniem, a praca idzie do cofnięcia razem z propagacją, walidacją
i przegenerowanymi artefaktami.

## Przyczyna źródłowa
Zgłoszenie faktu nie jest wskazaniem rozwiązania, ale czyta się jak polecenie,
bo jest zdaniem oznajmującym o czymś, co trzeba naprawić. Przy treści
dydaktycznej — i wszędzie tam, gdzie kryterium nie jest „poprawne/niepoprawne",
tylko „czego to uczy" albo „jak ma wyglądać" — środków jest kilka i wszystkie
usuwają zgłoszony fakt. Wybór między nimi należy do użytkownika, a nie daje się
wyprowadzić ze zgłoszenia.

## Dowody
- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: Rafał zgłosił „segment 8 2.1 (…) to również
  wymaga zmiany, bo w tym miejscu agent nie wywołał skrzynki, tylko zabrał dane
  z simple memory". Wybrałem środek — restart sesji czatu przed pierwszym
  pytaniem, ten sam, który przed chwilą wszedł do segmentu 9 — i wdrożyłem go
  w czterech plikach lekcji plus przegenerowanym planie nagrania, z walidacją
  i raportem. Odpowiedź: „W segmencie 8 nie zmieniamy chatu". Całość do
  cofnięcia. Dopiero wtedy zapytałem przez `AskUserQuestion` z czterema
  środkami (restart poza kadrem, narracja przyznaje co widać, inne pytanie,
  zostawiamy jak jest) — Rafał wybrał drugi i to rozstrzygnęło sprawę w jednej
  turze. Pytanie zadane o dwie tury wcześniej oszczędziłoby całą rundę edycji
  i cofania.

## Rozwiązanie
Zanim wdrożysz środek na zgłoszony fakt, sprawdź, czy środek jest **jeden**.
Gdy da się wypisać więcej niż jeden, który usuwa fakt, wypisz je użytkownikowi
i poczekaj — z rekomendacją, ale bez wdrażania. Wdrażaj bez pytania tylko wtedy,
gdy środek wynika ze zgłoszenia jednoznacznie (literówka, zła liczba, martwy
link). Sygnał ostrzegawczy: jeśli w raporcie po zmianie pisze się zdanie
„odrzuciłem alternatywę X, bo…", to znaczy, że alternatywa istniała i decyzja
była cudza.
