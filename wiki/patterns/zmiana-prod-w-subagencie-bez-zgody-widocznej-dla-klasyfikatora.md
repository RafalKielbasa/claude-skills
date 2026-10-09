# zmiana-prod-w-subagencie-bez-zgody-widocznej-dla-klasyfikatora

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Subagent dostaje w dispatchu zmianę zasobu produkcyjnego, na który użytkownik
nie dał zgody wprost dla tego konkretnego zasobu (tu: wersja robocza drugiego
workflowu n8n). Klasyfikator trybu auto blokuje wywołanie
(„[Modify Shared Resources]”). Ta sama operacja na workflowie, o którym
rozmowa była od początku, przechodziła bez blokady.

## Przyczyna źródłowa
Klasyfikator ocenia zgodę po transkrypcie wykonawcy. Subagent nie widzi słów
użytkownika, tylko prompt kontrolera, a prompt kontrolera nie jest zgodą. Szeroko
sformułowana prośba („błąd workflow tych…”) nie wystarcza jako zgoda na zmiany
w zasobie, który do zakresu dołączył dopiero kontroler.

## Dowody
- 2026-10-09, sesja ece85169-32f2-44b7-9695-689c071f34ce (id claude.ai
  niedostępny): implementer Taska 9 zrobił kroki 1–4 (repo i testy) i zatrzymał
  się na `update_workflow` dla `w45RrU1VZbhQo64l` („31”). Prosił o dodanie
  reguły uprawnień i wznowienie. Kontroler nie obchodził blokady przez innego
  agenta, tylko zapytał Rafała. Rafał odpowiedział „zgoda na bieg testowy”, a
  13 operacji, bieg testowy i przywrócenie Slacka wykonał kontroler w głównej
  sesji.

## Rozwiązanie
Przed dispatchem zmiany w zasobie produkcyjnym sprawdzić, czy użytkownik
zgodził się na nią **dla tego zasobu**. Jeśli zasób dołączył do zakresu z
inicjatywy Claude'a, zapytać o zgodę przed dispatchem, a samą zmianę wykonać w
głównej sesji, gdzie zgoda jest w transkrypcie. Blokady klasyfikatora u
subagenta nie obchodzić innym agentem ani regułą dodaną na jego prośbę; zgłosić
użytkownikowi.
