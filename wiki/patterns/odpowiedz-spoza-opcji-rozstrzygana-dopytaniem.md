# odpowiedz-spoza-opcji-rozstrzygana-dopytaniem

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis

Użytkownik odpowiada w `AskUserQuestion` wolnym tekstem („Other"), ale odpowiedź nie jest żadną
z opcji ani ich wariantem — nazywa byt z zupełnie innej osi niż pytanie. Zamiast wybrać
najbliższą opcję albo domyślić się intencji, wypisałem trzy możliwe odczytania tego jednego słowa
i poprosiłem o wskazanie numeru; użytkownik odpowiedział „1" i praca ruszyła na potwierdzonym
wariancie.

## Przyczyna źródłowa

`AskUserQuestion` zawsze dokłada „Other" jako wolny tekst, a opcje formułuje się mechanizmami
(„bramką jest `status.video`", „bramką jest obecność ID"). Użytkownik myśli wtedy o tym, **kto
i kiedy decyduje**, a nie o tym, co sprawdza kod — i odpowiada nazwą procesu albo skilla. Taka
odpowiedź wygląda na wybór (jest krótka, konkretna, pasuje do tematu), a jest wskazaniem innej
osi; interpretacja własna jest tu tania i kusząca, bo „przecież widać, o co chodzi".

## Dowody

- 2026-09-16, sesja (id niedostępny), repo Baza wiedzy: na pytanie „który status wpuszcza wideo na
  platformę?" (opcje: `status.video: zaakceptowane` / obecność ID Vimeo / oba naraz) padła
  odpowiedź „kurs-publikuj " — nazwa skilla publikującego. Trzy pozostałe odpowiedzi z tego samego
  wywołania były jednoznaczne i zostały wzięte bez pytania. Ponowne pytanie rozpisało trzy
  odczytania (brak bramki w pipelinie; bramka statusu, którą skill przestawia; bramką jest
  `status.publikacja`), wybór padł na pierwsze. Gdyby wybrać za użytkownika „bramkę statusu",
  powstałby kod odrzucający publikację wideo, której nikt nie chciał blokować.

## Rozwiązanie

Odpowiedź spoza listy opcji traktować jak **wskazanie innej osi**, nie jak wybór. Nie mapować jej
samodzielnie na najbliższą opcję i nie zaczynać pracy, która od niej zależy. Zamiast tego: jedno
zdanie, które odpowiedzi biorę jak stoją (te jednoznaczne z tego samego wywołania), i ponowne
pytanie z 2–3 **odczytaniami tego konkretnego słowa**, każde opisane skutkiem dla kodu, nie
nazwą mechanizmu. Pracę niezależną od tej odpowiedzi wolno wykonać i trzeba ją wtedy nazwać;
zależną — dopiero po odpowiedzi.
