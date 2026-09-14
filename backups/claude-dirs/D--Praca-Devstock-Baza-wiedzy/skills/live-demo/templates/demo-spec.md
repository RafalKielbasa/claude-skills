# Demo live <DD.MM.YYYY>: "<TYTUŁ>" - projekt przykładu dydaktycznego (spec)

Data: <YYYY-MM-DD>
Autor: Rafał (z pomocą Claude)
Status: **propozycja do odbicia z zespołem.**

<!--
Nagłówek to metadane. Dopisz, na jakie pytania ten spec odpowiada (zwykle:
czy zakres dema jest wykonalny, ile kroków realnie wchodzi, jakie systemy
stoją za którymi krokami, jaki jest kształt wariantu zapasowego) i skąd te
pytania przyszły — najczęściej z sekcji koncepcji, którą marketing świadomie
oddał do rozstrzygnięcia tutaj (wzór: `2026-09-13-demo-live-2026-09-21-design.md`,
wiersz 5-8).
-->

Dokumenty nadrzędne: koncepcja (`documents.concept` z `live.yaml`), decyzje
zespołu, ściąga prowadzącego jeśli już istnieje, raport z poprzedniego live'a
(sekcje o tym, co poszło nie tak w demie). Pliki dema:
`live-events/<data>-<slug>/` (seed, prompty, workflows).

<!--
Ustalenia, które przesądzają o kształcie — 2-4 zdania z rozmowy projektowej
(SKILL.md §2), np. (wzór, wrzesień 2026):
1. Demo pokazuje tool calling: agent sam wybiera narzędzia i kolejność, nikt
   mu jej nie dyktuje. To jest treść pokazu, nie efekt uboczny.
2. Wejście i wyjście — konkretne systemy ustalone w rozmowie, nie zgadywane.
3. Zero budowania na antenie: workflow jest gotowy przed transmisją.
Usuń ten komentarz po wypełnieniu.
-->

---

## 0. Streszczenie na jedną kartkę

<!--
Pisz to na końcu, jako streszczenie sekcji 1-9 — nie nowa treść. Wzór
(wrzesień 2026), pięć-sześć punktów:
1. Historia w dwóch zdaniach: kto, co przychodzi, co jest w tym nie tak.
2. Co robi agent, krok po kroku, jednym akapitem.
3. Ile przebiegów na antenie i co pokazuje każdy.
4. Ile kroków się mieści bez cięć i ile trwa jeden przebieg.
5. Jak wygląda wariant zapasowy w jednym zdaniu (i że to NIE jest nagranie
   jako pierwszy poziom).
6. Co trzeba zbudować i orientacyjny szacunek czasu (to szacunek, nie
   pomiar — powiedz to wprost).
-->

---

## 1. Co ten przykład ma udowodnić

<!--
Hasło marketingu (z koncepcji) i tabela "Warunek | Jak przykład go spełnia" —
warunki biorą się z koncepcji i z raportu poprzedniego live'a (co widz musiał
zobaczyć, żeby hasło miało pokrycie), nigdy z wyobraźni tej sesji. Zamknij
akapitem "Dlaczego to jest pokaz <X>, a nie <Y>" — kontrast z rozwiązaniem
prostszym/bardziej sztywnym, które demo świadomie odrzuca, i dlaczego wybrany
dokument/scenariusz (np. pro forma, nie faktura) jest tym, a nie innym.
-->

| Warunek | Jak przykład go spełnia |
|---|---|
| <warunek 1, z koncepcji lub z raportu> | <jak konkretny krok/dana to spełnia> |
| <warunek 2> | <jak konkretny krok/dana to spełnia> |

---

## 2. Historia i dane

Wszystkie dane fikcyjne. Pliki w `live-events/<data>-<slug>/seed/`.

<!--
Przeczytaj w całości sekcję 2 wzorca (`2026-09-13-demo-live-2026-09-21-design.md`)
przed pisaniem tej sekcji — to najważniejsza część spec'u, bo
z niej powstają wszystkie pliki seed/. Branża celowo nijaka, żeby każdy widz
rozpoznał sytuację bez znajomości branży.
-->

### Firma widza

<!-- Nazwa, branża, miasto, kto obsługuje sprawę (rola pokazywana na
antenie), jaka skrzynka/konto, jaki rejestr/log śledzi historię i ile ma
wierszy. -->

