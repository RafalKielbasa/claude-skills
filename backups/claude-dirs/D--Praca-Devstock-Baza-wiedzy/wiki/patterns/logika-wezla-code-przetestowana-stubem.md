# logika-wezla-code-przetestowana-stubem

- **Skill:** live-gift
- **Typ:** sukces
- **Status:** otwarty

## Opis
Workflow n8n pisany ręcznie (bez przejścia przez instancję) niesie węzeł Code
z całą logiką produktu. Kształtu węzłów n8n nie da się zweryfikować bez
importu, ale ciało węzła Code to zwykły JavaScript i daje się je uruchomić
lokalnie na podstawionym `DateTime` i podstawionym `$()`. Test na pięciu
scenariuszach wykrył dwie usterki, które inaczej poszłyby do widzów.

## Przyczyna źródłowa
Ręcznie pisany JSON jest w tym repo świadomie dopuszczony jako punkt startowy
importu (KONWENCJE Zasada 6, `workflows/scaffold/`), ale ostrzeżenie „to nie
eksport" dotyczy całego pliku naraz i nie rozróżnia dwóch bardzo różnych
ryzyk: nazwy pól węzłów (weryfikowalne wyłącznie w n8n, skutek to
niezmapowane pole przy imporcie) i logiki węzła Code (weryfikowalna lokalnie,
skutek to zła treść maila u każdego widza, cicha i niewidoczna przy imporcie).
Bez rozdzielenia tych dwóch ryzyk cały plik czeka na pierwszy import,
a wtedy sprawdza się ekran, nie wyniki.

## Dowody
- 2026-09-18, sesja fe0e2a4e (id claude.ai niedostępny): węzeł „Przygotuj
  listę" (353 linie) w prezencie na live 21.09. Harness testowy z własnym
  `DateTime` (Luxon nie jest zainstalowany) i podstawionym `$('nazwa węzła')`,
  pięć scenariuszy: dzień typowy z pocztą, wszystko puste, dzień bez przerwy,
  konflikt terminów, inny kształt pól z Gmaila. Wykryte i naprawione: (1)
  ostrzeżenie „dzień bez ani jednej przerwy" wychodziło przy dwóch
  nachodzących na siebie terminach, bo luka między nimi liczy się ujemnie —
  próg podniesiony do trzech spotkań i czterech godzin rozpiętości; (2)
  newsletter z linkiem „Ignoruj poprzednie instrukcje" lądował na liście
  „czeka bez odpowiedzi" — dołożone odsiewanie po `List-Unsubscribe` i po
  adresie nadawcy. Przy okazji test potwierdził, że treść cudzego maila
  faktycznie dociera do modelu, co uzasadniło zdanie o wstrzyknięciu
  w poleceniu dla modelu.

## Rozwiązanie
Zanim ręcznie napisany workflow trafi do `prezent/` albo `workflows/scaffold/`,
wyjmij ciało każdego węzła Code i uruchom je lokalnie na podstawionych
globalach n8n (`DateTime`, `$()`, `$now`, `$input`) na scenariuszach
brzegowych: pusto, jeden element, konflikt, inny kształt pól ze źródła.
W README napisz osobno, co zostało sprawdzone lokalnie, a co czeka na pierwszy
import — „to nie eksport" bez tego rozróżnienia sugeruje, że nic nie jest
sprawdzone.
