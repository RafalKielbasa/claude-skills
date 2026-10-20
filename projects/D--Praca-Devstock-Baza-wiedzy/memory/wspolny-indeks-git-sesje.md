---
name: wspolny-indeks-git-sesje
description: "W „Bazie wiedzy” sesje dzielą jeden indeks git - nie stage'uj częściowej wersji pliku w prawdziwym indeksie, commituj przez GIT_INDEX_FILE."
metadata:
  node_type: memory
  type: feedback
  originSessionId: 541cf3f0-bb8c-449a-92fd-d69e74d140fc
  modified: 2026-10-20T08:14:20.029Z
---

Kilka sesji pracuje równolegle w jednym folderze „Baza wiedzy” i dzieli jeden indeks git. 2026-10-20 zrobiłem w prawdziwym indeksie `git update-index` z wersją `n8n.js` „HEAD + mój blok” (w drzewie były cudze niezacommitowane zmiany). Sesja lekcji 2.2 zacommitowała w tej samej chwili ze wspólnego indeksu i mój blok wszedł do jej commita `d045f8df`. W indeksie wisiało też cudze usunięcie pliku, które łatwo było zabrać do własnego commita.

**Why:** cudzy commit zabiera wszystko, co leży w indeksie, a `git commit -- <ścieżka>` bierze wersję z drzewa roboczego, czyli razem z cudzymi zmianami w tym pliku.

**How to apply:** gdy w pliku są też cudze zmiany albo w indeksie coś stoi, commituj przez tymczasowy indeks: `GIT_INDEX_FILE=<scratchpad>/idx git read-tree HEAD`, potem `update-index --cacheinfo` / `git add` tylko własnych ścieżek, `git commit` (hooki działają), na koniec `git restore --staged <moje ścieżki>` w prawdziwym indeksie. Powiązane: [[tryb-commitow-per-repo]].
