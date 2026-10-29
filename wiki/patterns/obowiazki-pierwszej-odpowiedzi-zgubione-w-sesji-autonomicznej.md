# obowiazki-pierwszej-odpowiedzi-zgubione-w-sesji-autonomicznej

- **Skill:** board-tracker (też protokół huba w `~/.claude/CLAUDE.md`)
- **Typ:** porażka
- **Status:** otwarty

## Opis
W sesji uruchomionej przez hub z długim zadaniem autonomicznym pierwsza odpowiedź gubi dwa obowiązki startowe:
- dosłowny cytat wiadomości huba na początku odpowiedzi;
- 1–3 linie stanu tablicy z briefu `SessionStart`.

Oba pojawiają się dopiero przy pierwszej bramce, wiele godzin później.

## Przyczyna źródłowa
Skill wykonawczy (subagent-driven-development) wymaga ciągłej pracy bez meldunków, a przypomnienie „powiedz w kilku słowach, co robisz” rodzi jednolinijkowy status. Żadna z tych krótkich odpowiedzi nie jest traktowana jako „pierwsza odpowiedź”, więc obowiązki przypięte do pierwszej odpowiedzi nie mają momentu, w którym się wykonują. Karta hubowa pokazuje przy tym odpowiedź bez wiadomości, więc Rafał długo nie widzi, na co sesja odpowiada.

## Dowody
- 2026-10-28, sesja a011691a-07ee-43f2-ad0e-bac7765e83bf (code-busters-v2, plan 5 W3):
  - pierwsze teksty sesji to statusy w rodzaju „Konfiguruję sesję: przypinam do #768…”, bez cytatu huba i bez linii tablicy;
  - cytat wiadomości huba i linie tablicy pojawiły się dopiero w pytaniu o D1–D3 przed bramką, po około czterech godzinach.

## Rozwiązanie
Pierwszy tekst sesji uruchomionej przez hub, także jednolinijkowy status, zaczyna się od cytatu wiadomości huba (zwiniętego w `<details>`, gdy jest długa) i zawiera linie tablicy z briefu. Dopiero potem idzie status. Obowiązek dotyczy pierwszego wypisanego tekstu, nie pierwszej odpowiedzi „merytorycznej”.
