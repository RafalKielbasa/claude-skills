# zielony-suite-z-mockami-nie-widzi-binarki-ani-poswiadczen

- **Skill:** superpowers:verification-before-completion
- **Typ:** sukces
- **Status:** otwarty

## Opis
Suite jednostkowy zielony (479/479) z zamockowanym `StorageService` i
puppeteerem, a raport nazywa wprost, czego nie uruchomiono („nie zweryfikowane:
endpoint przeciwko realnemu GCS"). Użytkownik na tej podstawie prosi o test na
żywo, który znajduje dwie luki środowiska niewidoczne strukturalnie dla testów.

## Przyczyna źródłowa
Mock zastępuje dokładnie te składniki, które zależą od maszyny — binarkę
przeglądarki i plik poświadczeń — więc zielony suite dowodzi logiki kodu i
niczego o zależnościach runtime. Raport mówiący tylko „testy przechodzą" ukrywa
tę granicę; raport nazywający niewykonaną ścieżkę oddaje decyzję o jej
uruchomieniu użytkownikowi, bo ścieżka mutuje jego bazę i bucket.

## Dowody
- 2026-09-07, sesja session_01YYxVxgP1QYqdEoh63ozDfs: po „nie zweryfikowane"
  w raporcie użytkownik napisał „odapl enpoind". Przebieg na żywo: worker padł
  na `Could not find Chrome (ver. 148.0.7778.97)` (cache puppeteera miał
  115/116/121/149), po doinstalowaniu — na `invalid_grant (invalid_rapt)`
  z wygasłego ADC; po `gcloud auth application-default login` i restarcie
  API: PDF 50 619 B, `200 application/pdf`, anonimowy GET na obiekt `403`.
  Żadnej z tych trzech rzeczy 479 testów nie mogło pokazać, a dopiero ostatnia
  jest właściwą odpowiedzią na pytanie użytkownika „czy ADC wystarczy".

## Rozwiązanie
W sekcji „Weryfikacja" wymień z nazwy każdą zależność runtime, którą testy
mockują (przeglądarka, poświadczenia chmury, kolejka), jako „nie zweryfikowane".
Gdy sednem zmiany jest zasób zewnętrzny, zaproponuj przebieg na żywo z listą
mutacji, które wykona (wiersze w bazie, obiekty w buckecie), i uruchom go po
zgodzie; sprawdź też stronę negatywną (dostęp bez API musi odmówić).
