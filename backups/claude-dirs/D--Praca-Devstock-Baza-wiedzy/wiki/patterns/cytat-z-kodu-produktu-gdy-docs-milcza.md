# cytat-z-kodu-produktu-gdy-docs-milcza

- **Skill:** kurs-lekcja (krok 2, research)
- **Typ:** sukces
- **Status:** otwarty

## Opis
Element interfejsu, wokół którego zbudowana jest cała lekcja, nie był opisany
w dokumentacji n8n — ani jego działanie, ani tekst podpowiedzi, ani sposób
składania wartości domyślnej. Źródłem prawdy okazał się commit w repozytorium
produktu: dał dosłowny cytat do wklejenia w lekcję i wzorzec, z którego n8n
generuje opis automatyczny.

## Przyczyna źródłowa
Dokumentacja opisuje przepływy pracy („jak zbudować agenta"), a nie pojedyncze
pola formularza. Element, który jest sednem lekcji dla nietechnicznych — bo to
w nim tkwi cała różnica między działającym a niedziałającym agentem — bywa
w dokumentacji niewidoczny właśnie dlatego, że dla autora docs jest oczywisty.
n8n jest open source, więc string z UI i logika wartości domyślnej są dostępne
jednym wyszukiwaniem, i są mocniejszym źródłem niż dokumentacja: to jest
dokładnie ten tekst, który kursant zobaczy na ekranie.

## Dowody
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: lekcja 2.1, pole opisu
  narzędzia. Trzy strony dokumentacji (`how-tools-work`, strona węzła Gmail,
  `build-and-manage-agents`) nie podają ani tekstu podpowiedzi, ani reguły
  składania opisu automatycznego. Commit `726438d` w `n8n-io/n8n`
  („feat(editor): Improve manual description in nodes as tools", #15373) dał
  jedno i drugie: podpowiedź „Explain to the LLM what this tool does, a good,
  specific description would allow LLMs to produce expected results much more
  often" oraz wzorzec `{action} in {displayName}`. Z tego drugiego wynika, że
  automatyczny opis dla akcji Gmaila brzmi „Get many messages in Gmail" — i to
  zdanie stało się pointą kroku 4 lekcji („poprawne i całkowicie bezużyteczne").
  Bez commita ta pointa byłaby zgadywana.

## Rozwiązanie
Gdy lekcja opiera się na konkretnym polu, przycisku albo komunikacie
interfejsu, a dokumentacja opisuje tylko przepływ, szukać stringu w repozytorium
produktu (`github.com/<org>/<repo>`, wyszukiwanie po frazie z UI albo po nazwie
parametru). Wyszukiwarka kodu GitHuba wymaga zalogowania, więc idzie się przez
zwykłe wyszukiwanie po nazwie parametru plus nazwie repo, a potem otwiera commit
albo plik surowy.

Do `zrodla.md` wpisywać wtedy commit z jego tytułem i cytowanym stringiem,
zaznaczając, że to źródło z kodu, nie z dokumentacji — kolejna lekcja z tej
rodziny dostaje wtedy gotowy trop zamiast powtarzać poszukiwania. Ten sam ruch
działa dla każdego produktu open source używanego w kursie.