### Kontrahent A: <nazwa> (przebieg główny)

<!--
Stały/znany kontrahent z historią w rejestrze. Co najmniej dwa wcześniejsze
wpisy PO TEJ SAMEJ CENIE/warunkach, żeby porównanie było przekonujące. Opisz
mail (co mówi, a czego świadomie NIE mówi — różnica ma siedzieć w załączniku,
nie w treści maila) i dokument (numer, ilość, cena, kwota, termin). Zamknij
tabelą liczb "poprzednio | teraz | różnica" z dokładnym % i kwotą — liczby
dobrane tak, żeby model nie miał gdzie się pomylić w arytmetyce.
-->

### Kontrahent B: <nazwa> (zaplanowane niepowodzenie)

<!--
TO JEST OBOWIĄZKOWE — demo bez zaplanowanego niepowodzenia niczego nie uczy
o granicach agenta (SKILL.md §2). Nowy/nieznany kontrahent albo dokument
z brakującymi danymi. Opisz dokładnie czego brakuje i dlaczego to jest
celowe, oraz jednym zdaniem oczekiwane zachowanie agenta: przyznaje się, że
nie ma z czym porównać / czego brakuje, i NIE zgaduje.
-->

---

## 3. Przebieg dla widza

<!--
Numeracja krokow zgodna z run-of-show/koncepcją, jeśli już istnieje taka
tabela. Kolumna "klocek" mówi, czy krok jest narzędziem, po które agent
sięga SAM (decyzja agenta) czy stałym elementem przepływu (wejście, bramka,
wyjście). Oznacz gwiazdką krok, w którym agent zauważa rozbieżność — to
jest krok, którego nie wolno ciąć przy skróceniu.
-->

| # | Co robi agent | Co widzi widz | Zdanie prowadzącego (po ludzku) | Klocek |
|---|---|---|---|---|
| 1 | <...> | <...> | <...> | stały (wejście) |
| … | … | … | … | … |

**Zdanie, dla którego robimy ten live** (pada dosłownie na ekranie/telefonie
i powtarza je prowadzący):

> <cytat — zdanie porównawcze z konkretnymi liczbami>

### Wiadomość na ekranie/telefonie (dosłownie)

<!--
Treść MUSI być identyczna z tym, co produkuje krok "Prompty" (szablon
zatwierdzenia/meldunku) — to jest kontrakt między tą sekcją a plikiem
`prompts/<...>-prosba-o-zgode.md`. Wklej dosłowny tekst w bloku kodu, osobno
dla przebiegu udanego i (jeśli dotyczy) nieudanego.
-->

```text
<treść wiadomości, przebieg A>
```

```text
<treść wiadomości po decyzji, meldunek>
```

---

## 4. Architektura: jakie klocki stoją za krokami

<!--
Odpowiedź na "jakie konkretne systemy stoją za krokami X-Y". Jeśli to
kolejne demo po wcześniejszym evencie, nazwij wprost, że to adaptacja
poprzedniego workflow (co zostaje, co się zmienia) tabelą "Poprzednio |
Teraz | Powód" — nigdy nie buduj od zera bez sprawdzenia, czy coś nie da się
odziedziczyć. Jeśli to pierwsze demo, pomiń tę tabelę.
-->

```text
[1] <trigger>                              (konto, jak często/co odpala)
      │
[2] <ekstrakcja/przygotowanie danych>
      │
[N] <węzeł agenta>                          (model + prompt z /prompts)
      ├─ tool  "<nazwa po polsku>"          <węzeł n8n, operacja>
      ├─ tool  "<nazwa po polsku>"          <węzeł n8n, operacja>
      │     └─ <bramka zatwierdzenia, jeśli dotyczy>
      └─ tool  "<nazwa po polsku>"
      │
[N+1] <wyjście/meldunek>
```

**<Liczba> narzędzia, <liczba> decyzje agenta.** Żadne z narzędzi nie jest
wpisane w kolejność przepływu na sztywno. To OPISY narzędzi
(`prompts/<...>-opisy.md`), nie prompt, prowadzą agenta do właściwej
kolejności — powiedz to wprost, to jest architektoniczne sedno tool
callingu, nie automatyzacji.

**Bramka zatwierdzenia jest w przepływie, nie w prompcie**, jeśli demo ma
krok wysyłki/akcji nieodwracalnej — opisz dokładnie, na jakim połączeniu
stoi i jakimi polami się zasila (żeby wiadomość na ekranie miała wszystko,
czego potrzebuje, bez zaglądania w ustawienia węzła).

