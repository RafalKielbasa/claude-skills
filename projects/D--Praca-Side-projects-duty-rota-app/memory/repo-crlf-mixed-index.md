---
name: repo-crlf-mixed-index
description: "Repo ma historycznie CRLF w indeksie wielu plików (engine/api/web) — nie normalizować, oceniać diffy po liczbie zmienionych linii"
metadata: 
  node_type: memory
  type: project
  originSessionId: 39eb6e6a-4e68-47c6-9e76-b24f1744fb6c
---

Wiele plików repo duty-rota-app jest zacommitowanych z CRLF w indeksie (m.in. engine/src/rota_engine/*.py, część engine/tests, pliki web/src/pages/*.tsx), inne z LF — stan mieszany, historyczny (`git config core.autocrlf` = false, brak .gitattributes).

**Why:** Sygnał „plik zmienił się cały w git diff --stat" nie zawsze oznacza CRLF-flip wprowadzony przez Edit — czasem plik po prostu JUŻ jest CRLF i dopisywane linie też muszą być CRLF, żeby diff był punktowy. Odwrotnie: zapis LF do pliku CRLF eksploduje diff.

**How to apply:** Przed commitem porównuj liczbę zmienionych linii z realnym zakresem edycji (`git diff --stat`); dopasuj końcówki do pliku (`git ls-files --eol <plik>`). NIE normalizować końcówek w całym repo — to zaśmieca historię. Zobacz też [[edit-tool-crlf-flip]].
