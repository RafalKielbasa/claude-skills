# self-check-nie-sprawdza-twierdzen-epiku-o-dzieciach

- **Skill:** github-tickets
- **Typ:** porażka
- **Status:** otwarty

## Opis
Self-check (22 kontrole na ticket, 6 na paczkę) przepuścił siedem uwag, które `codex` znalazł
w paczce epiku i dziesięciu podzadań. Większość dotyczyła twierdzeń epiku o wszystkich dzieciach
naraz i o tym, co jest w zakresie, oraz warunków przepisanych ze specu.

## Przyczyna źródłowa
Lista kontrolna jest ułożona per ticket. Twierdzenia epiku obejmujące wszystkie podzadania
(„każdy strumień ma bramkę i scalenie”) i zgodność „Poza zakresem” epiku z listą podzadań nie mają
własnej kontroli. Kontrolę „ścieżka istnieje” odczytałem jako „plik istnieje na dysku”, a nie
„w repozytorium, na które wskazuje ticket”.

## Dowody
- 2026-10-25, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf): epik #741 i DT-60…DT-69. Uwagi `codex` wprowadzone w całości lub częściowo:
  - B1: „każdy strumień ma bramkę i scalenie `--no-ff`”, a W5 i M5 to zamknięcia;
  - B3: #650 jednocześnie w „Poza zakresem” i jako podzadanie, z nieprawdziwym „blokuje scalenie”;
  - B2 i A3: warunek ze specu zaostrzony („wydany w sklepach” zamiast zgłoszenia, „każde nie osobnym commitem” zamiast jednej fali). Istniejąca linia self-checku z 2026-09-20 tego nie zatrzymała;
  - A2: `m1-gate.md` leżał w tmp joba, nie w repo;
  - A1: zamknięty strumień bez kryterium akceptacji swojej bramki.

## Rozwiązanie
Dopisz do `references/self-check.md`, sekcja „Per batch”:
- każde zdanie epiku o wszystkich podzadaniach („każdy”, „wszystkie”) sprawdź na każdym podzadaniu i wypisz wyjątki;
- żadne issue nie jest jednocześnie podzadaniem i pozycją „Poza zakresem” epiku bez zdania, dlaczego jest podpięte;
- „ścieżka istnieje” znaczy „w repozytorium docelowym”; plik z katalogu roboczego albo z tmp wskaż jako dokument przekazany osobno albo usuń.
