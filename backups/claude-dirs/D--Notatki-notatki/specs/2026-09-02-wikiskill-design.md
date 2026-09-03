# WikiSkill w codziennej pracy z Claude Code — projekt

Data: 2026-09-02
Źródło pomysłu: Tang i in., „WikiSkill: Compiling Agent Experience into
Persistent Knowledge for Skill Evolution", Google Research, arXiv 2608.27454
(plik: `nauka/tech/agenci-ai/wikiskill-google-research-2026.pdf`).

## 1. Cel

Skille Claude Code (16 sztuk w trzech miejscach, wszystkie pisane przez agenta)
nie mają śladu, dlaczego zawierają dane reguły, ani zapisu tego, co się działo,
gdy były używane. Jedyny zapis doświadczenia to dziennik sesji
`praca-z-claude.md`, którego nikt nie konsoliduje w wzorce i na którego
podstawie nikt nie poprawia skilli.

Trzy bóle, w kolejności priorytetu:

1. **Powtarzające się potknięcia** — ten sam błąd Claude'a wraca w kolejnych
   sesjach, bo nic go nie zapisuje i nie zamienia w regułę.
2. **Nieczytelne „dlaczego"** — reguły skilli bez zapisanego pochodzenia, więc
   trudno ocenić, czy nadal są potrzebne.
3. **Poprawki po omacku** — zmiana skilla bez historii prób i bez wiedzy, czy
   pomogła.

Odpowiedniki z artykułu: (1) strony wzorców w wiki z indeksem
„problem + przyczyna + fix" i krokiem Wiki Maintainer; (2) `PURPOSE.md` przy
skillu; (3) `skill-impact.md`, rejestr prób z wynikiem, oraz Skill Proposer
proponujący jedną atomową zmianę.

## 2. Decyzje podjęte w brainstormingu

| Pytanie | Decyzja |
|---|---|
| Gdzie żyje wiki | Per repo (`<repo>/.claude/wiki/`) dla skilli repo; `~/.claude/wiki/` dla skilli globalnych i wzorców zachowań niezależnych od repo |
| Skąd ślady i kiedy Maintainer | Z kontekstu sesji, jako nowy krok w `podsumuj-sesja-claude`; dowód = data + identyfikator sesji |
| Kiedy Proposer i kto bramkuje | Na żądanie (`/evolve-skill <skill>`); bramką jest użytkownik; podsumowanie sesji sygnalizuje wzorce porażek z dowodami z więcej niż dwóch różnych sesji albo z nawrotem |
| `PURPOSE.md` dla istniejących skilli | Od razu dla `tidy-journal`, `nauka-z-claude`, `podsumuj-sesja-claude`, `kurs-lekcja`; reszta leniwie przy pierwszym dotknięciu przez `evolve-skill` |
| Miejsce specu i planu | `.claude/specs/` i `.claude/plans/` vaulta (istniejąca konwencja) |
| Git | Nic nie commitujemy; zmiany zostają w drzewie roboczym |

## 3. Architektura: trzy warstwy

| Warstwa z artykułu | U nas | Własność |
|---|---|---|
| Raw (ślady wykonania) | Kontekst sesji w chwili podsumowania + identyfikator sesji jako odnośnik do transkryptu | Nic nie tworzymy; transkrypty trzyma Claude Code |
| Wiki (wiedza) | `wiki/` w każdym repo ze skillami i jedno globalne | Nigdy nie kasowane; dopisywane i poprawiane patchem |
| Skills (procedury) | Istniejące `SKILL.md` + `PURPOSE.md` obok | Zmieniane przez `evolve-skill` po akceptacji użytkownika (zwykła ręczna edycja pozostaje możliwa, ale nie jest tym mechanizmem) |

### 3.1 Lokalizacje wiki

