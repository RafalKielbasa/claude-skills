# Live „<TYTUŁ>" <DD.MM.RRRR> — prace przed live'em

Data: <YYYY-MM-DD>
Status: <np. „materiał na spotkanie DD.MM (punkt N agendy)" albo „zatwierdzone z zespołem DD.MM">

<!--
Nagłówek to metadane, nie treść. Wypełnij tytuł i datę live'a z `live.yaml`,
dzisiejszą datę powstania dokumentu i szczery status — kto jeszcze musi to
zobaczyć, zanim to ruszy w pracę — usuń ten komentarz.
-->

Dokument towarzyszy koncepcji spod `documents.concept`. Podział ról:

- **koncepcja** — o czym jest live i dlaczego (decyzje),
- **ten dokument** — co trzeba zrobić, kto to robi i do kiedy.

Decyzje nie są tu powielane. Tam, gdzie praca czeka na decyzję jeszcze
nierozstrzygniętą, blok w sekcji 4 wprost nazywa, na co czeka.

---

## 1. Budżet czasu

<!--
Przykład (live „Agenci AI" 27.08.2026):
Live: czwartek 27.08.2026. Od 12.08 zostaje 11 dni roboczych przed dniem
live'a: 12-14.08, 17-21.08, 24-26.08.

Jedno-dwa zdania: data i dzień tygodnia live'a, od jakiego dnia liczymy
(zwykle dzisiaj), ile dni roboczych faktycznie zostaje do wykorzystania —
liczone poniedziałek-piątek, dzień live'a się do tej puli nie wlicza. Podaj
też same daty przedziału, nie tylko liczbę dni.
-->

---

## 2. Kalendarz wsteczny — kamienie milowe

| Kamień milowy | Data | Zależy od |
|---|---|---|
| <kamień milowy 1> | <DD.MM> | <brak — do zrobienia od razu / nazwa bloku albo wcześniejszego kamienia> |
| <kamień milowy 2> | <DD.MM> | <...> |
| … | … | … |
| **LIVE** | <DD.MM> | |

<!--
Licz wstecz od daty live'a w dniach roboczych (poniedziałek-piątek; sobota i
niedziela nigdy nie są datą kamienia milowego) — algorytm dokładnie opisany w
SKILL.md §6. Każdy kamień milowy dostaje jedną konkretną datę kalendarzową,
nigdy względne „dwa tygodnie przed" ani „tydzień wcześniej". Kolejność wierszy
od najdalszego w czasie do live'a, LIVE zawsze na końcu tabeli.

Jeśli czasu jest mniej niż standardowo (krótki rozbieg), skompresowane wiersze
i tak dostają realne daty — kompresję nazywasz w sekcji 3 jako wąskie gardło,
nie chowasz jej w tej tabeli bez komentarza.
-->

---

## 3. Wąskie gardła

<!--
Dwie do trzech rzeczy, które realnie mogą zatopić termin — każda z
fallbackiem, nie samą diagnozą. Przykład (live „Agenci AI"): kampania ma 9 dni
zamiast 15 (fallback: kampania jako dodatek do wyniku, nie jego silnik);
konflikt komunikacji do zamkniętej grupy kontra start kampanii (fallback:
kampania milczy o przedsprzedaży, dopóki ta grupa nie dostanie maila);
ścieżka krytyczna zbiega się na jednej osobie, która jest właścicielem 7 z 14
bloków (fallback: część pracy przechodzi na kogoś innego, patrz sekcja 4).
-->

### 3.1. <nazwa wąskiego gardła>

<opis zagrożenia — konkretna liczba albo fakt, który je pokazuje, nie ogólnik>

**Fallback:** <co robimy, jeśli to się urzeczywistni>

### 3.2. <nazwa wąskiego gardła>

<opis>

**Fallback:** <...>

<!-- Dopisz 3.3, jeśli trzecie wąskie gardło faktycznie istnieje. -->

---

## 4. Bloki robocze

Legenda: **Termin** = data, na którą blok ma być skończony (nie data startu
prac) — to jeden z kamieni milowych z sekcji 2. **Blokada** = na co ten
konkretny blok czeka, zanim może ruszyć: inny blok (np. „blok F"),
nierozstrzygnięta decyzja z koncepcji, albo dosłownie „brak — do zrobienia od
razu", jeśli nic go nie wstrzymuje — to pole nigdy nie zostaje puste, bo
kolumna „Zależy od" w sekcji 2 nazywa jedną wspólną zależność dla całego
kamienia milowego, nawet gdy kilka bloków dzieli jeden termin, a to nie to
samo, co zależność jednego konkretnego bloku od drugiego w ten sam dzień.
**Gotowe, gdy** = warunek sprawdzalny, nie „chyba działa".

<!--
Jeden blok na literę, w kolejności alfabetycznej. Zakres bloków proponuje
skill z decyzji koncepcji (SKILL.md §7), Rafał potwierdza, które dotyczą tego
wydarzenia i kto jest właścicielem. Bloki A-N z sierpnia
(`live-agenci-ai-prace-przed.md` §4) to przykład kształtu i ziarnistości, nie
lista obowiązkowa do skopiowania — inne wydarzenie może potrzebować mniej
bloków albo bloku, którego tamta lista nie nazywa.
-->

### A. <nazwa bloku>

**Cel:** <po co ten blok istnieje — jaki efekt ma dać>

**Kroki:**

- [ ] <krok>
- [ ] <krok>

**Kto:** <właściciel, albo „NIEPRZYPISANY — do rozstrzygnięcia">

**Blokada:** <inny blok / nierozstrzygnięta decyzja z koncepcji / „brak — do zrobienia od razu">

**Termin:** <DD.MM> (kamień milowy: <nazwa z sekcji 2>)

**Gotowe, gdy:** <warunek sprawdzalny>

### B. <nazwa bloku>

**Cel:** <...>

**Kroki:**

- [ ] <...>

**Kto:** <...>

**Blokada:** <...>

**Termin:** <DD.MM> (kamień milowy: <...>)

**Gotowe, gdy:** <...>

<!-- Dopisz kolejne litery na każdy potwierdzony blok, w tym samym kształcie. -->

---

## 5. Co musi paść, żeby ta lista ruszyła

<!--
Tabela: decyzja jeszcze nierozstrzygnięta (z koncepcji albo ujawniona w tej
rozmowie) | co blokuje | ile pracy stoi. Jeśli koncepcja jest w pełni domknięta
i nic nie blokuje, napisz to wprost jednym zdaniem — pusta tabela byłaby
myląca, bo nie widać, czy nikt nie sprawdził, czy naprawdę nic nie blokuje.
-->

| Decyzja | Blokuje | Ile pracy stoi |
|---|---|---|
| <decyzja albo pytanie> | <blok(i) z sekcji 4> | <krótki szacunek> |