**Nazwy klocków na kanwie są po polsku i po ludzku**, bo w bloku "klocek po
klocku" widz czyta kanwę, nie prowadzący.

**Model.** <który model, z jakiego konta, i reguła kalibracji: jeśli
zachowanie wychodzi nierówno po próbach, zmieniamy opis narzędzia albo
model, NIGDY prompt jako pierwszy odruch>.

**Credentials po nazwie, jak w `workflows/KONWENCJE.md`:** <lista nazw,
np. `google-demo-gmail`, `telegram-demo`, `<model>-demo`>. Zero tokenów
w tym dokumencie i w żadnym pliku repo.

---

## 5. Przebiegi na antenie

<!--
Minutaż wpisany w run-of-show/koncepcję, jeśli już istnieje — ten spec go
nie wymyśla, tylko wypełnia szczegółami technicznymi. Jedna tabela na
przebieg. Zasada "efekt najpierw, potem klocek po klocku" jest domyślnym
kształtem: pokaż widzowi wynik, zanim wytłumaczysz mechanikę.
-->

### Przebieg A: "efekt najpierw", potem "klocek po klocku"

| Czas | Co się dzieje | Uwagi |
|---|---|---|
| <...> | <...> | <...> |

<!-- Element angażujący dla czatu, jeśli koncepcja/warianty go przewidują —
jednym akapitem: co pyta prowadzący, dlaczego odpowiedź nie zmienia biegu
zdarzeń, tylko sprawdza zrozumienie. -->

### Przebieg B: <nazwa scenariusza niepowodzenia>

| Czas | Co się dzieje |
|---|---|
| <...> | <...> |

<!-- Zamknij akapitem: co przebieg B robi NARAZ (zwykle: dowodzi, że to nie
sztuczka pod jeden przypadek; rozbraja obiekcję "a jak nie ma danych";
pokazuje drugą gałąź decyzji człowieka). -->

### Podsumowanie wartości: jeden obraz

<!-- Ten sam obraz służy w sekcji 6 jako pusty szablon do wypełnienia na
żywo — kolumny muszą być identyczne w obu miejscach. -->

| Zdarzenie | Agent sprawdza | Agent zauważa | Człowiek decyduje |
|---|---|---|---|
| <...> | <...> | <...> | <...> |

---

## 6. Przeniesienie do firmy widza

<!--
Prowadzący bierze przypadek z czatu i wpisuje go w te same cztery pola co
w sekcji 5. Żeby nie improwizować od zera, przygotuj 2-3 mapowania gotowe
z góry, najlepiej z realnych odpowiedzi czatu z poprzedniego live'a (jeśli
istnieją) — nie zmyślaj branż ani przypadków.
-->

| Przypadek z czatu | Zdarzenie | Agent sprawdza | Agent zauważa | Człowiek decyduje |
|---|---|---|---|---|
| <...> | <...> | <...> | <...> | <...> |

Zasada: prowadzący **nie obiecuje, że to zbudujemy**, i nie schodzi
w narzędzia. Mapuje tylko na cztery pola.

---

## 7. Wariant zapasowy

<!--
Warunek zwykle narzucony przez marketing/produkcję: po pierwszym błędzie
idziemy dalej bez debugowania, widz widzi cały przebieg i ten sam wynik
końcowy, i nie ma to wyglądać na odtworzenie nagrania. Cztery poziomy to
wzór sprawdzony na dwóch eventach — zachowaj je, chyba że konkretny demo ma
mniej systemów do awarii.
-->

| Poziom | Kiedy | Co robimy | Co widzi widz |
|---|---|---|---|
| **0, prewencja** | zawsze | Próba generalna rano w dniu live'a, na tym samym koncie: każdy przebieg wykonany naprawdę. Wieczorem czyścimy tylko dane wygenerowane przez próbę | nic, to jest przygotowanie |
| **1** | <konkretny sygnał awarii> | Rafał pokazuje ten sam przebieg z porannej próby zamiast na żywo | prawdziwy przebieg, sprzed kilku godzin, nikt nie przeprasza ani nie debuguje |
| **2** | <awaria konta/n8n> | Drugi workspace z zaimportowanym workflowem i porannym wykonaniem | jak wyżej |
| **3** | <awaria całkowita, internet> | Nagranie próby generalnej, komentarz na żywo | nagranie, mówimy że to nagranie |