- `D:\Notatki\notatki\.claude\wiki\` — skille vaulta: `start-day`, `tidy-journal`,
  `meeting`, `compile-notes`, `sync-project`.
- `D:\Praca\Devstock\Baza wiedzy\.claude\wiki\` — skille Bazy wiedzy:
  `baza-wiedzy`, `knowledge-base-update`, `kurs-lekcja`, `kurs-nowy`,
  `kurs-redakcja`, `kurs-video`, `kurs-zadania`, `spotkanie`.
- `C:\Users\rafal\.claude\wiki\` — skille globalne (`nauka-z-claude`,
  `podsumuj-sesja-claude`, `review-pracy-domowej`, `evolve-skill`) oraz
  wzorce ogólne.

Repo ma własne wiki wtedy i tylko wtedy, gdy ma katalog `.claude/skills/`.
Pliki wiki powstają przy pierwszym zapisie (szkielety zakładamy we wdrożeniu
dla vaulta i globalnie; dla Bazy wiedzy tylko za zgodą na zapis poza
katalogiem roboczym).

### 3.2 Reguła kierowania wzorca

1. Wzorzec dotyczy skilla z repo → wiki tego repo.
2. Wzorzec dotyczy skilla globalnego → wiki globalne.
3. Wzorzec dotyczy zachowania Claude'a niezależnego od skilla (np. ruszanie
   bez czekania na odpowiedź, zgadywanie zamiast sprawdzenia) → wiki globalne.
4. Wpis w `log.md` repo wymienia także wzorce globalne dotknięte w tej sesji,
   żeby log repo był kompletnym zapisem sesji.

## 4. Formaty plików

Wszystkie pliki po polsku, identyfikatory i nazwy plików w kebab-case po
angielsku. Nazwa wzorca = nazwa pliku bez rozszerzenia.

### 4.1 `wiki/index.md`

```markdown
# Wiki — indeks wzorców

Jedna linia na wzorzec: problem, przyczyna źródłowa i fix w jednym lub dwóch
zdaniach, tak żeby dało się ocenić trafność bez otwierania strony.

- [take-examine-move-loop](patterns/take-examine-move-loop.md) — skill: ogólny —
  PROBLEM. PRZYCZYNA. FIX. (otwarty, 2 dowody)
- [nazwa](patterns/nazwa.md) — skill: tidy-journal — … (zaadresowany (2026-09-10, tidy-journal), 4 dowody)
- [nazwa](patterns/nazwa.md) — skill: start-day — … (nawrót (2026-09-12), 5 dowodów)
```

Status w indeksie ma **tę samą postać, co na stronie wzorca**: `otwarty`,
`zaadresowany (YYYY-MM-DD, <skill>)` albo `nawrót (YYYY-MM-DD)`. Po nim liczba
dowodów. `evolve-skill` filtruje wzorce po tym polu, więc druga postać zapisu
oznacza pominięty wzorzec.

Indeks jest zawsze przepisywany w całości (jak w artykule: `update_index`
z pełną treścią), żeby nie rozjechał się ze stronami.

### 4.2 `wiki/patterns/<nazwa>.md`

```markdown
# <nazwa-wzorca>

- **Skill:** <nazwa skilla | ogólny>
- **Typ:** porażka | sukces
- **Status:** otwarty | zaadresowany (YYYY-MM-DD, <skill>) | nawrót (YYYY-MM-DD)

## Opis
<co się dzieje, 1–3 zdania>

## Przyczyna źródłowa
<dlaczego to się dzieje, nie co się dzieje>

## Dowody
- YYYY-MM-DD, sesja <identyfikator lub link>: <co konkretnie zaszło, z cytatem
  działania albo wypowiedzi użytkownika>

## Rozwiązanie
<konkretna reguła albo działanie, w brzmieniu gotowym do wklejenia do skilla>
```

Reguły: 10–30 linii; jeden wzorzec = jedna uogólnialna obserwacja; dowody się
dopisuje, pozostałe sekcje poprawia patchem (zamiana fragmentu, wstawienie po
fragmencie), nie przepisuje od zera; bez duplikatów, nowy dowód idzie do
istniejącej strony.

### 4.3 `wiki/log.md`

```markdown
# Wiki — log ewolucji

## YYYY-MM-DD — sesja <identyfikator>
- Założono: <wzorzec> (dowód: …)
- Dopisano dowód: <wzorzec>
- Nawrót: <wzorzec> po zmianie z YYYY-MM-DD
- Wzorce globalne dotknięte w tej sesji: <lista> (tylko w logu repo)
- Skill: <nazwa> — propozycja zaakceptowana | odrzucona (szczegóły w skill-impact.md)
- Sygnał: <wzorce z >2 dowodami bez zmiany skilla albo z nawrotem> | brak
```

Najnowszy wpis na końcu (chronologicznie), inaczej niż w dzienniku sesji, bo
log jest czytany od początku przez proposera, nie „rano przez człowieka".

### 4.4 `wiki/skill-impact.md`

```markdown
# Wiki — rejestr zmian skilli

