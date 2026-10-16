# pytania-niezalezne-zadawane-po-jednym-na-ture

- **Skill:** superpowers:brainstorming
- **Typ:** porażka
- **Status:** otwarty

## Opis
Decyzje projektowe, które nie zależą od siebie nawzajem, idą w osobnych turach —
jedno pytanie, odpowiedź, następne pytanie. Użytkownik płaci trzema rundami za
zestaw pytań, który zmieściłby się w jednym wywołaniu `AskUserQuestion`.

## Przyczyna źródłowa
`superpowers:brainstorming` mówi wprost „Only one question per message - if a
topic needs more exploration, break it into multiple questions". Reguła ma sens
tam, gdzie odpowiedź na pytanie N zmienia treść pytania N+1, ale skill nie
rozróżnia pytań zależnych od niezależnych i stosuje ją do wszystkich. Narzędzie
`AskUserQuestion` przyjmuje do czterech pytań w jednym wywołaniu, a w tym repo
istnieje już wzorzec sukcesu o łączeniu bramek w jedno pytanie
(`bramki-wyboru-i-potwierdzenia-w-jednym-pytaniu`, wiki repo Baza wiedzy), więc
preferencja użytkownika idzie w drugą stronę niż instrukcja skilla.

## Dowody
- 2026-09-11, sesja session_01Ed5FeuzWuuXgE2NexUX3pe: projekt sekcji „do
  wklejenia" w pipelinie wideo wymagał trzech decyzji — kto składa sekcję
  (model czy generator), co do niej wchodzi (wszystko z klawiatury czy same
  bloki) i kiedy powstaje (przy pisaniu lekcji czy po zatwierdzeniu). Żadna nie
  zmieniała treści pozostałych: odpowiedź na pierwszą („model przechodzi
  scenariusz i widzi, co wklejam") nie przestawiła ani opcji drugiego, ani
  trzeciego pytania, które były przygotowane wcześniej. Mimo to poszły w trzech
  osobnych turach, bo skill zakazuje więcej niż jednego pytania na wiadomość.

- 2026-09-22, sesja (id niedostępny), skill `kurs-video`: drugi dowód, druga
  sesja, **pierwszy raz z zastosowanym rozwiązaniem ze strony**. Dwie niezależne
  decyzje — silnik avatara (`mcp` czy `api`, obowiązkowa bramka kroku 2 skilla)
  i co zrobić z brakującą ściągą `video/dane-do-nagrania.md` — poszły w jednym
  wywołaniu `AskUserQuestion`. Zależność rozstrzygnięta przed pytaniem:
  odpowiedź na żadne nie zmieniała opcji drugiego, bo silnik dotyczy segmentów
  avatarowych, a ściąga etapu nagrywania. Rafał odpowiedział na oba naraz
  („MCP (plan konta)", „Renderuj teraz, ściąga potem") i render ruszył po
  jednej rundzie zamiast dwóch, przy płatnym API po obu stronach.

- 2026-10-09, sesja ece85169-32f2-44b7-9695-689c071f34ce (id claude.ai
  niedostępny): trzeci dowód, trzecia sesja, oba warianty w jednej rozmowie.
  - Bramka publikacji (poza brainstormingiem): trzy niezależne decyzje
    („publikować?”, strefa crona, termin pierwszego raportu) poszły w jednym
    `AskUserQuestion`, a odpowiedzi przyszły w jednej rundzie.
  - Brainstorming zasady „gałąź dnia” zadał trzy pytania w trzech turach:
    pliki lokalne, zasięg, sposób scalania. Zasięg (tylko Rafał czy zespół)
    nie zależał od odpowiedzi o worktree, więc mógł pójść razem z nią.
    Pytanie o scalanie zależało od odczytu historii, więc osobna tura była
    tam uzasadniona.

- 2026-10-16, sesja 7875e423-9ae8-4e55-a56b-31766c608f4e (id claude.ai niedostępny): czwarty dowód, czwarta sesja, rozwiązanie zastosowane w tekście zamiast
  `AskUserQuestion`. Trzy niezależne decyzje („Klucz i zakres projektu”, „Meta projektu” i pytanie
  specu „Lista komponentów v1” z brainstormingu biblioteki) poszły w jednej wiadomości jako
  warianty z rekomendacją i „OK = wszystkie [A]”; Rafał odpowiedział jednym „ok”. Brainstorming
  7.0.0 każe kończyć wiadomość jednym pytaniem bez listy odpowiedzi; poszły warianty według
  „Recommendation-First” z `CLAUDE.md`, bo instrukcja użytkownika wygrywa ze skillem.

## Rozwiązanie
Przed zadaniem pytań rozstrzygnąć, czy odpowiedź na którekolwiek zmienia
brzmienie albo opcje pozostałych. Pytania zależne zadawać po jednym, zgodnie
z regułą skilla; pytania niezależne złożyć w jedno wywołanie `AskUserQuestion`
(limit cztery), z nagłówkiem mówiącym, że to komplet decyzji potrzebnych do
projektu. Regułę „one question per message" czytać jako „jedno pytanie zależne
na wiadomość".