**Awarie punktowe:** <lista: konkretne miejsca, w których demo może zawieść
po cichu (najgorszy przypadek) albo głośno, i co robimy w każdym przypadku —
włącznie z regułą, ile razy wolno spróbować ponownie na żywo (retry) zanim
przechodzimy do poziomu wyżej>.

---

## 8. Czego nie pokazujemy i nie mówimy

<!--
Punkty specyficzne dla TEGO przykładu (ogólna lista żyje w dokumencie
wariantów/ściądze, jeśli istnieje — nie powtarzaj jej tu w całości, tylko to,
co dotyczy akurat tego dema). Zawsze zawiera: zakaz pokazywania ustawień
węzłów/promptu, zakaz budowania na antenie, słownik zakazanych słów
technicznych → ich potoczny odpowiednik, zakaz prawdziwych nazw kont, zakaz
mówienia że agent "zgaduje/halucynuje" (przebieg B jest odpowiedzią na tę
obiekcję, nie słowo).
-->

- Nie otwieramy ustawień węzłów ani opisów narzędzi. Na pytanie "co tam jest
  wpisane": "o tym jest kurs".
- Nie budujemy, nie generujemy i nie poprawiamy niczego na antenie.
- Nie mówimy: <lista słów technicznych>. Mówimy: <ich odpowiedniki po
  ludzku>.
- Nie pokazujemy adresów/nazw prawdziwych kont.
- Nie mówimy, że agent "zgaduje" albo "halucynuje".

---

## 9. Wykonalność i lista prac

<!--
Sprawdź liczbę kroków i czas anteny przeciwko temu, co koncepcja/run-of-show
już obiecały widzowi — jeśli się nie mieści, powiedz to tu wprost i wskaż,
który krok tniemy jako pierwszy (i który jest nietykalny).
-->

**Liczba kroków:** <n> widocznych. Nietykalne: <które>. Do cięcia jako
pierwszy: <który, dlaczego najmniej widowiskowy>.

**Czas anteny:** <zakres minut>, w tym czas jednego przebiegu od zdarzenia
wejściowego do efektu końcowego: <szacunek, "do zmierzenia na próbie">.

**Lista prac** (szacunki, nie pomiary; kolejność = kolejność wykonania):

| # | Praca | Szacunek | Uwagi |
|---|---|---|---|
| 1 | <...> | <...> | <...> |

<!--
Ostatni wiersz tej listy jest ZAWSZE "eksport workflow(ów) do
`workflows/` po pierwszej udanej próbie" — nie pomijaj go. Zamknij akapitem:
"W tym dokumencie nie ma JSON-a workflowu: ręcznie pisany JSON, który nigdy
nie przeszedł przez n8n, nie jest gotowcem. Workflow budujemy w n8n
i eksportujemy." — to zdanie jest tu obowiązkowe, nie stylistyczne.
-->

**Do sprawdzenia na pierwszej próbie** (pisane z pamięci o n8n, nie
z instancji):

- <lista rzeczy niepewnych co do konkretnej wersji/zachowania n8n, każda
  z zapasowym rozwiązaniem, jeśli się nie potwierdzi>.

---

## 10. Otwarte decyzje

| Pytanie | Propozycja | Kto rozstrzyga |
|---|---|---|
| <...> | <...> | <...> |

---

## 11. Pliki

```text
live-events/<data>-<slug>/
├── README.md
├── seed/
│   ├── <plik>.csv              <opis>
│   ├── mail-A-<...>.md         treść maila A (nadawca, temat, treść)
│   ├── <dokument>-A-<...>.html załącznik A, do PDF
│   ├── mail-B-<...>.md         treść maila B
│   ├── <dokument>-B-<...>.html załącznik B, do PDF (z celowym brakiem)
│   └── export-pdf.ps1          HTML → PDF przeglądarką, z warstwą tekstową
├── prompts/
│   ├── agent-system-prompt.md  prompt agenta
│   ├── narzedzia-opisy.md      opisy narzędzi (to, co widzi model)
│   └── <kanał>-prosba-o-zgode.md  szablon wiadomości bramki i meldunku
└── workflows/                  (puste do pierwszej próby; tam lądują eksporty)
```
