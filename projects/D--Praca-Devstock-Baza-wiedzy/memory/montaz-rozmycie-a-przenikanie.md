---
name: montaz-rozmycie-a-przenikanie
description: "Rozmycie danych konta w EDL nie obejmuje przenikania do innego nagrania (ogon klipu z zapasem stopklatki) - dane widać ~0,3 s; daj twarde cięcie. Plus: rozmycie nie wystartuje w środku pauzy."
metadata:
  node_type: memory
  type: project
  originSessionId: c6ebb064-81d9-4b6b-9857-7bf69d930b7a
  modified: 2026-10-22T09:44:37.820Z
---

Lekcja agenty-ai 1.4, 2026-10-22, montaż z rozmyciem danych kont Pinecone i Cohere (D68 A). Obserwacje:

- **Przenikanie odsłania rozmyte dane.** Klip następnego akapitu przenika ostatnie 0,5 s poprzedniego klipu
  (`-sseof -0.5` w `renderujKlip`, `tools/course-pipeline/src/montaz-render.js`). Ten ogon obejmuje zapas
  stopklatki, a rozmycie działa tylko w obrębie akapitu: `sprawdz` odrzuca `do` dłuższe od akapitu („czas
  zaznaczenia … poza akapitem”). Przez ok. 0,3 s widać było nierozmyte „Bobi's Org” i „BK”. Poprawka:
  `"przejscie": "ciecie"` na akapicie, który przychodzi po rozmytym ekranie z innego miejsca nagrania (tu 3:4, 4:1,
  7:1). Przejścia ciągłe (ten sam plik, `od` = poprzednie `do`) się nie przenikają.
- **Pauza a moment pojawienia się danych.** Zaznaczenie z `od` równym `po` pauzy startuje po pauzie, a obraz w
  czasie pauzy biegnie dalej. Gdy karta z danymi pojawia się w środku pauzy, przesuń pauzę na granicę innego
  zdania albo na koniec akapitu. Moment przełączenia znajdziesz przez `klatka --akapit=ID --czas=S`, które liczy
  czas narracji razem z pauzami.
- **Wykrywanie ekranu po jasności:** n8n ma ciemny motyw (średnia luma górnego paska ok. 30–60), a Pinecone i Cohere
  są jasne (ok. 210–220). `ffmpeg … crop=400:60:0:0,signalstats` na klatce wystarczy, żeby znaleźć przełączenie
  karty co do 0,05 s.

**Why:** dane konta miały zniknąć z filmu w całości. Na arkuszu kontrolnym wyciek był tylko bladym prześwitem
w kaflu A następnego akapitu (4.1 A). Potwierdziły go dopiero wycinki z klatek filmu.
**How to apply:** po każdym rozmyciu danych sprawdź klatki filmu co 0,1 s na przejściach wychodzących z rozmytego
ekranu. Powiązane: [[reset-konta-kursu-gotowe-lekcje]].