## YYYY-MM-DD — <skill> — zaakceptowana | odrzucona
- **Wzorce:** <nazwy stron>
- **Zmiana:** <streszczenie w 1–3 zdaniach>
- **Powód decyzji:** <przy odrzuceniu: powód użytkownika; przy akceptacji można pominąć>
- **Nawrót:** YYYY-MM-DD, <wzorzec> (dopisuje Maintainer, gdy wzorzec wróci po zmianie)

<blok diff z pełnym diffem SKILL.md, także dla propozycji odrzuconych —
żeby proposer nie zaproponował tego samego drugi raz>
```

### 4.5 `PURPOSE.md` przy skillu

Plik `PURPOSE.md` w katalogu skilla, obok `SKILL.md`. Link do wzorca względny:
`../../wiki/patterns/<nazwa>.md` (działa tak samo w repo i globalnie).

```markdown
# PURPOSE — <skill>

## Pochodzenie
<po co skill powstał, kiedy, z jakiej potrzeby; źródła: commit, spec, wpis
dziennika; `?` przy każdym elemencie, którego nie da się ustalić ze źródeł>

## Adresowane wzorce
- [nazwa](../../wiki/patterns/nazwa.md) — <jedna linia>
(albo: brak — skill sprzed wiki)

## Historia ewolucji
- YYYY-MM-DD — <zmiana> — powód: <wzorzec | prośba użytkownika | nieustalony>
  — wynik: <zaakceptowana | odrzucona | wprowadzona ręcznie | nawrót YYYY-MM-DD>
  — źródło: <hash commita | ścieżka pliku>
