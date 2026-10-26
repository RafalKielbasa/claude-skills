# sprawdzian-kroku-z-wgladem-w-kod-bez-reguly

- **Skill:** nauka-z-claude
- **Typ:** porażka
- **Status:** otwarty

## Opis
W sprawdzianie kroku opartego o kod Rafał prosi o ścieżkę pliku, żeby przed odpowiedzią
zajrzeć do kodu. Skill tego nie rozstrzyga, więc Claude sam decyduje, że wgląd jest
dozwolony, i zalicza odpowiedź udzieloną po lekturze kodu. Wpis wątpliwy: decyzja mogła być
trafna, ale podjął ją model, nie Rafał.

## Przyczyna źródłowa
Warunek zaliczenia brzmi „poprawnie, własnymi słowami, bez naprowadzenia” i nie mówi, czy
materiał źródłowy jest dozwolony. W temacie kodowym dowód kroku bywa wprost review kodu, więc
oba odczytania są obronne, a wybór zmienia znaczenie `[x]`: „pamięta mechanizm” albo
„umie go znaleźć i objaśnić w kodzie”.

## Dowody
- 2026-10-26, sesja 13cf4e4b-eabc-4759-85fd-9f693f32f51f (id claude.ai niedostępny),
  sprawdzian kroku 1 „Agent notatek”, pytanie 2 (read z `start` poza końcem pliku). Rafał:
  „podaj adres pliku żebym mógł go przeczytać”. Podałem `agent.py` i `run_agent` bez numerów
  linii („sprawdzian dotyczy tego, czy rozumiesz przebieg, a nie tego, czy pamiętasz numery
  linii”). Odpowiedź po zaznaczeniu linii 535 w IDE zaliczona, w pliku postępu odnotowane
  „odpowiedź po przeczytaniu kodu”.

## Rozwiązanie
Hipoteza do decyzji Rafała. W sekcji „Sprawdzian kroku” określić, czy wolno zajrzeć do kodu
lub notatki, np.: „W temacie kodowym wgląd w kod jest dozwolony, bez wskazywania linii;
odpowiedź po wglądzie zalicza, a fakt wglądu trafia do linii notatki sesji.” Albo wariant
odwrotny: wgląd = sprawdzian odłożony.
