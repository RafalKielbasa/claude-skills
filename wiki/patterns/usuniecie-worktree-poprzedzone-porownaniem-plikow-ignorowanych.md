# usuniecie-worktree-poprzedzone-porownaniem-plikow-ignorowanych

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Przed usunięciem worktree, których gałęzie są już w `main`, każdy plik na dysku porównałem z drzewem gałęzi.
Pliki spoza drzewa (ignorowane: media, sekrety, `.env`) porównałem po hashu z kopią główną. Usunąłem tylko
te worktree, w których nic nie było unikalne. Nic nie zginęło, a dowód jest liczbą, nie wrażeniem.

## Przyczyna źródłowa
`git worktree remove` bez `--force` odmawia tylko przy zmienionych plikach śledzonych i nieśledzonych
nieignorowanych. Pliki ignorowane kasuje bez słowa, a w repo kursów właśnie tam leżą media nagrań, sekrety
konta kursu i `.env` pipeline'u. „0 commitów poza `main`” nie mówi nic o drzewie roboczym. W sesji izolowanej
dochodzi strażnik: `git -C <inny worktree> status` jest odrzucany, więc zwykłego sprawdzenia nie ma.

## Dowody
- 2026-10-31, sesja def4d1f9-b042-446f-a69e-5044f811f431 (id claude.ai niedostępny; Baza wiedzy, worktree
  `baza-wiedzy-scal-dzien`, polecenie „scal … tak żeby nie tracić zmian, jeśli zmiany są już na main usuń
  worktree”). Wszystkie sześć gałęzi worktree miało 0 commitów poza `origin/main`.
  - Skrypt PowerShell porównał sumy `blob <rozmiar>\0<treść>` z `git ls-tree -r -z <gałąź>`
    (`core.autocrlf=false`). Wynik: 0 zmienionych, 0 brakujących.
  - Pliki spoza drzewa porównałem SHA-256 z kopią główną. W `agenty-ai-modul-2-bilet` było 2063 takich
    plików (media modułu 2, `secrets.yaml`, `.env`): 2061 identycznych, a 2 to znaczniki czasu hooka
    `nagrania-check`.
  - Pięć `git worktree remove` bez `--force` przeszło. Katalog z 2063 plikami ignorowanymi zniknął, czyli
    remove skasował je bez odmowy.

## Rozwiązanie
Przed `git worktree remove` sprawdź trzy rzeczy:
1. `git log origin/main..<gałąź>` jest pusty.
2. Pliki śledzone są zgodne z drzewem gałęzi: `git status --short`, a w sesji izolowanej porównanie hashy
   blobów z `git ls-tree -r -z`.
3. Każdy plik spoza drzewa ma identyczną kopię w kopii głównej albo jest jednorazowym stanem (znacznik
   hooka). Unikalny plik ignorowany oznacza stop: skopiuj go albo zapytaj, nigdy nie używaj `--force`.
