# drobne-zadanie-jednej-osoby-odrzucane-przy-bramce

- **Skill:** daily (krok 6, kontrakt `zadania.yaml`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Z każdego action item powstaje kandydat na issue. Rafał przy bramce odrzuca te, które są drobną
czynnością jednej osoby, załatwianą jednym krokiem: odpisać, podesłać, napisać do kursantów,
ustawić powiadomienie. Kolejka zadań rośnie o karty, które z góry kończą się na „Odrzuć”.

## Przyczyna źródłowa
Krok 6 każe zbudować „one task candidate per action item” i nie ma progu, co jest jednostką pracy
na tablicę. Notatka i tak zapisuje każdy action item w `## Action items`, więc issue dla czynności
na kilka minut dubluje zapis i zaśmieca Backlog. Moja ocena: Rafał nie podał powodu odrzuceń
wprost, wzorzec opiera się na tym, które zadania odrzucił. Obserwacja do potwierdzenia.

## Dowody
- 2026-10-09, daily 11:31 (id sesji niedostępny; ślad w `planning/daily/2026-10-09-1131/zadania.yaml`):
  odrzucone #1 „Odpowiedź osobie zainteresowanej Misją AI: 87 zł…” i #3 „Moduł 3: informacja dla
  kursantów o starcie…”. W obu przypadkach Bart sam zadeklarował jednorazową wiadomość.
- 2026-10-12, sesja e29922c9-6a91-4deb-bf7b-afd0650bc8f6: odrzucone #2 „Powiadomienia o zbliżaniu
  się do budżetu w GCP” (Grzegorz zadeklarował się sam, `elstyropiano`) i #3 „Podesłać Bartowi
  materiały na wtorkowe spotkanie” (Rafał sam). Zatwierdzone zostały zadania bez właściciela albo
  wymagające decyzji: pomiar źródeł rejestracji (#648) i komentarz w #175.

## Rozwiązanie
Action item, który jedna osoba zadeklarowała dla siebie i który mieści się w jednym krótkim kroku
(odpisać, podesłać, ustawić), zostaje w `## Action items` notatki. Na karcie zadania dostaje
„Odrzuć (drobne — zostaje w notatce)” jako opcję pierwszą. Kandydatem z rekomendacją „Akceptuj”
jest dopiero praca na więcej niż jeden krok albo sprawa bez właściciela.
