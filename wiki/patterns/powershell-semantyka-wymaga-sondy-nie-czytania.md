# powershell-semantyka-wymaga-sondy-nie-czytania

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
PowerShell 5.1 ma kilka miejsc, w których zachowanie jest zaskakujące względem intuicji
przeniesionej z innych języków (np. rozpakowywanie tablic w pipeline, moment ewaluacji
`$PSScriptRoot`, wpływ `$ErrorActionPreference` na komendy natywne łączone przez `2>&1`).
Czytanie dokumentacji albo samego kodu nie wystarczyło — poprawne ustalenie zachowania
wymagało za każdym razem odizolowanej sondy: minimalnego skryptu uruchomionego naprawdę,
nie przewidzianego na papierze.

## Przyczyna źródłowa
Semantyka PowerShell w tych miejscach zależy od interakcji kilku mechanizmów naraz
(pipeline unwrapping, kolejność inicjalizacji `param()`, sposób, w jaki `$ErrorActionPreference`
przechwytuje strumień błędów komend natywnych) — efekt końcowy nie jest wyprowadzalny
z osobnego przeczytania dokumentacji każdego mechanizmu z osobna, bo dokumentacja opisuje
mechanizmy pojedynczo, nie ich skład.

## Dowody
- 2026-09-03, sesja `session_0115YBg2ri1ajCfG8GNynEsZ`: `$PSScriptRoot` okazał się pusty
  podczas ewaluacji wartości domyślnej w `param()` przy wywołaniu `powershell.exe -File` —
  potwierdzone osobną sondą, nie wywnioskowane z dokumentacji. Fix: rozwiązywać `-Root` na
  pierwszej linii ciała skryptu, nie w bloku `param()`.
- 2026-09-03, ta sama sesja: obiekt z `ConvertFrom-Json` rzuca
  `SetValueInvocationException` przy przypisaniu przez kropkę do nieistniejącej właściwości,
  **niezależnie od `Set-StrictMode`** — zweryfikowane sondą z i bez `Set-StrictMode`.
- 2026-09-03, ta sama sesja: `2>&1` na komendzie natywnej przy aktywnym
  `$ErrorActionPreference = 'Stop'` zamienia sam output na stderr w wyjątek terminujący w
  linii wywołania, zanim `$LASTEXITCODE` zostanie sprawdzony — potwierdzone nawet dla
  faktycznie udanego `git fetch --verbose` (git pisze postęp na stderr). Fix: skopować
  `$ErrorActionPreference = 'Continue'` wyłącznie wokół wywołania natywnego, przywrócić w
  `finally`.
- 2026-09-03, ta sama sesja: owinięcie w zewnętrzny `@(...)` w miejscu wywołania funkcji,
  która sama zwraca `return , @(...)`, podwójnie opakowuje pusty wynik w jednoelementową
  tablicę zawierającą pustą tablicę (`.Count` = 1 zamiast 0). Zwykłe nawiasy albo
  bezpośrednie przechwycenie do zmiennej nie mają tego efektu — tylko `@(Get-Thing)` w
  miejscu wywołania.
- 2026-09-04/05, sesja session_01WXmUJrXM5viDmNJuc3xjy6: `Write-Error` pod `$ErrorActionPreference = "Stop"` przerywa skrypt, więc następujące po nim `exit 2` nigdy się nie wykonuje i skrypt kończy **kodem 1** — czyli tym, który w tym projekcie znaczy „przeszła uwaga blokująca". Wykryte sondą uruchamiającą te trzy instrukcje po kolei i pokazującą EXITCODE=1, nie lekturą kodu. W tej samej sesji ten sam mechanizm psuł kod wyjścia przy przekierowaniu stderr do `Tee-Object`.

- 2026-09-11, sesja session_01YVYBimtiCfF3SS1QHH4Cvi: `$_` w bloku `catch` wewnątrz `ForEach-Object`
  wskazuje **ErrorRecord**, nie element potoku. Sonda szukająca zablokowanych
  plików (`[System.IO.File]::Open(...,'Open','ReadWrite','None')` w `try`,
  `$locked += $_.Name` w `catch`) zwróciła poprawną liczbę wyników i same puste
  nazwy: `Zablokowane pliki: , , , , , , , , ,`. Objaw mylący, bo licznik się
  zgadzał — nie wyglądało to na błąd dostępu do zmiennej. Rozstrzygnięte drugą
  sondą, nie czytaniem dokumentacji: przechwycenie `$n = $_.Name` **przed**
  `try` dało od razu pełną listę (`03-01.mp3` … `04-06.mp3`), a ciągłość tego
  bloku wskazała aplikację z wczytaną listą plików zamiast pojedynczego
  podglądu.


## Rozwiązanie
Gdy zachowanie PowerShell 5.1 jest niepewne albo zaskakujące (a zwłaszcza gdy dotyczy
`$PSScriptRoot`, `ConvertFrom-Json`, `$ErrorActionPreference` z komendami natywnymi, albo
opakowania tablic w pipeline) — nie rozstrzygać przez czytanie kodu ani dokumentacji.
Napisać dwu-trzy-liniowy izolowany skrypt sondujący, uruchomić go naprawdę, i dopiero na
tej podstawie projektować fix. Udokumentować ustalone zachowanie jako trwałą regułę
(np. w sekcji Global Constraints planu), żeby kolejne zadania w tej samej sesji z niej
korzystały bez ponownego sondowania.
