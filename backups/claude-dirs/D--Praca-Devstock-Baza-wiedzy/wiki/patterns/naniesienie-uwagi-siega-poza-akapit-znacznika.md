# naniesienie-uwagi-siega-poza-akapit-znacznika

- **Skill:** kurs-uwagi
- **Typ:** porażka
- **Status:** otwarty

## Opis

Cztery z dwunastu uwag naniesionych w M02L01 wymusiły zmianę poza akapitem, przy którym stał
znacznik. Skill mówi wprost, że „poza tymi miejscami plik zostaje bajt w bajt", więc każda taka
zmiana jest formalnie odstępstwem od instrukcji, choć bez niej scenariusz przestaje się trzymać kupy.

## Przyczyna źródłowa

Instrukcja opisuje scenariusz jak zbiór niezależnych akapitów, a scenariusz jest sekwencją. Beat
zakłada stan ekranu ustawiony przez poprzedni, a narracja całego segmentu bywa napisana pod wynik
demo. Uwaga, która przestawia stan albo unieważnia wynik, unieważnia wszystko, co za nią stoi —
i żadna reguła „tylko tam, gdzie wskazuje znacznik" tego nie obejmie.

## Dowody

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: (1) przeniesienie przełączenia opisu na tryb
  ręczny wcześniej zmusiło do przepisania późniejszego beatu, bo nie da się przełączyć dwa razy;
  (2) zdanie „Krok drugi... wywołaj narzędzie z takimi parametrami" obiecywało parametry, których po
  poprawce uwagi 6 na ekranie nie ma; (3) uwaga o pytaniu „wczoraj" w segmencie 8 zostawiała segment 9
  ze zdaniem „zadaję dokładnie to samo pytanie" i innym pytaniem — Rafał musiał to rozstrzygnąć
  osobnym pytaniem na bramce; (4) przekucie segmentu 9 pociągnęło jego zdanie otwierające („żebyś
  uwierzył w regułę") i zamykające („Działa"), obie napisane pod porażkę demo.

## Rozwiązanie

W kroku 4 prowadzić obok siebie dwie listy: zmiana w miejscu znacznika i zmiany wymuszone przez nią
dalej; na bramce pokazywać je osobno, żeby Rafał widział, co wyszło poza wskazane miejsce i dlaczego.
W kroku 3 dołożyć do pytań uwagę, której naniesienie przestawia stan ekranu dla kolejnych beatów albo
unieważnia zdanie o wyniku demo — to jest ta sama klasa co „sygnał zamiast instrukcji", bo zakres
zmiany nie wynika z treści uwagi.
