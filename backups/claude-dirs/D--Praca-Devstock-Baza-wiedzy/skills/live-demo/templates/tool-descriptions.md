# Opisy narzędzi agenta (to, co widzi model przy wyborze klocka)

<!--
Jedno narzędzie pod węzłem agenta = jeden blok `## N. \`<nazwa narzędzia>\``
niżej. Model NIE widzi kanwy ani ustawień węzła: widzi nazwę narzędzia, jego
opis i listę pól. To ten opis, nie prompt systemowy, prowadzi agenta do
sięgnięcia po właściwy klocek we właściwym momencie — dlatego cytat opisu
jako blok cudzysłowu w każdej sekcji niżej nie jest ozdobnikiem, jest całym
kontraktem między modelem a narzędziem. Na antenie te opisy nigdy nie są
pokazywane.

Nazwy węzłów na kanwie = nazwy w tabelce niżej, bo tak widzi je model
i tak czyta je widz w bloku "klocek po klocku".

Usuń ten komentarz po wypełnieniu. Dodaj tyle sekcji `## N.`, ile narzędzi
faktycznie wisi pod agentem — nie z góry ustaloną liczbę.
-->

Pola oznaczone `$fromAI` model wypełnia sam.

---

## 1. `<Nazwa narzędzia po polsku: czasownik + na czym>`

<!--
Wzór (wrzesień 2026): `Rejestr zakupów: szukaj`. Nazwa mówi widzowi, co
narzędzie robi, bez zaglądania w opis.
-->

Węzeł: <typ węzła n8n, np. Google Sheets Tool>, operacja <np. Get Row(s)>,
<dodatkowe ustawienia istotne dla działania, np. filtr, arkusz>.

Pole(a): `<nazwa_pola>` ($fromAI: "<co model ma tu wpisać, jednym zdaniem,
z przykładem>").

<!-- Dla narzędzi z wieloma polami użyj tabeli zamiast listy: -->

| pole | co ma zawierać |
|---|---|
| `<pole>` | <opis, $fromAI albo wartość stała> |

Opis:

> <Pełny tekst, jaki zobaczy model w polu "Description" węzła. Musi
> zawierać: co narzędzie robi, KIEDY go użyć (jeśli kolejność ma znaczenie —
> to jest jedyne miejsce, gdzie tę kolejność da się wymusić, nie prompt),
> co zrobić, gdy nic nie zwróci albo czegoś brakuje (nigdy "zgadnij"), i czy
> narzędzie tylko czyta czy też zapisuje.>

## 2. `<Nazwa narzędzia>`

Węzeł: <...>

<!-- Powtórz kształt sekcji 1 dla każdego kolejnego narzędzia. -->

Opis:

> <...>

---

## Sprawdzenie na próbie

<!--
Zapisz oczekiwaną kolejność wywołań narzędzi z panelu logów agenta, osobno
dla przebiegu, który ma się udać, i dla przebiegu zaprojektowanego na
niepowodzenie (sekcja 2 spec'u). Wzór (wrzesień 2026):
Przebieg A: `szukaj` → `dopisz` → `odpowiedz` (zgoda) → koniec.
Przebieg B: `szukaj` (pusto) → `dopisz` → `odpowiedz` (odmowa) → `szkic`
→ koniec.
-->

Przy każdym przebiegu próbnym zapisz kolejność wywołań z panelu logów
agenta. Oczekiwana: `<narzędzie>` → `<narzędzie>` → … → koniec. Odstępstwa
poprawiamy **opisem narzędzia, nigdy promptem** — opis jest jedynym miejscem,
które model czyta w momencie wyboru klocka. Jeśli po trzech poprawkach opisu
zachowanie nadal chodzi nierówno, zmiana modelu.
