---
name: baza-wiedzy
description: Operacje na firmowej wektorowej bazie wiedzy (pgvector przez webhooki n8n) — pytania RAG, dodawanie/aktualizacja wpisów z repo, statystyki, lista i usuwanie wektorów. Używaj, gdy Rafał chce zapytać bazę wiedzy, zapisać do niej treść albo posprzątać wektory.
---

# /baza-wiedzy — operacje na wektorowej bazie wiedzy

Baza: PostgreSQL + pgvector na VPS, tabele `{kategoria}_vector_db`, dostęp
wyłącznie przez webhooki n8n. Wszystkie operacje wykonuj klientem CLI
`tools/kb-client` — nigdy nie łącz się z bazą ani webhookami bezpośrednio.

## Wymagania

Plik `tools/kb-client/.env` (skopiowany z `.env.example`, uzupełniony przez
Rafała). Gdy go brak — poproś Rafała o uzupełnienie, nie zgaduj wartości.
Komendy uruchamiaj z katalogu `tools/kb-client`.

## Kategorie

`dev`, `marketing`, `product`, `sales`, `company`, `other`, `interns`.
Dobór: treści techniczne → dev; oferta/klienci → sales; promocja → marketing;
produkt/kursy → product; sprawy firmy (procesy, HR, finanse) → company;
materiały dla praktykantów → interns; reszta → other. Gdy kategoria nie jest
oczywista — zapytaj Rafała.

## Operacje

Pytanie do bazy (odpowiada agent RAG w n8n, markdown):

    npm run kb -- ask --source dev "Jak konfigurujemy CI?"

Zapis/aktualizacja pliku z repo (entry_id = ścieżka względem korzenia repo,
ponowny zapis tego samego pliku podmienia jego wektory — bez duplikatów):

    npm run kb -- upsert --category company --file "D:\Praca\Devstock\Baza wiedzy\knowledge-base\procesy\onboarding.md"

Zapis treści ad-hoc (bez pliku — sam nadaj sensowne entry_id):

    npm run kb -- upsert --category dev --entry-id "notatki/2026-07-21-ustalenia" --text "..."

Administracja:

    npm run kb -- stats                                  # liczba chunków per kategoria
    npm run kb -- list --category dev                    # wpisy (entry_id, chunki, updated_at)
    npm run kb -- export --category dev --out "zrzut.json"  # wierny zrzut chunków (content + metadata, bez embeddingów)
    npm run kb -- delete --category dev --entry-id "a.md"
    npm run kb -- delete --category dev --yes            # czyści CAŁĄ kategorię!

## Zasady

- **Czyszczenie całej kategorii (`delete --yes`) wykonuj wyłącznie po
  wyraźnym potwierdzeniu Rafała w tej rozmowie** — nigdy z własnej
  inicjatywy. Przed potwierdzeniem pokaż `stats`/`list`, żeby Rafał
  wiedział, co zniknie.
- Wpisy `(legacy)` na liście to stare dane bez metadanych (era Notion) —
  nie da się ich usunąć po entry_id; do wglądu użyj `export` (wierny zrzut),
  zostają do czasu re-indeksacji.
- Błędy CLI lądują na stderr po polsku: rozróżniaj problem konfiguracji
  (.env), autoryzacji (Basic Auth), walidacji (zła kategoria/pola) i serwera.
  Relacjonuj Rafałowi przyczynę, nie ponawiaj ślepo.
- `ask` może trwać do 2 minut (agent Gemini) — to normalne.
