---
name: kurs-redakcja
description: Redakcja istniejących treści lekcji kursu (artykuł, scenariusz, teksty slajdów, quiz, ćwiczenia) pod maksymalną zrozumiałość i naturalny, ludzki styl. Używaj, gdy Rafał chce zredagować wygenerowane treści lekcji - "zredaguj lekcję", "przejdź redakcją", "brzmi jak AI", "odczłowiecz tekst".
---

# /kurs-redakcja — redakcja treści lekcji

Wejście: ścieżka lekcji, np. `kursy/<slug>/modul-01-x/lekcja-02-y`.
Wynik: zredagowane in-place pliki lekcji + raport zmian "przed → po",
przedstawione Rafałowi do bramki review. Redakcję wykonują subagenci
z modelem i effortem wybranym przez Rafała na starcie.

## Procedura

1. **Bramka wejścia i inwentaryzacja.** `lekcja.yaml` musi istnieć — inaczej
   przerwij i skieruj na `/kurs-nowy`. Ustal, które z plików istnieją:
   `artykul.md`, `video/scenariusz.md`, `video/prezentacja.yaml`, `quiz.json`,
   `cwiczenia/*.json`. Redagujesz wyłącznie istniejące pliki — nic nie
   generujesz od zera (od tego są `/kurs-lekcja` i `/kurs-zadania`). Jeśli nie
   istnieje żaden — przerwij i skieruj na `/kurs-lekcja`. Osobno wypisz pliki
   ZALEŻNE, których redakcja nie dotyka, ale które powtarzają tę samą treść
   i muszą za nią nadążyć (krok 6): `video/konspekt-nagrania.md`
   i `video/dane-do-nagrania.md` przy `typ_video: demo`. Zanotuj
   `status.video` i `typ_video` z `lekcja.yaml` (potrzebne w krokach 3, 6, 7 i 9). Jeśli w zestawie
   jest `video/scenariusz.md`, ustal listę wymowy kursu `kursy/<slug>/wymowa.md`
   — gdy pliku nie ma, utwórz go z `kursy/_wspolne/szablony/wymowa.md`
   (podmień `<nazwa kursu>`, przykładowy wiersz zostaw do czasu pierwszego
   realnego wpisu).
2. **Wybór modelu i effortu.** Zapytaj Rafała (AskUserQuestion, oba pytania
   w jednym wywołaniu): model — `fable` / `opus` / `sonnet`; effort — `max` /
   `xhigh` / `high` / `medium` (niższy przez "Other"). Czekaj na odpowiedź;
   timeout ani podpowiedź "proceed" to NIE zgoda — ponów pytanie.
3. **Plan i ostrzeżenia.** Pokaż listę plików do redakcji i konsekwencje:
   - statusów `tresc`/`zadania` skill NIE zmienia — bramka redakcyjna
     następuje bezpośrednio po redakcji i pełni rolę re-zatwierdzenia
     (walidator wymaga `tresc: zatwierdzona` przy zadaniach w review, więc
     cofka obu statusów naraz wywala walidację); uprzedź tylko wprost, że
     redagujesz treść w statusie zatwierdzonym,
   - `video: wyrenderowane|zaakceptowane` → `brak`, jeśli redagujesz scenariusz
     lub slajdy — render się dezaktualizuje, a ponowny `/kurs-video` to koszt
     TTS i HeyGen (dla lekcji demo, tor B: także ręczny montaż Rafała
     w edytorze). Powiedz to wprost.
   Czekaj na potwierdzenie Rafała przed startem redakcji.
