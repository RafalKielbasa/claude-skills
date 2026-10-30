# obce-konto-google-w-oknie-wyboru-konta

- **Skill:** kurs-montaz (also kurs-nagrywanie)
- **Typ:** porażka
- **Status:** otwarty

## Opis
Every recording with `google_sign_in` in the agenty-ai course profile shows Google's "Wybierz konto" list with a
second account: the Devstock live-events account, with its name and e-mail address. The montage has to blur the row
by hand. The montage control does not flag it, and the window insert (`video_inserts`, `okno-NN.mp4`) is visible on
the control sheet only as the R1 tile.

## Przyczyna źródłowa
The live-events account is still signed in in the course browser profile; removing it is Rafał's task in the profile
and has not been done. Neither skill has a step for checking the account list in the OAuth window. Only the session
memory (`profil-kursu-drugie-konto-google`) holds it, and it reached the montage because the R1 tile happened to show
the list.

## Dowody
- 2026-10-28, sesja c2261b8e-3688-4e1a-972c-5f42acc86ff9 (id claude.ai niedostępny), lesson 2.1: blur `x18 y330
  w300 h60` in paragraph 4:4, a `miejsce` entry on the card (memory `profil-kursu-drugie-konto-google`).
- 2026-10-30, sesja 8c81b3d1-cb64-4c72-97ce-98d2b72ade56 (id claude.ai niedostępny), lesson 3.1.
  - The R1 tile of control sheet 02 showed "Bartolomeo Elstyropiano, devstock.live.events@…".
  - Blur `x16 y330 w290 h60` from 12.35 to 14.35 s of paragraph 3:4, checked on tiles every 0.1 s.
  - A `miejsce` entry with `zrodlo: montaz`.

## Rozwiązanie
- In `/kurs-montaz`, for every `video_inserts` entry of the OAuth window: extract the frame of the account list
  (`klatka --zrodlo=N --czas=S`). Every account other than the course account gets a `rozmycie` for the whole time
  the list is visible, checked with tiles every 0.1 s.
- On the lesson card, a `miejsce` entry with the reminder to remove the account from the profile.
