# bramka-na-urzadzeniu-bez-sprawdzenia-srodowiska

- **Skill:** superpowers:writing-plans (też superpowers:brainstorming)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan stawia bramkę, którą użytkownik wykonuje na własnym sprzęcie albo koncie (dev client na
telefonie, konto w usłudze zewnętrznej), bez sprawdzenia, że to środowisko istnieje. Bramka
zamienia się w wieloetapowy setup, a wszystkie zadania zależne od jej wyniku stoją.

## Przyczyna źródłowa
Spec i plan traktują narzędzie użytkownika jak stały fakt („Rafał uruchamia w dev cliencie”).
Jedyne zastrzeżenie siedzi w opisie wariantu decyzji, nie w pytaniu ani w zadaniu przygotowania.
Środowiska po stronie użytkownika (aplikacja na telefonie, członkostwo w organizacji usługi) nie
widać z repo, więc nie wychodzi ani w self-review, ani w review planu, ani w builder checku.

## Dowody
- 2026-10-19, sesja e81e95d7-be5a-457d-884b-77d8d63c4251 (id claude.ai niedostępny), plan 1 biblioteki
  komponentów Kodożerców, Task 1 „Spikes on the device (gate: Rafał's screenshots)”. Wariant D6 w specu
  mówił tylko „Zakładam, że masz zbudowany dev client”. Po raporcie bramki Rafał: „Przeprowadź mnie
  krok po kroku”, potem „Nie mam deweloperskiej wersji aplikacji na telefonie. Chyba trzeba zrobić pełny
  setup.” Dalej: brak `eas-cli`, konta `rafalkielbasa` i nowe `rafalkielbasapraca` z `Entity Not
  Authorized` na projekcie EAS `devstock`, `eas init` pod prywatnym kontem i commit `7ab1618` na gałęzi
  sondy. Na koniec sesji build dev clienta wciąż przed nami; zadanie 3 i wszystkie za nim czekają.

## Rozwiązanie
Gdy spec albo plan zawiera krok, który wykonuje użytkownik na swoim sprzęcie lub koncie (urządzenie,
zainstalowana aplikacja, konto w usłudze zewnętrznej), w brainstormingu zadaj jedno pytanie, czy to
środowisko istnieje, i sprawdź z terminala, co się da (wersja CLI, `whoami`, dostęp do projektu).
Brak środowiska = osobne zadanie „przygotowanie środowiska” przed bramką, z komendami, kosztem i tym,
kto je wykonuje, a nie założenie w opisie wariantu.
