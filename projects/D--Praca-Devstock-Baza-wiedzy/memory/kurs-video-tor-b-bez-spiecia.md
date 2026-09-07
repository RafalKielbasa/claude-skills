---
name: kurs-video-tor-b-bez-spiecia
description: "Tor B (demo) w /kurs-video kończy się dla Rafała na dostarczeniu paczki lektora + avatarów — finalny montaż robi sam przy okazji nakładania głosu, bez etapu nagranie-z-lektorem.mp4/final.mp4 ze skilla."
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 21e37356-099e-4ae0-99b4-1875bd23ce17
  modified: 2026-09-07T13:00:51.992Z
---

Rafał sam składa finalne wideo, gdy nakłada głos na nagranie — etap
`video/nagranie-z-lektorem.mp4` + spięcie do `video/final.mp4` opisany
w skillu `kurs-video` (tor B, krok 4) dla niego odpada. Zadanie skilla wobec
niego kończy się na dostarczeniu:
- paczki lektora (`video/lektor/*.mp3` + `spis.md`),
- gotowych plików avatara (`video/avatar/*.mp4`).

**Dlaczego:** ustalone wprost przy produkcji M00L01
(`kursy/agenty-ai/modul-00-podstawy-n8n/lekcja-01-interfejs-pierwszy-workflow`)
2026-09-07 — Rafał już ma własny workflow montażu, w którym łączy screencast
i lektora sam.

**Jak stosować:** przy `/kurs-video` dla lekcji `typ_video: demo` uruchamiaj
etap materiałów (TTS + avatary, silnik wg bramki z kroku 2 skilla), oddaj
Rafałowi ścieżkę `spis.md` i pliki avatara, i na tym **zatrzymaj się** — nie
czekaj na `nagranie-z-lektorem.mp4`, nie próbuj odpalać drugiego przebiegu
`npm run video` w oczekiwaniu na finalne spięcie, i nie ustawiaj
`status.video: zaakceptowane` (Rafał sam decyduje, kiedy jego montaż jest
gotowy — to poza tym repo/pipeline'em). Jeśli Rafał kiedyś poprosi
o tradycyjne spięcie finalne przez pipeline dla konkretnej lekcji, to jest
wyjątek na tę jedną prośbę, nie zmiana tej zasady na stałe.