```

Wpis ma cztery pola po dacie, w tej kolejności: zmiana, powód, wynik, źródło.
Pole `wynik` przyjmuje wartości „zaakceptowana" i „odrzucona" wyłącznie dla
zmian przepuszczonych przez `evolve-skill`; zmiany sprzed wiki i zmiany ręczne
dostają „wprowadzona ręcznie". Pole `źródło` jest obowiązkowe, bo bez niego
wpisu odtworzonego wstecz nie da się zweryfikować.

## 5. Proces 1: Wiki Maintainer jako krok w `podsumuj-sesja-claude`

Nowy krok po zapisaniu briefu (dzisiejszy Krok 4). Treść kroku w `SKILL.md`
skilla `podsumuj-sesja-claude`:

1. **Ustal wiki.** Repo: `<katalog roboczy>/.claude/wiki/`, jeśli istnieje
   `<katalog roboczy>/.claude/skills/`. Globalne: `~/.claude/wiki/`, zawsze.
   Brakujące pliki wiki załóż z nagłówków z sekcji 4.
2. **Ustal identyfikator sesji.** Z kontekstu systemowego sesji (link
   `claude.ai/code/session_…`), a gdy go nie ma, sama data z adnotacją „id
   niedostępny".
3. **Przeanalizuj sesję pod kątem skilli.** Dla każdego skilla użytego albo
   takiego, który powinien był zostać użyty: czy uruchomił się w porę; gdzie
   Claude odszedł od instrukcji; gdzie użytkownik poprawił, przerwał albo
   powtórzył prośbę; co zadziałało bez tarcia. Osobno: zachowania ogólne,
   niezależne od skilla. Kryteria z artykułu: przyczyna źródłowa, nie objaw;
   wzorzec tylko dla obserwacji, która może się powtórzyć; sukcesy też są
   wzorcami (żeby zmiana skilla ich nie zepsuła).
4. **Dopasuj do istniejących wzorców.** Przeczytaj `index.md` obu wiki.
   Obserwacja pasująca do istniejącego wzorca → nowy dowód na jego stronie;
   nowa → nowa strona. Bez duplikatów.
5. **Nawrót.** Jeśli wzorzec ma status „zaadresowany (data, skill)" i nowy dowód
   ma datę po tej zmianie → status „nawrót (data)", wzmianka „Nawrót" we
   właściwym wpisie `skill-impact.md`.
6. **Podgląd i bramka.** Pokaż użytkownikowi listę: „załóż X (skill, typ,
   jedno zdanie)", „dopisz dowód do Y (jedno zdanie)", „nawrót Z". Zapis
   dopiero po jego zgodzie. Brak odpowiedzi nie jest zgodą.
7. **Zapis.** Strony wzorców (nowe w całości, istniejące patchem), pełny
   `index.md`, wpis w `log.md` (repo i globalny, każdy o swoich wzorcach; log
   repo dodatkowo wymienia dotknięte wzorce globalne), ewentualne wzmianki
   „Nawrót" w `skill-impact.md`.
8. **Sygnał.** Jedno zdanie na koniec podsumowania: lista wzorców typu
   „porażka" o statusie „otwarty" z dowodami z więcej niż dwóch różnych sesji
   oraz wszystkich o statusie „nawrót", każdy z sugestią
   `/evolve-skill <skill>`. Wzorce sukcesów nie generują sygnału. Gdy takich
   nie ma, zdanie „brak wzorców do ewolucji". Decyzja o uruchomieniu należy do
   użytkownika; skill jej nie podejmuje.

Sesja bez obserwacji wartych wzorca kończy krok wpisem w `log.md` „bez nowych
wzorców" — log ma być kompletny.

## 6. Proces 2: skill globalny `evolve-skill`

Lokalizacja: `~/.claude/skills/evolve-skill/SKILL.md` (+ `PURPOSE.md`
założony od razu, bo pochodzenie jest znane: ten spec). Wywołanie:
`/evolve-skill <nazwa-skilla>`. Tworzony skillem `superpowers:writing-skills`.

1. **Znajdź skill.** Najpierw `<katalog roboczy>/.claude/skills/<nazwa>/`,
   potem `~/.claude/skills/<nazwa>/`. Brak → powiedz i zakończ. Skill z repo
   → wiki repo; skill globalny → wiki globalne. Wiki globalne czytaj zawsze,
   bo wzorce ogólne mogą wymagać reguły w konkretnym skillu.
2. **Czytaj w kolejności:** `index.md`, `skill-impact.md` (odrzucone
   propozycje są zakazane do powtórzenia w tej samej postaci), strony wzorców
   dotyczących skilla oraz wzorce ogólne, `SKILL.md`, `PURPOSE.md` jeśli
   istnieje.
3. **Zaproponuj dokładnie jedną atomową zmianę** w tym jednym skillu:
   - diff `SKILL.md` w bloku diff (patch, nie przepisanie; jeśli trzeba
     zmienić większość pliku, powiedz to i zatrzymaj się, bo to zadanie dla
     `writing-skills`, nie dla ewolucji);
   - które wzorce adresuje i jak (cytat „Rozwiązania" ze strony wzorca);
   - co było próbowane wcześniej według `skill-impact.md` i dlaczego ta
     propozycja jest inna;
   - jeśli wiki nie uzasadnia zmiany (za mało dowodów, wzorce już
     zaadresowane bez nawrotu), powiedz to i nic nie proponuj.
   Nowych skilli ten proces nie tworzy; gdy wzorzec wymaga nowego skilla,
   proposer mówi to wprost i odsyła do `writing-skills`.
4. **Bramka.** Użytkownik akceptuje, odrzuca albo modyfikuje. Bez odpowiedzi
   nic się nie dzieje. Timeout narzędzia do pytań nie jest zgodą.
5. **Po akceptacji:** zastosuj diff do `SKILL.md`; załóż `PURPOSE.md` (przy
   pierwszym dotknięciu: sekcja Pochodzenie odtworzona z gita, speców
   i dziennika, `?` gdzie nieustalone) albo dopisz wpis do Historii ewolucji;
   dopisz wpis do `skill-impact.md` z pełnym diffem; ustaw status wzorców na
   „zaadresowany (data, skill)" i przepisz `index.md`; dopisz wpis do `log.md`.
   Jeśli zmiana zmienia opis skilla z vaulta widoczny dla użytkownika,
   zaktualizuj wiersz w tabeli skilli `README.md` vaulta.
6. **Po odrzuceniu:** wpis w `skill-impact.md` z pełnym diffem propozycji
   i powodem użytkownika; wzorce bez zmiany statusu; wpis w `log.md`.
7. **Bez commitów.** Zmiany zostają w drzewie roboczym.

## 7. Uzupełnienie `PURPOSE.md` dla czterech skilli

| Skill | Miejsce | Źródła pochodzenia |
|---|---|---|
| `tidy-journal` | vault | commity `6a7e7b9` (second brain setup), `1cd67cd` (weryfikacja wiedzy, ziarno…); specy `.claude/specs/2026-07-09-optymalizacja-codziennej-pracy-design.md`, `2026-08-15-powtorki-z-notatek-design.md`; plany w `.claude/plans/`; wpisy `praca-z-claude.md` |
| `nauka-z-claude` | globalny | spec `2026-08-15-powtorki-z-notatek-design.md`, README vaulta (opis trzech trybów), wpisy `praca-z-claude.md`; katalog `~/.claude/skills/` nie jest w gicie |
| `podsumuj-sesja-claude` | globalny | sekcja „Podsumowania sesji" w `~/.claude/CLAUDE.md` (nadpisanie Kroku 1), wpisy `praca-z-claude.md` |
| `kurs-lekcja` | Baza wiedzy Devstock | git log tego repo, `docs/superpowers/specs/` i `.superpowers/sdd/` tamże |

Zasada: żadnego zmyślania. Element bez źródła dostaje `?`. Sekcja
„Adresowane wzorce" startuje jako „brak — skill sprzed wiki". Historia
ewolucji zawiera tylko zmiany potwierdzone źródłem (commit, spec, wpis
dziennika) z datą.

## 8. Zmiany w dokumentacji

- `README.md` vaulta: wiersz `evolve-skill` w tabeli skilli (z zaznaczeniem,
  że to skill globalny); w opisie `.claude/` wzmianka o `wiki/` (wzorce, log,
  rejestr zmian skilli) i o `PURPOSE.md` przy skillach.
- `.claude/CLAUDE.md` vaulta: w „Strukturze vaulta" jedna linia o `.claude/`
  (konfiguracja, skille, `wiki/` mechanizmu ewolucji skilli, specy i plany).
- `~/.claude/CLAUDE.md`: bez zmian (sekcja o podsumowaniach sesji pozostaje
  aktualna; nowy krok jest w skillu).

## 9. Poza zakresem

- Automatyczna walidacja zmian skilli na zbiorze zadań (bramką jest
  użytkownik; miarą skuteczności jest nawrót wzorca w kolejnych sesjach).
- Parsowanie transkryptów `.jsonl` z `~/.claude/projects/`.
- Automatyczne uruchamianie proposera (progowe albo na koniec każdej sesji).
- Przycinanie wiki (artykuł też tego nie ma; wrócić, gdy indeks przekroczy
  ok. 40 wzorców).
- Wersjonowanie `~/.claude/` w gicie (wiki globalne i skille globalne są
  dziś niewersjonowane; to osobna decyzja).
- Tworzenie nowych skilli przez `evolve-skill`.

## 10. Weryfikacja

1. **Pierwszy bieg Maintainera:** `/podsumuj-sesja-claude` na koniec sesji
   z 2026-09-02. Oczekiwane: co najmniej jeden wzorzec z przyczyną źródłową
   (kandydaci: nauka przerwana na pierwszym pytaniu sprawdzającym; PDF
   nieczytelny wbudowanym narzędziem `Read`, obejście przez `pdftotext`;
   zmiana trybu skilla na życzenie użytkownika), podgląd przed zapisem,
   poprawny `index.md` i wpis w `log.md`, sygnał „brak wzorców do ewolucji"
   (za mało sesji).
2. **Pierwszy bieg proposera:** `/evolve-skill podsumuj-sesja-claude` na
   powstałym wiki. Oczekiwane: albo jedna atomowa propozycja z diffem
   i powiązaniem do wzorców, albo uczciwe „dowodów za mało".
3. **Scenariusze presji dla `evolve-skill`** (metoda `writing-skills`,
   subagent bez skilla kontra ze skillem): (a) wiki zawiera odrzuconą
   propozycję o tej samej treści, co narzucająca się zmiana; (b) użytkownik
   nie odpowiada na bramkę; (c) wzorzec sugeruje przepisanie całego skilla.
   Skill ma: nie powtórzyć odrzuconej propozycji, nie zapisać niczego bez
   decyzji, odesłać do `writing-skills` zamiast przepisywać.
4. **Scenariusz dla Maintainera:** sesja bez obserwacji wartych wzorca →
   wpis „bez nowych wzorców" w `log.md`, brak pustych stron.
5. **`PURPOSE.md`:** każdy z czterech plików ma trzy sekcje, każde zdanie
   w „Pochodzeniu" ma źródło albo `?`.

## 11. Ryzyka i otwarte kwestie

- **Zapis w Bazie wiedzy Devstocku** wymaga zgody na pisanie poza katalogiem
  roboczym tej sesji; przy odmowie szkielet wiki i `PURPOSE.md` dla
  `kurs-lekcja` zostają jako gotowa treść do osobnej sesji w tamtym repo.
- **Identyfikator sesji** bywa niedostępny w kontekście; wtedy dowód ma samą
  datę. Transkrypt da się i tak odnaleźć po dacie w `~/.claude/projects/`.
- **Sesje bez podsumowania** nie zasilają wiki (świadoma decyzja z sekcji 2).
- **Wiki globalne poza gitem:** utrata `~/.claude/` kasuje wzorce ogólne.
  Do rozważenia osobno.