4. **Redakcja (Workflow, równolegle).** Zbuduj grupy z istniejących plików
   (grupę bez plików pomiń):
   - **A** — `artykul.md`,
   - **B** — `video/scenariusz.md` + `video/prezentacja.yaml` (razem: slajd
     mówi hasłami to, co scenariusz mową; frazowanie ma zostać spójne),
   - **C** — `quiz.json` + `cwiczenia/*.json`.
   Prompt każdego agenta MUSI zawierać:
   - bezwzględne ścieżki plików do redakcji i polecenie edycji in-place,
   - polecenie przeczytania W CAŁOŚCI `kursy/_wspolne/redakcja.md`
     i `kursy/_wspolne/styleguide.md`, a ponadto: A i B —
     `kursy/_wspolne/szablony/struktura-lekcji.md`, B —
     `kursy/_wspolne/szablony/scenariusz.md`, C —
     `kursy/_wspolne/szablony/struktura-zadania.md`,
   - cel lekcji i `typ_video` z `lekcja.yaml`,
   - zakres: pełna redakcja językowa (wolno przepisywać zdania i akapity,
     łączyć, dzielić, przestawiać w obrębie sekcji); sekcja "Nietykalne"
     z `redakcja.md` obowiązuje bezwzględnie,
   - dla A: podpisy ilustracji w formacie `**Ilustracja <NR>.** <podpis>` —
     osobna linia pod obrazkiem, oddzielona od niego pustą linią, numeracja
     ciągła od 1 w obrębie artykułu, podpis pełnym zdaniem zakończonym kropką
     (np. `**Ilustracja 1.** Węzeł Edit Fields z trzema polami i panelami
     INPUT / OUTPUT.`). Obrazek bez podpisu — dopisz podpis z treści obrazka
     i kontekstu akapitu; podpis w innym formacie — sprowadź do tego formatu
     i przenumeruj od nowa. Obrazków nie dodajesz, nie usuwasz i nie
     przestawiasz,
   - dla A, gdy w zestawie jest `video/scenariusz.md`: jego bezwzględną ścieżkę
     z poleceniem przeczytania W CAŁOŚCI i doprowadzenia artykułu do zgodności
     ze scenariuszem. Scenariusz jest źródłem prawdy (redakcja.md → Scenariusz
     jest źródłem prawdy), więc rozjazd naprawia się PO STRONIE ARTYKUŁU:
     brakujący wątek dopisujesz, nazwę pola interfejsu, treść pytania testowego
     i opis zachowania aplikacji poprawiasz na tę ze scenariusza. Rozjazd,
     którego naprawa wywraca tezę całej sekcji, też naprawiasz — przepisujesz
     sekcję za scenariuszem i oznaczasz ją w raporcie osobno. Scenariusza
     agent A nie edytuje,
   - dla B: bezwzględną ścieżkę do `kursy/<slug>/wymowa.md` z poleceniem
     przeczytania jej W CAŁOŚCI, stosowania zapisów stamtąd i DOPISANIA do niej
     każdej nowej decyzji fonetycznej — obowiązuje sekcja "Nazwy w scenariuszu"
     z `redakcja.md`: w tekście lektora każda nazwa własna w cudzysłowie, nazwy
     trudne dla TTS zapisane fonetycznie, a linie `[AKCJA: ...]`, tytuły
     segmentów i `prezentacja.yaml` zachowują oryginalną pisownię nazw,
   - dla C: merytorycznym źródłem prawdy jest `artykul.md`; nie zmieniaj,
     które odpowiedzi są poprawne, ani pól technicznych JSON,
   - format odpowiedzi: per plik 3–5 najważniejszych zmian "przed → po"
     z jednym zdaniem uzasadnienia, łączna liczba zmienionych miejsc,
     osobno lista wątpliwości merytorycznych (fragmenty zostawione bez zmian);
     A dodatkowo: rozjazdy wobec scenariusza (co mówił artykuł → co mówi
     scenariusz → jak brzmi po naprawie), z osobnym oznaczeniem tych, przy
     których trzeba było przepisać tezę sekcji; B dodatkowo: pozycje dopisane
     do `wymowa.md` (pisownia → zapis mówiony).
   Uruchom przez Workflow (jedyny mechanizm z nadpisaniem modelu i effortu
   per agent):

   ```js
   export const meta = {
     name: 'kurs-redakcja',
     description: 'Redakcja tresci lekcji przez subagentow',
     phases: [{ title: 'Redakcja' }],
   }
   // args = { model, effort, grupy: [{ label, prompt }] }
   const wyniki = await parallel(args.grupy.map(g => () =>
     agent(g.prompt, { label: g.label, phase: 'Redakcja',
                       model: args.model, effort: args.effort })))
   return wyniki
   ```

