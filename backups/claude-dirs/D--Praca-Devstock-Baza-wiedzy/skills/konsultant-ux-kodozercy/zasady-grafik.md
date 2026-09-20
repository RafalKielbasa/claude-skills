# Grafiki konceptu

Czytaj przy przygotowaniu wizualizacji, razem z `platforma/design/obecny-design.md`.
Odbiorca ma w 10 sekund zrozumieć zmianę w obecnym designie platformy.

## 1. Źródło i zestaw

Minimum: świeży zanonimizowany `przed.png` i polecany wariant `po.png` w tej
samej szerokości, skali i kadrze. Nie przedstawiaj rekonstrukcji jako zrzutu.
Gdy nie masz przeglądarki, poproś użytkownika o zrzut; do tego czasu można
opracować tekst lub jawnie poglądowy szkielet, nie wierny koncept wizualny.
Robocze pliki trzymaj w systemowym katalogu tymczasowym poza repo.

Dodawaj tylko potrzebne obrazy: pusty/ładowanie/błąd/sukces, kroki przepływu,
wąski ekran, znaczniki zmian. Dla każdej grafiki napisz jedno zdanie uzasadnienia.
Drugi wariant rysuj tylko na prośbę o porównanie. Zmianę przepływu między
ekranami przedstaw także jako Mermaid w `koncept.md`.

## 2. Wierność

1. Maskuj dane osobowe przed utrwaleniem i wycinaniem: konto, inne osoby,
   avatary, kod polecający, webhooki i płatności; używaj neutralnych danych.
   Jeśli maskowanie odbywa się na obrazie, nie przenoś surowego oryginału do
   repo. Sprawdź także HTML, data URI i metadane.
2. Wytnij prawdziwe niezmieniane karty, kafle, ikony i nagłówek ze świeżego
   zrzutu i osadź jako data URI w [makieta.html](szablony/makieta.html).
   Nie odrysowuj niezmienianego interfejsu. Do cięcia użyj dostępnych narzędzi
   obrazowych; użytkownik wyraźnie wymaga kompozycji z rzeczywistych wycinków.
3. Krawędzie wyznacz programowo przez skoki jasności pikseli: wylicz profile
   różnic sąsiednich wierszy/kolumn wokół interesującego elementu, wybierz
   ciągłe granice panelu, sprawdź współrzędne na podglądzie. Nie wybieraj ich
   wyłącznie „na oko”. Tekst/cienie mogą tworzyć fałszywe granice — zweryfikuj
   powtarzalność skoku wzdłuż krawędzi; zapisuj współrzędne cięcia w HTML.
4. Od nowa zbuduj tylko to, co się zmienia. Wartości bierz ze ściągi designu,
   odczytu stylów żywej strony albo tokenów `codebusters-v2`; nigdy z pamięci.
   Brakującą wartość odczytaj. Wartość „do weryfikacji” wolno wykorzystać
   w oznaczonym teście szkieletu, ale nie potwierdzać wierności na jej podstawie.
5. Korzystaj wyłącznie z istniejących kolorów, fontu, promieni, odstępów,
   ikon i wzorców komponentów. Nowy element składaj z istniejących części.
   Jeśli potrzebny nowy komponent, nazwij go jako propozycję w koncepcie
   i uwzględnij koszt; nie twierdź, że istnieje w kodzie.
6. Teksty po polsku, dokładnie jak w `koncept.md`, w tonie platformy, bez
   lorem ipsum. Nie dodawaj funkcji spoza konceptu. Stan spreparowany
   (np. kafel bez kłódki) podpisz jako poglądowy.
7. Znaczniki: liczby w jednym kolorze wyraźnie spoza palety UI, dobieranym
   po jej sprawdzeniu, legenda w koncepcie. Zachowaj także czyste `po.png`.

## 3. Render

Sprawdź dostępny render: istniejący Playwright w `tools/`/systemie albo Chrome
lub Edge headless. Jeśli środowisko narzuca skill przeglądarkowy, najpierw
stosuj jego reguły dostępu. Dla odrębnego lokalnego renderu używaj wyłącznie
makiety i tymczasowego profilu, bez czytania profilu/cookies użytkownika.
Nie instaluj globalnie bez pytania; nie instaluj zależności w `platforma/`.

Szkielet jest samodzielnym HTML z CSS. Wstaw zweryfikowane zmienne z designu,
wycinki data URI i dostępny legalnie font (najlepiej lokalnie osadzony).
Brak Poppins oznacz jako brak wierności; nie udawaj poprawnego fontu po fallbacku.
Poczekaj na fonty/obrazy przed zrzutem. Kontroluj błędy konsoli i ucięcia treści.
Szerokość jak „przed”; docelowo do 2000 px i około 1 MB PNG. Jeśli oryginał
jest szerszy, przygotuj identyczny wycinek lub przeskaluj obie wersje tą samą
metodą. Nie pogarszaj czytelności, żeby sztywno zmieścić rozmiar pliku.

Gdy render PNG nie działa, zachowaj HTML/SVG, zaznacz brak PNG w koncepcie
i raporcie; nie przemianowuj innego formatu na PNG ani nie zgłaszaj QA obrazu.

## 4. Autokontrola i zapis

Otwórz wyrenderowany PNG obok „przed” i sprawdź: tło, font/ciężar, promienie,
odstępy, wyrównanie, ostrość wycinków, teksty, ten sam kadr, brak PII.
Różnić się ma tylko zamierzona zmiana. Popraw przed pokazaniem podglądu.
Samo istnienie pliku lub poprawny exit code nie zastępuje obejrzenia PNG.

Po akceptacji przenieś zestaw do `grafiki/` przy koncepcie:
`przed.png`, `po.png`, opcjonalnie `po-stan-pusty.png`, `po-waski-ekran.png`,
`po-znaczniki.png` i pozostałe potrzebne stany, zawsze także `makieta.html`.
Kolejna iteracja nadpisuje stałe nazwy; historię zapisz w `koncept.md`.
Ścieżkę głównej grafiki wpisz do zadania w `platforma/zadania.js` (pole `artefakt`).
