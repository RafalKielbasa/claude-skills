# utrata-dzialania-datowana-po-konsumencie-nie-po-definicji

- **Skill:** ogólny
- **Typ:** sukces
- **Status:** otwarty

## Opis
Lista follow-upów przypisywała ryzyko ostatniej dużej zmianie: „z CSS wypadło 597 selektorów starej biblioteki,
więc klasa `class=` z treści CMS przestałaby działać”. Autor treści podał konkretne klasy: `code-snipped`, `quote`
i `quote-symbol`. Wtedy `git log -S` po selektorze i `git log -G` po klasie konsumenta pokazały, że reguły działały
tylko pod modyfikatorem `prose-article`. Jedyny konsument tego modyfikatora na webie zniknął 13 miesięcy wcześniej.
Pozycja zmieniła się z „ryzyka po W5” w starą różnicę wizualną i trafiła do paczki wizualnej.

## Przyczyna źródłowa
Reguła CSS (tak samo eksport czy konfiguracja) przestaje działać, gdy znika to, co ją włącza: klasa konsumenta,
modyfikator albo import. Usunięcie samej definicji nie jest tym momentem. Pickaxe po definicji wskazuje commit, który
skasował już martwy plik, i podsuwa fałszywego sprawcę. Datę utraty działania daje dopiero drugi `log -G`
po konsumencie.

## Dowody
- 2026-11-12, sesja 0437af48-c40c-473a-a2a5-5d2bb978768c (id claude.ai niedostępny; code-busters-v2, DT-92 #833,
  poz. 41). Kroki:
  - `git log -S 'quote-symbol'` dał `c195d145b` (#1730), czyli usunięcie `articleTypography.ts`;
  - `git show c195d145b^:packages/tailwind-config/index.ts`, linie 176-180, pokazał reguły tylko w modyfikatorze `article`;
  - `git log -G 'prose-article' -- apps/codebusters packages/ui/src` dał `1812043cc` (#937, 2025-09-29): ten commit
    zamienił w `article.tsx` klasy `prose prose-article` na `prose prose-lg prose-invert`.

  Rafał przyjął wniosek („Zgodnie z propozycją”). Poz. 41 zamknięta, doszła poz. 52 do paczki wizualnej.

## Rozwiązanie
Zanim przypiszesz utratę działania ostatniej dużej zmianie, ustal dwie daty:
- `git log -S '<definicja>'`: kiedy zniknęła definicja;
- `git log -G '<to, co ją włącza>' -- <ścieżki konsumentów>`: kiedy zniknęło użycie.

Sprawcą jest wcześniejsza z nich. W raporcie podaj obie, z hashami i datami.