5. **Kontrola strukturalna.** Przejrzyj `git diff` i sprawdź sam:
   - scenariusz: liczba, kolejność, typy i numery segmentów
     `## [ekran: ...] Segment N - Tytuł` bez zmian, frontmatter `typ:` bez zmian, avatar ≤ 3. Objętości NIE
     egzekwujesz — widełki 140–420 słów są sugestią; segment krótszy po
     redakcji o więcej niż ~15% sprawdź, czy nie zgubił treści,
   - nazwy w scenariuszu: w tekście lektora żadna nazwa własna nie została bez
     cudzysłowu ani w pisowni sprzecznej z `wymowa.md`; każdy nowy zapis
     fonetyczny trafił na listę; linie `[AKCJA: ...]`, tytuły segmentów
     i `prezentacja.yaml` mają nazwy w oryginalnej pisowni,
   - scenariusz po akceptacji jest źródłem prawdy (redakcja.md → Scenariusz
     jest źródłem prawdy): żaden wątek nie może z niego zniknąć, także taki,
     którego nie ma w artykule — to błąd artykułu, nie scenariusza,
   - rozjazdy: przejdź scenariusz segment po segmencie i sprawdź, czy artykuł
     zgadza się z nim co do nazw pól interfejsu, treści pytań testowych, opisu
     zachowania aplikacji i pokrycia wątków. Rozjazdy, których agent A nie
     naprawił, napraw sam w artykule — łącznie z tymi, które wymagają
     przepisania tezy sekcji; do bramki nie wraca żaden nienaprawiony rozjazd.
     Po przepisaniu sekcji sprawdź, czy reszta artykułu nie odwołuje się
     jeszcze do starej tezy. Potem sprawdź, czy poprawki
     w artykule nie rozjechały quizu i ćwiczeń — grupa C czytała artykuł
     sprzed naprawy. Literały wpisywane na ekranie, które przy tej okazji
     zmieniłeś, idą dalej: krok 6,
   - prezentacja.yaml: liczba i kolejność slajdów, `id` i `uklad` bez zmian,
     zero HTML w treści,
   - artykuł: callouty 🎬 na miejscach, ≥1 blok bez calloutu; każdy obrazek ma
     pod sobą podpis `**Ilustracja <NR>.** …`, numeracja ciągła bez dziur
     i bez duplikatów; objętość orientacyjnie 1200–2000 słów, ale bez cięcia
     treści dla widełek,
   - quiz/ćwiczenia: JSON się parsuje, pola bez zmian, poprawne odpowiedzi
     te same,
   - merytoryka: diff nie dodaje ani nie gubi faktów, liczb, cen, nazw.
   **Kontrole z tej listy rób odczytem pliku, nie `grep`-em po frazie z treści.**
   Po redakcji `w wideo`, `z inwestycji` i `U Ciebie` mają w środku U+00A0,
   a emoji jako pattern w Git Bash nie trafia — oba przypadki dają ciche "0",
   nie błąd. Kotwicz na fragmencie bez jednoliterowego słowa (`wideo**`,
   `Ciebie (`, `^> `). Odwrotna pułapka jest równie cicha: `grep -i` po krótkim
   akronimie (`API`) trafia w podciągi polskich słów („napisze", „zapisz") —
   kotwicz na granicy słowa (`\bAPI\b`) albo czytaj trafienia z kontekstem.
   "0 trafień" i "kilkanaście trafień" na pliku, który właśnie przeczytałeś, to
   wynik wzorca, a nie fakt — tak samo odbite `old_string` w `Edit` i licznik
   z własnego skryptu kontrolnego. Reguła obowiązuje też `grep`-y z kroku 6.
   Naruszenia napraw od ręki.
