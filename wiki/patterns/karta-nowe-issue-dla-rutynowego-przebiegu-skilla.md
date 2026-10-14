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

## Rozwiązanie
Sesję, której jedyną zmianą jest przebieg `/daily` (artefakty w `planning/daily/`), a w puli nic nie
pasuje, raportować od razu jako „Tablica: sesja bez przypięcia (daily)”, bez karty. Wyjątek nie
obejmuje `/spotkanie`: tam Rafał założył issue (2026-10-14). Kartę „Nowe issue” zawsze zadawać przez
`AskUserQuestion` z kartą w `preview`, nie drukować w czacie. W sesji z bramką na `AskUserQuestion`
zadać ją przed pierwszą kartą bramki, żeby nie zginęła w przewiniętym czacie.
