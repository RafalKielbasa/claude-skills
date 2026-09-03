# sciezka-skrocona-nie-jest-klikalna

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Claude podaje użytkownikowi ścieżkę do pliku w postaci skróconej, wygodnej
w zdaniu, ale nierozwiązywalnej: ani nie da się jej kliknąć, ani wkleić
w terminalu. Użytkownik zgłasza, że link nie działa, a plik przez cały czas
istnieje pod inną, pełną ścieżką.

## Przyczyna źródłowa
Ścieżka w komunikacie pełni funkcję operacyjną: użytkownik jej używa, żeby
otworzyć plik. Claude traktuje ją jak element narracji i skraca do ostatnich
dwóch segmentów, bo pełna ścieżka do katalogu tymczasowego jest długa i psuje
rytm zdania. Skrót jest czytelny i bezużyteczny naraz, a to, że nie działa,
wychodzi dopiero po stronie użytkownika.

## Dowody
- 2026-09-03, sesja session_01APWRKsZej4SeoF4vvdibEC: po przepisaniu ticketu
  #168 Claude napisał „Pełny nowy tekst leży w `scratchpad/tickets-new/168.md`”,
  podczas gdy plik był w
  `C:\Users\rafal\AppData\Local\Temp\claude\D--Praca-Devstock-Projekty-saas-app\<id sesji>\scratchpad\tickets-new\168.md`.
  Użytkownik odpowiedział „Nie działa mi link”. Naprawą było podanie pełnej
  ścieżki, a docelowo przeniesienie draftów do katalogu w projekcie objętego
  `.gitignore`, żeby ścieżka była krótka i prawdziwa jednocześnie.

## Rozwiązanie
Ścieżkę, po którą użytkownik ma sięgnąć, podawaj w postaci, którą da się kliknąć
albo wkleić, nawet kosztem długości wiersza. Skracaj wyłącznie do ścieżki
względnej wobec katalogu roboczego, bo taka też się rozwiązuje. Gdy pliki mają
być przeglądane, a nie tylko wspomniane, połóż je w projekcie, w katalogu
ignorowanym przez gita, zamiast w katalogu tymczasowym sesji.