6. **Propagacja na pliki zależne.** Lekcja mówi to samo w kilku plikach,
   a redakcja rusza tylko część z nich. Zmiana, która wylądowała wyłącznie
   w zredagowanym pliku, jest rozjazdem — wychodzi przy nagraniu, po bramce
   treści, kiedy Rafał już klika. Przejdź `git diff` zredagowanych plików
   i dla każdej zmiany dotykającej treści widocznej poza tym plikiem
   doprowadź odpowiedniki do zgodności:

   | co się zmieniło | gdzie to samo jeszcze żyje |
   |---|---|
   | literał wpisywany albo wklejany na ekranie: pytanie do czatu, nazwa węzła / credentiala / arkusza / pola, wartość pola | `artykul.md`, `video/konspekt-nagrania.md` (numerowany krok), `video/dane-do-nagrania.md` (tabela "Do wklejenia i wpisania na ekranie" i bloki pod nią) |
   | linia `[AKCJA: ...]`: co jest klikane, otwierane, pokazywane i w jakiej kolejności | `video/konspekt-nagrania.md`, a w `artykul.md` tam, gdzie artykuł prowadzi to samo kliknięcie |
   | twierdzenie o interfejsie: pole niewidoczne w danym trybie, ostrzeżenie, którego nie ma, nazwa sekcji albo zakładki | `artykul.md`, `video/konspekt-nagrania.md` |
   | wynik albo puenta beatu demo | `artykul.md` (odpowiadająca sekcja `### Krok N`) |
   | brzmienie narracji bez odpowiednika na ekranie i w artykule | nic — koniec |

   Cztery reguły samej propagacji:
   - **Jeden kierunek.** Źródłem prawdy jest `video/scenariusz.md` (redakcja.md
     → "Scenariusz jest źródłem prawdy"), bo to jego Rafał weryfikuje klikając
     w produkcie. Pozostałe pliki idą za nim, nigdy odwrotnie.
   - **Pisownię tłumaczysz, nie kopiujesz.** Narracja niesie nazwy
     w cudzysłowie i fonetycznie (`"Get Meni"`, `"en osiem en"`,
     `"Google Szits"`); artykuł, konspekt, dane do nagrania i
     `prezentacja.yaml` mają oryginalną pisownię (`Get Many`, `n8n`,
     `Google Sheets`). Przenosisz znaczenie, nie string.
   - **Szukasz, nie zakładasz.** Dla każdego zmienionego literału zrób `grep`
     po STARYM brzmieniu we wszystkich plikach zależnych i popraw każde
     trafienie. Te pliki mają twarde spacje po jednoliterowych słowach, więc
     wzorzec z ` i `, ` w `, ` z ` zwróci zero na tekście, który tam na
     pewno jest — kotwicz się na fragmencie bez nich albo dopuszczaj oba znaki
     spacji. Liczniki `grep` cytujesz w raporcie; "sprawdziłem" bez liczby
     nie jest kontrolą.
   - **Chirurgicznie także tam.** W pliku zależnym zmieniasz wyłącznie to,
     czego wymaga propagacja. Jeśli odpowiednika nie da się naprawić bez
     przepisania całej sekcji — przepisujesz, ale w raporcie idzie to osobną
     linią, oznaczone jako przepisanie.

   `video/plan-nagrania.md` jest generowany, nie edytowany ręcznie —
   odświeża się w kroku 7.
