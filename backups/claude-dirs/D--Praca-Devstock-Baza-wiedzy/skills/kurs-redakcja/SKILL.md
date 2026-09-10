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
   istnieje żaden — przerwij i skieruj na `/kurs-lekcja`. Zanotuj
   `status.video` z `lekcja.yaml` (potrzebny w krokach 3 i 6). Jeśli w zestawie
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
     B dodatkowo: pozycje dopisane do `wymowa.md` (pisownia → zapis mówiony).
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
   - scenariusz: liczba, kolejność i typy segmentów `## [ekran: ...]` bez
     zmian, frontmatter `typ:` bez zmian, avatar ≤ 3. Objętości NIE
     egzekwujesz — widełki 140–420 słów są sugestią; segment krótszy po
     redakcji o więcej niż ~15% sprawdź, czy nie zgubił treści,
   - nazwy w scenariuszu: w tekście lektora żadna nazwa własna nie została bez
     cudzysłowu ani w pisowni sprzecznej z `wymowa.md`; każdy nowy zapis
     fonetyczny trafił na listę; linie `[AKCJA: ...]`, tytuły segmentów
     i `prezentacja.yaml` mają nazwy w oryginalnej pisowni,
   - scenariusz po akceptacji jest źródłem prawdy (redakcja.md → Scenariusz
     jest źródłem prawdy): żaden wątek nie może z niego zniknąć, także taki,
     którego nie ma w artykule — to błąd artykułu, nie scenariusza,
   - prezentacja.yaml: liczba i kolejność slajdów, `id` i `uklad` bez zmian,
     zero HTML w treści,
   - artykuł: callouty 🎬 na miejscach, ≥1 blok bez calloutu; każdy obrazek ma
     pod sobą podpis `**Ilustracja <NR>.** …`, numeracja ciągła bez dziur
     i bez duplikatów; objętość orientacyjnie 1200–2000 słów, ale bez cięcia
     treści dla widełek,
   - quiz/ćwiczenia: JSON się parsuje, pola bez zmian, poprawne odpowiedzi
     te same,
   - merytoryka: diff nie dodaje ani nie gubi faktów, liczb, cen, nazw.
   Naruszenia napraw od ręki.
6. **Status video i walidacja.** Jeśli dotyczy (krok 3), ustaw
   `status.video: brak` w `lekcja.yaml`; statusów `tresc`/`zadania` nie
   ruszaj. Potem `cd tools/course-pipeline && npm run validate --
   ../../kursy/<slug>/<modul>/<lekcja>` (katalog lekcji, nie kursu — błędy
   z innych lekcji nie wchodzą do tej bramki) — napraw wszystkie BŁĘDY.
7. **BRAMKA: raport dla Rafała.** Pokaż: per plik 3–5 charakterystycznych
   zmian "przed → po", łączną skalę zmian, listę wątpliwości merytorycznych
   od agentów, pozycje dopisane do `wymowa.md` (jeśli redagowałeś scenariusz),
   zmiany statusów (w tym `video → brak`, jeśli zaszło),
   przypomnienie, że pełny diff czeka w drzewie roboczym. Uwagi Rafała nanoś
   od ręki (w głównej sesji, bez ponownego Workflow) i iteruj.
8. **Po zatwierdzeniu przez Rafała:** jeśli nanosiłeś poprawki po uwagach,
   uruchom walidację ponownie. `video` zostaje `brak` do decyzji
   o re-renderze. Zmiany zostają niezacommitowane — commit robi Rafał.
   Jeśli Rafał przerwie bramkę bez decyzji, powiedz wprost w podsumowaniu,
   że pliki w drzewie są po redakcji, ale bez akceptacji.
   Jeśli lekcja ma `typ_video: demo`, a redakcja objęła grupę B
   (`video/scenariusz.md`), przegeneruj plan nagrania:
   `npm run plan-nagrania -- <lekcja>`. Bez tego `npm run validate` zgłosi
   ostrzeżenie o nieaktualnym `video/plan-nagrania.md`.

## Zasady

- Redakcja to nie regeneracja: merytoryka, fakty, struktura plików i pokrycie
  treści zostają identyczne. Wątpliwość merytoryczna → fragment bez zmian
  + wpis w raporcie.
- NIE renderuj video, NIE generuj nowych treści ani zadań — to
  `/kurs-video`, `/kurs-lekcja`, `/kurs-zadania`.
- Najtaniej redagować PRZED `/kurs-video` — redakcja scenariusza lub slajdów
  po renderze dezaktualizuje `final.mp4`.
- Rafał każe powtórzyć redakcję innym modelem/effortem → wróć do kroku 4
  z nowymi parametrami.
