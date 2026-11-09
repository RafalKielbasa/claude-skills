# pusty-gh-token-wraca-do-zapisanego-logowania

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sonda nowego tokenu, uruchomiona jako `GH_TOKEN="$(cat ~/.config/card-trail-token)" node cli.js token-probe`, zwróciła `ok: true`, choć pliku z tokenem nie było. Sonda sprawdziła zapisany login `gh`, a wynik wyglądał jak sukces nowego tokenu.

## Przyczyna źródłowa
`$(cat <brak pliku>)` daje pusty napis. `gh` traktuje pusty `GH_TOKEN` jak nieustawiony i bierze poświadczenia z `gh auth`. Komenda podana użytkownikowi nie sprawdzała, czy plik istnieje, a sonda nie sprawdzała, czy zmienna jest niepusta. Plik zapisany w Notatniku dostał rozszerzenie `.txt`, więc ścieżka się nie zgadzała.

## Dowody
- 2026-11-09, sesja f83b042b-5c80-43ff-8320-902beeeba944 (id claude.ai niedostępny; Baza wiedzy, DT-134 #910): pierwszy przebieg sondy dał `cat: … No such file or directory`, a potem `ok: true` z zakresami `gist, project, read:org, repo, workflow`, czyli zakresami logowania `gh`, nie tokenu. Wykryte po zakresach. Naprawa: sonda odrzuca pusty `GH_TOKEN` (`aaf12356`), a każda komenda dla Rafała zaczyna się od `[ -s plik ] &&`. Plik okazał się `card-trail-token.txt`.

## Rozwiązanie
Komenda, która podaje poświadczenie z pliku przez `$(cat …)`, zaczyna się od `[ -s <plik> ] &&`. Narzędzie sprawdzające nowe poświadczenie odrzuca pustą zmienną, zanim cokolwiek wywoła, i wypisuje tożsamość oraz zakresy, z którymi faktycznie się uwierzytelniło. Wynik sondy czytaj po tych polach, nie po samym `ok`.
