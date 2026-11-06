# pole-o-pasujacej-nazwie-wziete-za-wymaganie

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Wymaganie opisuje zachowanie („sesja pracuje w innym katalogu”), a ja przekładam je na pole API
o pasującej nazwie (`workspace.current_dir`) i na nim buduję funkcję. Testy przechodzą, a funkcja
nie działa w jedynym przypadku, o który użytkownikowi chodziło. Żywa sesja przeczy założeniu, a brak
dowodu tłumaczę tym samym założeniem.

## Przyczyna źródłowa
Nazwa pola wygląda jak definicja wymagania, więc pytanie „czy to pole idzie za tym, co użytkownik
nazywa pracą sesji” nie pada. Testy dostają payload z ręcznie ustawionym polem, więc dowodzą
mapowania, które sam założyłem, a nie tego, kiedy Claude Code to pole ustawia. Brak przypadku na
żywo wygląda wtedy jak drobne zastrzeżenie, choć jest brakiem jedynego dowodu. Pokrewny wzorzec:
`zielony-suite-z-mockami-nie-widzi-binarki-ani-poswiadczen`.

## Dowody
- 2026-11-06, sesja 2e20e7fb-3051-4c0d-899a-41666a866e98 (id claude.ai niedostępny; repo `.claude`,
  status line z gitem): prośba o parametry gita, „jeśli sesja claude pracuje w innym katalogu niż
  terminal”. Katalog sesji wziąłem z `workspace.current_dir`. Było 46/46 testów na syntetycznych
  payloadach, a raport mówił: „dwóch linii nie widziałem na żywo, bo ta sesja pracuje w katalogu
  terminala”. Ta sama sesja przez cały czas edytowała `~/.claude` po ścieżkach bezwzględnych. Rafał:
  „Ta sesja pracuje na plikach w innym katalogu, a nie widzę statusu git z niego”. Pole nie idzie za
  takimi edycjami. Naprawą był hook `PostToolUse` zapisujący repo edytowanych plików, sprawdzony
  prawdziwą edycją.

## Rozwiązanie
Przekładając wymaganie na pole, najpierw nazwij konkretny przypadek, który wskazałby użytkownik
(najczęściej: ta sesja), i odczytaj w nim wartość pola. Gdy przypadek na żywo „nie zachodzi”,
sprawdź to na działaniach sesji (np. ścieżkach edytowanych plików), a nie na tym samym polu. Zdanie
„nie widziałem na żywo, bo…” to powód do sprawdzenia przyczyny przed raportem. W raporcie napisz, że
testy z ustawianym polem dowodzą mapowania, a nie semantyki pola.
