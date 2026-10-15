# konsultant-nie-ma-trybu-kierunkow-szaty

- **Skill:** konsultant-ux-kodozercy
- **Typ:** porażka
- **Status:** otwarty

## Opis
Zadanie „propozycje szaty graficznej do wyboru” (2–3, potem 7 kierunków) nie pasuje do żadnego
trybu skilla, a reguły trybu Koncept są z nim sprzeczne i trzeba było je świadomie zawiesić.

## Przyczyna źródłowa
Skill zakłada zmianę w obecnym designie: sekcja 3 „bez nowego design systemu”, zasady grafik
„korzystaj wyłącznie z istniejących kolorów, fontu, promieni” i „wytnij prawdziwe niezmieniane
karty ze zrzutu”, minimum przed/po w jednym kadrze. Redesign nie ma niezmienianych elementów do
wycięcia, a „przed” po zalogowaniu wymaga logowania użytkownika. Folderu `design/koncepty/` nie
było też na liście tematów `platforma/README.md`.

## Dowody
- 2026-10-14, sesja e61003ff (id claude.ai niedostępny): koncept `kierunki-szaty` zapisany
  z jawnym wyjątkiem („wyjątek od zasady skilla »bez nowego design systemu«, wynikający z zadania
  zespołu”). Własna metoda zamiast wycinków: każdy ekran zbudowany raz, kierunek jako zestaw
  tokenów CSS, przełącznik i zestawienia PNG. Nowy folder `design/koncepty/` dopisany do README
  w pakiecie bramki. Zrzuty „przed” tylko publicznego landingu — logowanie nie nastąpiło.

## Rozwiązanie
Dodaj tryb „Kierunki szaty”: ta sama treść i układ we wszystkich kierunkach (porównuje się tylko
szatę), kierunek jako zestaw nazwanych tokenów zgodnych z presetem web i rolami mobile, strona
porównania z przełącznikiem kierunek/ekran/web–mobile, arkusz komponentów bazowych, zestawienia
PNG i przynajmniej jeden ekran nauki (lekcja). Reguły „bez nowego design systemu” i „wycinki ze
zrzutu” w tym trybie nie obowiązują. Miejsce: `platforma/design/koncepty/<nazwa>/`.
