# regex-walidatora-uzyty-jako-fixer-typografii

- **Skill:** kurs-lekcja (krok 4/5), dotyczy wszystkich skilli `kurs-*` piszących treść
- **Typ:** porażka
- **Status:** otwarty

## Opis
Skrypt wstawiający twarde spacje U+00A0 do artykułu lekcji zostawił w 292
miejscach NBSP **plus** zwykłą spację, czyli podwójny odstęp w każdym miejscu,
które miał naprawić. Walidacja przeszła na zielono, bo `typografia.js` sprawdza
tylko, czy po jednoliterowym słowie NIE stoi zwykła biała spacja — a NBSP tam
stoi. Defekt zobaczył dopiero `review-ai`, w zdaniu o typografii, które
w reszcie raportu chwaliło zgodność ze styleguide.

## Przyczyna źródłowa
Regex skopiowany z walidatora jest **detektorem, nie fixerem**, a różnica siedzi
dokładnie w lookaheadzie. `typografia.js` używa `([aiouwzAIOUWZ])(?= )`, bo przy
ZLICZANIU nie wolno skonsumować separatora — inaczej „a i o" zgubiłoby co drugie
trafienie (komentarz przy `SIEROTKA` mówi o tym wprost). Fixer ma odwrotny
wymóg: musi spację skonsumować i zastąpić. Skopiowany dosłownie regex wykrywa
poprawnie i podmienia błędnie, a wynik przechodzi przez ten sam walidator, z
którego regex pochodzi — narzędzie nie może złapać błędu, którego jest źródłem.

Drugie źródło: `tools/course-pipeline` ma walidator typografii, ale nie ma
fixera. Każda lekcja to pisanie skryptu od nowa, na kolanie, i ten sam błąd do
popełnienia od zera.

## Dowody
- 2026-09-10, sesja session_01316pV2UPCFTTDHE9dksP6H: generowanie lekcji 2.1
  kursu agenty-ai. `sierotki.mjs` z regexem `([aiouwzAIOUWZ])(?= )` przepisanym
  z `src/typografia.js` i podmianą `'$1 '`; raport skryptu: „wstawiono 291
  twardych spacji", walidacja `OK — walidacja czysta`. Dopiero `git`-owy
  odczyt komórki tabeli pokazał `w\xa0 panelu`, `z\xa0 konta`, czyli NBSP +
  spacja. Recenzent zapisał to jako „(Podwójne spacje widoczne w tekście
  źródłowym sugerują, że poprawnie zastosowano też twarde spacje dla sierotek)"
  — czyli odczytał defekt jako dowód poprawności. Naprawa: `s.replace('  ',
  ' ')` na 292 wystąpieniach i zmiana regexu skryptu na konsumujący
  (`([aiouwzAIOUWZ]) `).

## Rozwiązanie
Regex z walidatora kopiuj do skryptu naprawczego, ale **przepisz lookahead na
konsumpcję** i dopisz do skryptu asercję wyniku, która sprawdza to, czego
walidator nie sprawdza: po przebiegu w pliku nie może być sekwencji
`U+00A0` + biała spacja. Zasada ogólna: walidator odpowiada na pytanie „czy jest
źle", fixer na „jak ma wyglądać dobrze" — te dwa pytania mają różne wyrażenia
i weryfikacja fixera nie może opierać się wyłącznie na walidatorze.

Docelowo: dołożyć do `tools/course-pipeline` komendę naprawiającą sierotki
(`npm run sierotki -- <lekcja>`) obok walidatora i wskazać ją w krokach
typografii skilli `kurs-*`, żeby skrypt nie powstawał od nowa przy każdej
lekcji. Patrz [[skrypt-z-asercja-zamiast-serii-edycji]] — jego reguła „regex
skryptu kopiować z walidatora, nie odgadywać" jest słuszna, ale wymaga tego
zastrzeżenia o lookaheadzie.
