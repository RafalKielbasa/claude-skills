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

## Rozwiązanie
Przed zadaniem pytań rozstrzygnąć, czy odpowiedź na którekolwiek zmienia
brzmienie albo opcje pozostałych. Pytania zależne zadawać po jednym, zgodnie
z regułą skilla; pytania niezależne złożyć w jedno wywołanie `AskUserQuestion`
(limit cztery), z nagłówkiem mówiącym, że to komplet decyzji potrzebnych do
projektu. Regułę „one question per message" czytać jako „jedno pytanie zależne
na wiadomość".
