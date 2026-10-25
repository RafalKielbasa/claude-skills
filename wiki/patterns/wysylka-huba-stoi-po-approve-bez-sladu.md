# wysylka-huba-stoi-po-approve-bez-sladu

- **Skill:** hub
- **Typ:** porażka
- **Status:** otwarty

## Opis
Rafał mówi w hubie „wyślij”, hub zapisuje wpis `approved`, a wiadomość do sesji projektu nie idzie
godzinami. Sesja projektu widzi w dzienniku samo `approved` bez `result`. Nie odróżni tego od
wysyłki w toku, więc może tylko poprosić Rafała, żeby sprawdził okno huba.

## Przyczyna źródłowa
Wpis wątpliwy, przyczyny w sesji huba nie sprawdziłem. Wysyłka huba to kilka osobnych wywołań
w jednej turze: `HUB approve`, `HUB prepare`, `SendMessage`, `HUB result`, `HUB confirm`. Dziennik
nie ma stanu między `approved` a `result`. Gdy tura huba stanie po `approve` (pytanie
o zajętą sesję, prompt uprawnień, przerwana tura), nic tego nie zgłasza, a wpis wygląda jak
„w drodze”. Pokrewny wzorzec: [[brief-huba-po-decyzji-podjetej-w-sesji]].

## Dowody
- 2026-10-24, sesja c0987db9-b09b-453f-8cfe-0770239787b8 (claude.ai session_01GxQKCzxfs88VmDWqtoSy3P),
  krok 2 akceptacji planu 3 `hub-voice`:
  - zlecenie `r20261024055940-42fa` zatwierdzone o 07:59:40, potem `approved` bez wyniku;
  - dwa prompty Rafała w sesji („zrobione”, „ok”) przyszły bez zlecenia;
  - po „Chyba nie rozumiem tego elementu” (17:21) i wyjaśnieniu kroków wysyłki zlecenie
    przyszło o 17:26 (`sent`, `UserPromptSubmit 2026-10-24T15:26:01.234Z`);
  - co pokazywał hub między 07:59 a 17:26, nie wiadomo.

## Rozwiązanie
Hub po `HUB approve` kończy wysyłkę w tej samej turze albo zapisuje, na czym stanął: pytanie,
prompt uprawnień albo porażkę `prepare`. Przegląd huba pokazuje każdy wpis `approved` starszy niż
kilka minut jako wysyłkę zawieszoną. Sesja projektu, która widzi takie `approved`, nie pisze do
huba sama. Pokazuje Rafałowi, co ma sprawdzić w oknie huba, i podaje zdanie do wpisania tam.
