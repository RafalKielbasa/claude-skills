# stan-ui-w-profilu-przezywa-reset-konta

- **Skill:** kurs-nagrywanie
- **Typ:** porażka
- **Status:** otwarty

## Opis
Ujęcie albo przebieg startuje w innym stanie interfejsu niż ten, pod który napisano kroki. Panel zostawiony otwarty
przez poprzedni przebieg jest otwarty na starcie następnego. Krok z przełącznikiem „otwórz/zamknij” trafia wtedy
w odwrotny stan, a kadr startowy pokazuje rozwinięty panel.

## Przyczyna źródłowa
Reset `start_state` (`autonomy: full`) czyści zasoby konta: workflow i credentiale. Preferencje widoku n8n trzyma
w `localStorage` profilu przeglądarki kursu (`N8N_LOGS_PANEL_OPEN`, stan panelu czatu). Ten stan przeżywa zarówno
reset, jak i przeładowanie strony. Profil jest wspólny dla wszystkich przebiegów i ujęć kursu. Stan startowy zależy
więc od tego, na czym skończył się poprzedni przebieg. Testy offline z atrapą `ctx` tego nie widzą.

## Dowody
- 2026-10-16, sesja a7fb8394-0358-4975-bc18-9da4d6298a8a (id claude.ai niedostępny): lekcja agenty-ai 1.2.
  - Przebieg zatrzymał się na kroku z przełącznikiem czatu, bo panel czatu był już otwarty po poprzednim przebiegu.
    Naprawa: lokatory `chatToggleOpen` i `chatToggleHide` z tekstem stanu docelowego oraz kroki opcjonalne.
  - Ujęcie zaczynało się z rozwiniętym panelem Logs. Naprawa: `closeBottomPanel` w hooku `przygotuj` usuwa
    `N8N_LOGS_PANEL_OPEN` przed przeładowaniem (`9f653ca0`, test w `n8n-przygotuj.test.js`).

## Rozwiązanie
1. Każdy element, który zmienia widok i może go zapamiętać (panel, zakładka, motyw, rozmiar), ustawiaj w `przygotuj`
   do znanego stanu przed ujęciem.
2. W krokach używaj lokatora, który nazywa stan docelowy („Open chat”), a nie samego przełącznika.
3. Po drugim przebiegu nowej lekcji porównaj zrzut pierwszego kroku z pierwszym przebiegiem. Różnica w samym kadrze
   startowym oznacza stan zapamiętany w profilu.
