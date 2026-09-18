# cytat-z-kodu-produktu-gdy-docs-milcza

- **Skill:** kurs-lekcja (krok 2, research), live-demo
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
- 2026-09-11, sesja session_01M1roR3MszbAgi1a1AE3xqh: drugi dowód, lekcja 2.2,
  ten sam ruch i ten sam skutek, ale tym razem z granicą metody. Dokumentacja
  n8n opisuje przycisk "Let the model define this parameter" i funkcję
  `$fromAI()`, nie podaje jednak postaci wyrażenia, które przycisk wstawia -
  a to ono jest pointą kroku 3 lekcji ("klucz to zlepek nazwy pola, opis jest
  pusty"). Postać znalazła się w zgłoszeniach repozytorium produktu
  (`n8n-io/n8n` issue 21606): `{{ /*n8n-auto-generated-fromAI-override*/
  $fromAI('Calendar', ``, 'string') }}`, plus przykłady kluczy z Gmaila
  (`Message_ID`, `Label_Names_or_IDs`). Granica: dla węzła Google Sheets,
  którego lekcja używa, dokładnego klucza nie potwierdza ani dokumentacja, ani
  żadne zgłoszenie. Zamiast zgadywać cicho, artykuł podaje `Filters_Lookup_Value`
  ze zdaniem "dokładna nazwa klucza bierze się z nazwy pola, więc u Ciebie może
  brzmieć nieco inaczej", a `konspekt-nagrania.md` dostał krok, który każe
  pokazać to pole w kadrze. Weryfikacja przeniesiona do nagrania, nie pominięta.

- 2026-09-18, sesja 3aaf54dc (id claude.ai niedostępny): ten sam ruch poza
  kursami, przy diagnozie i przy budowie węzła. Telegram odrzucał meldunek
  z demo błędem `can't parse entities`, choć w węźle nie ustawiono żadnego
  Parse Mode — `nodes/Telegram/GenericFunctions.ts:104` pokazał dlaczego:
  `if (!additionalFields.parse_mode) additionalFields.parse_mode = 'Markdown'`,
  a `:301`, że `createSendAndWaitMessageBody` ma `parse_mode: 'Markdown'` na
  sztywno, więc bramki nie da się z tego wypiąć ustawieniem. Z pamięci
  wychodziło, że domyślną wartością jest HTML — i to jest prawda, ale tylko
  dla pola dodanego ręcznie (`Telegram.node.ts:1117`), nie dla pola pustego.
  Drugi raz tego samego dnia przy pisaniu węzła Send and Wait: nazwy parametrów
  (`responseType: 'approval'`, `approvalOptions.values.approvalType: 'double'`,
  `options.limitWaitTime.values.{limitType,resumeAmount,resumeUnit}`) i postać
  wyjścia po kliknięciu (`{ json: { data: { approved, respondedAt } } }`,
  `utils/sendAndWait/utils.ts:492`) wzięte z kodu zamiast zgadywane — dzięki
  temu warunek IF-a stoi na `data.approved`, a nie na wymyślonej ścieżce.

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

Gdy nawet repo produktu nie daje pewności co do konkretnego wystąpienia (bo
string składa się z nazwy pola, a zgłoszenia pokazują go tylko dla innych
węzłów), nie zgaduj cicho i nie rezygnuj z konkretu. Podaj wartość najbardziej
prawdopodobną razem ze zdaniem, które nazywa niepewność w treści lekcji
(„dokładna nazwa bierze się z nazwy pola, więc u Ciebie może brzmieć inaczej"),
i dołóż do `konspekt-nagrania.md` krok, który każe pokazać to miejsce w kadrze.
Nagranie jest jedynym momentem, w którym ktoś i tak patrzy na prawdziwy
interfejs - przeniesienie tam weryfikacji kosztuje jedną linię konspektu,
a przemilczenie niepewności kosztuje błąd w zatwierdzonej lekcji.
