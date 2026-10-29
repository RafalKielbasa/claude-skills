# karta-nowe-issue-dla-rutynowego-przebiegu-skilla

- **Skill:** board-tracker
- **Typ:** porażka
- **Status:** otwarty

## Opis
Sesja, której całą pracą jest jeden przebieg rutynowego skilla (`/daily` przetwarzający nagranie),
dostaje kartę „Nowe issue”, bo w puli nic nie pasuje. Rafał odpowiada „nie zakładaj”. Karta
wydrukowana w czacie na początku pracy czekała przez całą budowę notatki i została rozstrzygnięta
dopiero wtedy, gdy poszła jako `AskUserQuestion`.

## Przyczyna źródłowa
Reguła przypięcia uruchamia się przy pierwszej zmianie pliku i nie odróżnia pracy projektowej od
powtarzalnego procesu, który z założenia nie ma issue. Wynik „none” w tabeli decyzji prowadzi
zawsze do karty. Skill każe pokazać kartę w odpowiedzi i pracować dalej. Gdy ta sama sesja prowadzi
potem bramkę na `AskUserQuestion`, karta w tekście ginie w przewiniętym czacie.

## Dowody
- 2026-10-12, sesja e29922c9-6a91-4deb-bf7b-afd0650bc8f6: `/daily 2026-10-12 1110`. Karta „DT-?:
  Notatka z daily 2026-10-12 11:10” stała w czacie przed zapisem transkryptu i pozostała bez
  odpowiedzi przez pytanie o typ nagrania i budowę kolejek. Ponowiona jako `AskUserQuestion` przed
  bramką dostała „nie zakładaj”. Wcześniejsze daily (2026-10-08, 2026-10-09) też nie miały issue.
  Dla porównania: w sesji 53ceea80 karta włożona w `preview` pytania przeszła gładko.
- 2026-10-14, sesja 9c60c6ac-d756-43f9-af2c-be591fa8c566: `/spotkanie transkrypt` (uzupełnienie
  offsite'u 13.10 i egzekucja kolejek). Karta „DT-?: Notatka offsite 13.10: popołudniowa część…”
  wydrukowana w czacie przed pierwszą zmianą pliku znów przeczekała bez odpowiedzi 6 kart ⚠,
  13 kart kolejek i ekran końcowy. Tym razem Rafał po raporcie końcowym napisał „Załóż issue”
  (#676, DT-34, potem Done). Przebieg `/spotkanie` z egzekucją na tablicy to inna praca niż
  rutynowe `/daily`, więc Rafał chciał dla niej issue.
- 2026-10-28/29, sesja claude.ai/code/session_01WryF5UdQSho3p8jEyswqrD (lokalnie
  16c3aefd-ec1a-48b5-b40b-be038c6346a4): `/daily` bez argumentu i cztery zaległe daily z 23–28.10.
  Karta „DT-?: Przetworzenie zaległych daily z 23–28.10” (company, M, epik #10) wydrukowana w czacie
  przed pierwszą zmianą pliku. Potem przypominana w 📌 kolejnych bramek jako „też czeka na tak /
  popraw / nie zakładaj” i nie dostała odpowiedzi przez cztery bramki (około 45 odpowiedzi Rafała
  na karty). Raport końcowy: „sesja bez przypięcia”. `AskUserQuestion` tym razem nie pomógłby:
  wygasało 25 razy, więc cała bramka szła w czacie. Rafał odpowiadał na jedno pytanie z ❓ i
  ⏸, a karta wymieniona obok jako druga decyzja nie dostała odpowiedzi. Trzecia sesja, w której
  ta sama karta dla rutynowego przebiegu skończyła się bez issue albo z „nie zakładaj”.

## Rozwiązanie
Sesję, której jedyną zmianą jest przebieg `/daily` (artefakty w `planning/daily/`), a w puli nic nie
pasuje, raportować od razu jako „Tablica: sesja bez przypięcia (daily)”, bez karty. Wyjątek nie
obejmuje `/spotkanie`: tam Rafał założył issue (2026-10-14). Kartę „Nowe issue” zawsze zadawać przez
`AskUserQuestion` z kartą w `preview`, nie drukować w czacie. W sesji z bramką na `AskUserQuestion`
zadać ją przed pierwszą kartą bramki, żeby nie zginęła w przewiniętym czacie.
Gdy `AskUserQuestion` wygasa i bramka idzie w czacie (2026-10-28), karta nie może stać obok
pytania z ❓ jako druga decyzja. Odpowiedź dostaje tylko pytanie zakończone ⏸. Dla `/daily`
(także kilku zaległych w jednej sesji) karty więc nie ma wcale.
