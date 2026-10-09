# najmocniejsze-ustalenie-sprawdzone-u-zrodla-przed-oddaniem

- **Skill:** anthropic-skills:deep-research
- **Typ:** sukces
- **Status:** otwarty

## Opis
Przed oddaniem raportu koordynator sprawdził u źródła ustalenie, na którym
opiera się najpilniejsza rekomendacja, oraz założenie o własnym stosie
technicznym — i znalazł, że założenie było fałszywe.

## Przyczyna źródłowa
Badacze dostają kontekst projektu z briefu koordynatora i z wcześniejszych
dokumentów. Założenie z tamtych dokumentów (tu: koszt mentora liczony na
Gemini 3.8 Flash) przechodzi przez notatki jako fakt o stosie i trafia do
rekomendacji raportu. Ani badacz, ani autor raportu nie mają powodu go
podważyć, bo żaden nie zagląda do kodu produktu.

## Dowody
- 2026-10-09, sesja 75fd3461 (id claude.ai niedostępny): raport „Kodożercy dla
  dzieci i rodziców” rekomendował wyłączyć mentora na Gemini w kontach uczniów,
  „zakładam, że mentor działa na Gemini”. Koordynator potwierdził klauzulę przez
  WebFetch warunków Gemini API („directed towards or is likely to be accessed by
  individuals under the age of 18”, od 23.03.2026), a grep po
  `code-busters-v2/apps/cms` pokazał `gpt-4`, `gpt-5`, `gpt-3.5-turbo` — CMS
  działa na OpenAI. Raport i rekomendacja nr 2 poprawione przed oddaniem
  (`1b3f7c7d`); otwarte pytanie przesunęło się na warunki OpenAI.

## Rozwiązanie
Po raporcie, przed oddaniem: weź ustalenie, które napędza pierwszą albo
najpilniejszą rekomendację, i sprawdź je u źródła pierwotnego; każde
twierdzenie o stanie własnego produktu (model, stos, konfiguracja) sprawdź
w kodzie. Wynik dopisz do raportu jako „weryfikacja koordynatora” z datą.
