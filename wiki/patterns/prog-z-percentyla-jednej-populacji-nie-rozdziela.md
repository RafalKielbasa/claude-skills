# prog-z-percentyla-jednej-populacji-nie-rozdziela

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis

Progi walidatora wygenerowane automatycznie z percentyli 10 i 90 rozkładu wzorcowego opisują, jak
szeroko rozrzucona jest populacja wzorcowa — i dlatego nie wykrywają próbki, która do tej populacji
nie należy. Walidator milczy na tekście, który gołym uchem nie brzmi jak wzorzec.

## Przyczyna źródłowa

Percentyl jest miarą rozrzutu **wewnątrz** jednego zbioru, a próg ma rozdzielać **dwa** zbiory. To
dwa różne zadania i tylko przypadkiem dają ten sam wynik. Pasmo p10–p90 z definicji obejmuje 80
procent wzorca, więc jest szerokie; im bardziej wzorzec jest niejednorodny (w korpusie mowy: lekcja
demowa obok wykładowej), tym szersze, aż przestaje wykluczać cokolwiek. Nikt tego nie zauważa, bo
liczby pochodzą z prawdziwych danych i wyglądają na uzasadnione.

## Dowody

- 2026-09-18, sesja (id niedostępny), repo Baza wiedzy: blok `cele:` profilu wypowiedzi powstał
  z percentyli korpusu 19 nagrań (mediana zdania, udział zdań krótkich, pierwsza osoba, pytania).
  Lekcja `modul-03-badacz-deep-research/lekcja-01-nawigacja-pliki` **przeszła wszystkie cztery**
  (mediana 8 w paśmie 4–21, zdania krótkie 24% przy progu 13%, ja 2,8 przy progu 1,0, pytania 1,2
  w paśmie 1,1–10,4), mając przy tym 2,0 markera tempa na 1000 słów i zero powrotów do myśli.
  Liczba „przed" dla testu akceptacyjnego wyszła zerowa, czyli kryterium „po redakcji ma być mniej
  ostrzeżeń" stało się niewykonalne. Metryka, która rozdziela zbiory **bez ani jednego przypadku
  brzegowego**, leżała poza `cele:`: najsłabsze nagranie wzorca ma 27,6 markera tempa na 1000 słów,
  najgęstszy z 14 sprawdzanych tekstów 11,4. Próg 15 ostrzega 14/14 tekstów i 0/19 nagrań.

## Rozwiązanie

Progu nie wyprowadzaj z jednego rozkładu. Policz metrykę na **obu** populacjach — wzorcowej i tej,
którą chcesz wykrywać — i wybierz tę, w której zakresy się nie nakładają; próg stawiaj w luce.
Kandydatów odrzuconych wypisz z liczbami, żeby było widać, że sprawdzone, a nie pominięte. Test
kontrolny formułuj jako „metryka odróżnia A od B", nie „metryka mieści się w paśmie A" — ten drugi
przechodzi także wtedy, gdy pasmo obejmuje wszystko.
