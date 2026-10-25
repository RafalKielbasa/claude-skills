# builder-check-lapie-mechanike-platformy-i-domysl-o-osobie

- **Skill:** superpowers:brainstorming
- **Typ:** sukces
- **Status:** otwarty

## Opis
Builder check (świeży subagent czyta spec jako wykonawca i zgłasza tylko pytania
blokujące) w specu nie-programistycznym, czyli w specu badania biznesowego,
złapał dwie rzeczy, które zmieniły to, co powstało. Pierwsza to mechanika
platformy, której spec nie znał. Druga to fakt o użytkowniku, który Claude
wywnioskował zamiast zapytać.

## Przyczyna źródłowa
Rozmowa brainstormingowa krąży wokół celu i decyzji użytkownika. Nikt w niej nie
symuluje wykonania, więc mechanika środowiska (jak platforma grupuje oferty) i
dane wejściowe modelu (forma zatrudnienia, podatek) zostają niezauważone.
Claude uzupełnia luki z pamięci, a wpis „developer at Devstock” czyta jako
„pracownik”, choć wpis tego nie mówi. Wykonawca, który ma zaplanować liczenie
netto, potrzebuje tych danych od razu, więc o nie pyta.

## Dowody
- 2026-10-24, sesja session_018h6huVMv7ymFg4EEx4A78e (lokalnie
  0daa3cb0-3d18-4574-9113-63274220e556), repo agent-biznes, spec
  `2026-10-24-china-import-niche-research-design.md`. Builder check w roli
  „e-commerce market research analyst” zadał 4 pytania. Dwa zmieniły spec:
  - „offers with the same EAN share one product page” → Rafał wybrał wariant, w
    którym próg liczy się na ścieżce marki własnej, a filtr marki własnej stał
    się obowiązkowy;
  - pytanie o umowę o pracę czy B2B → Rafał: „B2B”. Spec pisał „full-time job” i
    „employer”, bo Claude przyjął to z pamięci i z notatki podatkowej zakładającej
    etat.

  Pozostałe dwa pytania (co obejmuje budżet testu, próg przy sezonowości) Claude
  rozstrzygnął sam i oznaczył w specu.

## Rozwiązanie
Builder check uruchamiaj także dla speców nie-programistycznych (badanie,
biznes, wydarzenie), z rolą wykonawcy z tej dziedziny. Fakty o użytkowniku, od
których zależy model (forma zatrudnienia, podatek, kapitał, czas), wpisuj do
specu tylko wtedy, gdy padły w rozmowie albo stoją dosłownie w pamięci.
Wniosek z pośredniego sformułowania pamięci oznacz w specu jako domysł albo
zapytaj o niego.
