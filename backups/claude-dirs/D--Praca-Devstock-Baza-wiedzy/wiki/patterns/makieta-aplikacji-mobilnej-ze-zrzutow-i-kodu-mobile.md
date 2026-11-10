# makieta-aplikacji-mobilnej-ze-zrzutow-i-kodu-mobile

- **Skill:** konsultant-ux-kodozercy
- **Typ:** sukces
- **Status:** otwarty

## Opis
Koncept dotyczył też aplikacji mobilnej, a tej nie da się otworzyć w headless Chrome. Wierne grafiki telefonu „przed” i „po” powstały z dwóch zrzutów ekranu od Rafała. Nowa karta została zbudowana w HTML z komponentów `code-busters-mobile` i wklejona między wiersze zrzutu w miejscu wyznaczonym pomiarem. Rafał zatwierdził pakiet bez poprawek grafik telefonu.

## Przyczyna źródłowa
Ścieżki skilla prowadzą tylko do web. Krok 3 sekcji 2 (`kodozercy.pl` w profilu Chrome), tokeny z publicznego CSS platformy i fonty z jej arkuszy nie obejmują aplikacji natywnej. Aplikacja ma własne tokeny (`tokens/generated/themes.js`) i własne fonty. Zrzut z telefonu ma stałą skalę: 1080 px szerokości przy 360 dp to 3 px/dp. Komponent złożony z tych samych tokenów i geometrii co w kodzie daje więc te same wymiary co aplikacja.

## Dowody
- 2026-11-10, sesja session_01WryF5Vs7iJSRzH27PExCPE (lokalnie d05fa43f-c46f-49dc-9cd3-4eb8fdea782f; koncept „Darmowa lekcja w kursie”, commit `2e1e61de`):
  - Prośbę o zrzuty kursu „Misja AI: Start” z aplikacji (oba motywy, bez dołączania) Rafał przyjął w rozmowie głosowej.
  - Granice wierszy wyznaczyły skoki jasności między sąsiednimi wierszami pikseli (`edges.cjs`), nie ocena na oko:
    - dół ramki lekcji 1: 1559 px;
    - góra lekcji 2: 1589 px;
    - dolna nawigacja: 1995 px;
    - pasek systemowy: 2196 px.
  - Kartę złożyłem z kodu `938df74`:
    - Panel `highlight` (p-8, gap-4, ramka 3 px z poświatą, narożniki 11 px);
    - Button `lg` (wcięcie i fazowanie);
    - fonty Michroma i Lexend Deca z `node_modules/@expo-google-fonts`;
    - kontrast liczony z tokenów `themes.js`.
  - Wada: Rafał dołączył do kursu między zrzutami. Ciemny zrzut pokazuje stan przed dołączeniem, jasny stan po nim. Ciemne „po” jest więc tylko fragmentem listy bez górnej karty, co koncept mówi wprost. Konto zostało też uczestnikiem kursu, a to uruchamia e-mail „kurs nierozpoczęty” po 7–8 dniach.

## Rozwiązanie
Gdy koncept obejmuje aplikację mobilną:
- „Przed” to zrzuty od użytkownika. W prośbie podaj konto, kurs i stan, oba motywy w tym samym stanie i wprost zakaz akcji zapisujących między zrzutami (np. „Dołącz do kursu”). Wymień skutek takiej akcji.
- Skalę bierz z szerokości zrzutu (px/dp). Granice wierszy wyznacz pomiarem jasności, nie na oko.
- Nowy element buduj w HTML z komponentów `code-busters-mobile` na odczytanym commicie: tokeny z `tokens/generated/themes.js`, fonty z `node_modules/@expo-google-fonts`, geometria z komponentu.
- W koncepcie napisz, które części grafiki są zrzutem, a które rekonstrukcją z kodu (z commitem).

Powiązane: [[makieta-storybook-z-klasami-aplikacji-jako-pomiar]].
