---
name: plansze-live-zrodlo-obrazu
description: "Plansze na live Agenci AI gotowe, ale model wyświetlania nieustalony — Rafał decyduje w poniedziałek 2026-08-24, live jest 27.08"
metadata:
  type: project
---

Stan na 2026-08-21: plansze na live „Agenci AI" powstały jako komplet
dziesięciu HTML-i 1920×1080 z **przezroczystym tłem** + eksport PNG
(`demo/live-agenci-ai/plansze/`), pod założenie, że wpina je Robert w OBS
jako Browser source.

**Założenie upadło pod koniec sesji:** Rafał powiedział, że prezentację
będzie puszczał **laptop Bartka**. Wtedy przezroczystość jest bezużyteczna
(pod spodem pulpit, nie scena), a dziesięć osobnych plików to zła forma do
klikania na antenie.

**Decyzję Rafał podejmie w poniedziałek 2026-08-24** — trzy dni przed livem.
Do rozstrzygnięcia zostały dwie rzeczy:

1. Kto klika slajdy: Bartek sam (nawigacja pod strzałki, spację i pilot) czy
   Robert na sygnał, a laptop Bartka tylko wyświetla.
2. Czy licznik 15 minut i oferta w rogu zostają u Roberta jako narzutki.

**Rekomendacja Claude'a (czeka na akceptację):** podział hybrydowy, bo
scenariusz sam go wymusza — plansze 2, 3, 4, 5, 6, 10 jako **jeden
samodzielny deck** (pełne tło, grafiki wklejone w plik, plus PDF jako plan B)
na laptopie Bartka; plansze 1 (tytuł), 7 (oferta w rogu), 8 (licznik) i 9
(kod, wariant B) zostają przezroczystymi narzutkami u Roberta, bo lecą
równolegle z kamerami w Q&A i zasłoniłyby rozmowę.

Otwarte pytanie techniczne: jeśli laptop Bartka to Mac, font trzeba wkleić
do pliku — rendery powstały na Segoe UI.

Powiązane: [[demo-live-agenci-ai-status]].
