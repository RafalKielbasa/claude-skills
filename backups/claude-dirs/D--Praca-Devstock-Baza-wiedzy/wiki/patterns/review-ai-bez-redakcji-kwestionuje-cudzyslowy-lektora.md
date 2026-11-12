# review-ai-bez-redakcji-kwestionuje-cudzyslowy-lektora

- **Skill:** kurs-lekcja (krok 6, `npm run review-ai`), dotyka kurs-redakcja
- **Typ:** porażka
- **Status:** otwarty

## Opis
Punkt 7 `review-ai` dał werdykt DO POPRAWY z jedną uwagą: usunąć z tekstu lektora cudzysłowy wokół nazw (`"Notion"`, `"en osiem en"`, `"Ejaj Builder"`, `kontrol plus "ce"`), bo TTS robi na nich pauzę. Uwaga jest sprzeczna z regułą kursu i trzeba ją odrzucać ręcznie przy każdej lekcji, a werdykt DO POPRAWY wisi w raporcie mimo braku prawdziwego problemu.

## Przyczyna źródłowa
`tools/course-pipeline/src/review-ai.js:124-125` ładuje do promptu tylko `styleguide.md` i `profil-wypowiedzi.md`. Reguła „Każda nazwa własna w cudzysłowie” (cudzysłów nie jest czytany, grupuje nazwę) stoi w `kursy/_wspolne/redakcja.md`, sekcja „Nazwy w scenariuszu”, a profil (sekcja 6) tylko do niej odsyła, nie powtarzając jej. Recenzent widzi cudzysłowy bez reguły, która je uzasadnia, i ocenia je własnym domysłem o TTS.

## Dowody
- 2026-11-12, sesja 62c8c4bb-8377-436d-a2b6-aea1aa8bd57b: `review-ai.md` lekcji agenty-ai 4.1 (gemini-3.1-pro-preview): „Wyczyść scenariusz z cudzysłowów w narracji TTS: Usuń znaki `"` okalające nazwy własne i litery w tekście lektora w całym scenariuszu”. Pozostałe 6 kryteriów OK. Odrzucone w bramce z powołaniem na `redakcja.md`; review-codex tej samej lekcji, który czyta `redakcja.md`, cudzysłowy egzekwował (uwagi 6, 9, 14 domagały się ich więcej, nie mniej).

## Rozwiązanie
W `review-ai.js` dołączyć do promptu sekcję „Nazwy w scenariuszu” z `kursy/_wspolne/redakcja.md` (albo cały plik) i listę wymowy kursu `kursy/<slug>/wymowa.md`, z dopiskiem w punkcie 7: „Cudzysłowy wokół nazw i zapis fonetyczny w tekście lektora są regułą kursu, nie błędem; nie zgłaszaj ich”. Do czasu zmiany: uwagę o cudzysłowach z punktu 7 odrzucać w bramce jednym zdaniem z powołaniem na `redakcja.md`.