7. **Status video, plan nagrania i walidacja.** Jeśli dotyczy (krok 3), ustaw
   `status.video: brak` w `lekcja.yaml`; statusów `tresc`/`zadania` nie
   ruszaj.
   Potem, gdy lekcja ma `typ_video: demo` przy `status.tresc: zatwierdzona`,
   a redakcja albo propagacja ruszyła `video/scenariusz.md`,
   `video/konspekt-nagrania.md` lub `video/dane-do-nagrania.md` (plan kopiuje
   z niej kolumnę „Do wpisania" i bloki) — przegeneruj plan nagrania:
   `npm run plan-nagrania -- ../../kursy/<slug>/<modul>/<lekcja>`. Robisz to
   PRZED walidacją, bo inaczej bramka zobaczy ostrzeżenie o nieaktualnym
   `video/plan-nagrania.md`. Przeczytaj ostrzeżenia generatora i porównaj je
   z przebiegiem sprzed redakcji: krok, który dopiero teraz paruje się
   "po kolejności", to rozjazd nazewnictwa, który sam wprowadziłeś. Przy
   `szkic` albo `do_review` planu nie generujesz — `generateRecordingPlan`
   odmawia treści niezatwierdzonej; napisz w raporcie, że plan odświeży się
   przy zatwierdzeniu.
   Na koniec `cd tools/course-pipeline && npm run validate --
   ../../kursy/<slug>/<modul>/<lekcja>` (katalog lekcji, nie kursu — błędy
   z innych lekcji nie wchodzą do tej bramki) — napraw wszystkie BŁĘDY.
8. **BRAMKA: raport dla Rafała.** Pokaż: per plik 3–5 charakterystycznych
   zmian "przed → po", łączną skalę zmian, listę naprawionych rozjazdów
   artykuł vs scenariusz (osobno oznaczone te, przy których przepisałeś tezę
   sekcji — te Rafał czyta w pierwszej kolejności),
   tabelę propagacji na pliki zależne (co się zmieniło → jakie pliki
   zaktualizowane → `plik:linia`) wraz z licznikami `grep` z kroku 6,
   listę wątpliwości merytorycznych od agentów, pozycje dopisane
   do `wymowa.md` (jeśli redagowałeś scenariusz),
   zmiany statusów (w tym `video → brak`, jeśli zaszło),
   przypomnienie, że pełny diff czeka w drzewie roboczym. Uwagi Rafała nanoś
   od ręki (w głównej sesji, bez ponownego Workflow) i iteruj. Rafał może też
   wpisać je wprost do `video/scenariusz.md` jako linie `[UWAGA: ...]` — wtedy
   nanosi je `/kurs-uwagi`, a nie ta procedura.
9. **Po zatwierdzeniu przez Rafała:** jeśli nanosiłeś poprawki po uwagach,
   uruchom walidację ponownie. `video` zostaje `brak` do decyzji
   o re-renderze. Zmiany zostają niezacommitowane — commit robi Rafał.
   Jeśli Rafał przerwie bramkę bez decyzji, powiedz wprost w podsumowaniu,
   że pliki w drzewie są po redakcji, ale bez akceptacji.
   Jeśli poprawki po uwagach ruszyły `video/scenariusz.md` albo
   `video/konspekt-nagrania.md`, przegeneruj plan nagrania jeszcze raz
   (warunki i komenda — krok 7) i dopiero potem uruchom walidację.

## Zasady

- Redakcja to nie regeneracja: merytoryka, fakty, struktura plików i pokrycie
  treści zostają identyczne. Wątpliwość merytoryczna → fragment bez zmian
  + wpis w raporcie.
- Jedyny wyjątek od zdania wyżej: rozjazd artykuł vs scenariusz. Naprawiasz
  KAŻDY, po stronie artykułu, w tej redakcji — także taki, który wymaga
  przepisania tezy całej sekcji. Artykuł ma wyjść z redakcji zgodny ze
  scenariuszem; `/kurs-lekcja` nie jest miejscem na rozjazdy.
- **Redakcja naniesiona tylko w zredagowanym pliku jest naniesiona w połowie.**
  Lekcja to jeden dokument rozbity na kilka plików; to, co widz zobaczy na
  ekranie, musi brzmieć tak samo w każdym z nich. Ani `npm run validate`, ani
  `npm run plan-nagrania` tego nie złapią — walidator nigdy nie porównuje
  plików między sobą, a plan paruje kroki po podobieństwie całego kroku, więc
  para różniąca się jednym słowem paruje się czysto i nie ostrzega o niczym.
- NIE renderuj video, NIE generuj nowych treści ani zadań — to
  `/kurs-video`, `/kurs-lekcja`, `/kurs-zadania`.
- Najtaniej redagować PRZED `/kurs-video` — redakcja scenariusza lub slajdów
  po renderze dezaktualizuje `final.mp4`.
- Rafał każe powtórzyć redakcję innym modelem/effortem → wróć do kroku 4
  z nowymi parametrami.
