---
name: fe-screen-gaps-2026-08-28
description: "Inwentarz 45 ekranów apps/web wobec Figmy — stan 2026-09-03: 10 zgodnych, 15 do poprawek, 9 atrap, 11 braków"
metadata: 
  node_type: memory
  type: project
  modified: 2026-09-03T10:39:05.674Z
  originSessionId: 3118f5b2-86f2-4fb0-9cbc-b994c837b92a
---

**Pełny przegląd 2026-09-03** (3 agenci: uczeń / panel / auth+apex, Figma `zVmr90NcDZkrG6siiRIuot` vs `main` 46b6b10). Artefakt z tabelą wszystkich 45 pozycji: https://claude.ai/code/artifact/12e25e04-b2b6-45b8-bc5e-89f5d92ac766

Bilans: **10 zgodnych, 15 do poprawek, 9 atrap, 11 braków.** Grupy: uczeń 18 (6/7/3/2), panel 14 (2/6/1/5), auth 5 (2/2/0/1), apex+stany globalne 8 (0/0/5/3).

- **Zgodne (nie ruszać):** stan pusty katalogu, wynik quizu, wideo przetwarzane, błąd ładowania lekcji, zakup kursu, powrót z płatności, lista kursów twórcy, banery subskrypcji, logowanie, rejestracja ucznia.
- **Atrapy (wyglądają na gotowe, kłamią):** postęp 45% (`enroll-panel.tsx:64`) + licznik „0 z N” (`progress-bar.tsx:74`), 30% w szynie (`contents.tsx:15`), `isCompleted=false` (`enroll-panel.tsx:31`), szkielet katalogu nieosiągalny bo `loading` startuje false (`course-catalog-context.tsx:69`), zaślepka quizu, landing apex, `/student`, `/lessons/:id` (JSON w `<pre>`), bramka 503, odmowa dostępu (pusty ekran + ciche przekierowanie).
- **Braki mimo gotowego API:** profil ucznia i twórcy (`/users/me` od CP-79), ranking (`/leaderboard/courses/:id[/me]`, ale `addPoints` bez wywołań), struktura kursu stan pusty, podgląd lekcji twórcy, analityka (brak też modułu w API), `/account`, menu pod avatarem, `not-found`/`error`/`loading` (zero plików w całym `app/`).
- **Rozjazdy koncepcyjne wymagające decyzji Rafała:** rejestracja twórcy = kreator dwukrokowy vs jeden formularz w Figmie (`creator-register-form.tsx:135-252`); struktura kursu = zawsze widoczne formularze dodawania vs przyciski „+ Lekcja” / „+ Dodaj sekcję” (`course-details.tsx:217`, `section-card.tsx:258`).
- **Drobne pułapki:** `alert()` zamiast toasta (`new-course-form.tsx:86`, `video-lesson-editor.tsx:43`), angielskie „Let it go!” w dropzone (`video-lesson-editor.tsx:91`), `prose-ol:list-disc` (`text-editor.tsx:193`), placeholder `moja-szkoła` odrzucany własnym regexem (`creator-register-form.tsx:220` vs `:37`), błąd OAuth nigdy nie pokazuje banera (`login.tsx:47`), „Kup kurs” w pasku płatnej treści bez `onClick` (`switch-lesson.tsx:95`), „Kontynuuj naukę” prowadzi na starą stronę lekcji (`my-courses.tsx:69`).

Obudowa (belka + menu pod avatarem) jest w Figmie od 2026-09-02, w kodzie NIE MA jej wcale — to jedna wspólna luka na wszystkich ekranach ucznia i twórcy, nie liczona per ekran. Zob. [[figma-design-system-library]] i [[app-shell-account-hub-spec]].

**2026-09-03 wieczór: pozycje z tego inwentarza mają już tickety.** Epik **#178** z CP-99 (#179, stany globalne), CP-100 (#180, katalog i strona kursu), CP-101 (#181, odtwarzacz), CP-102 (#182, struktura kursu i lista twórcy), CP-103 (#183, edytor lekcji i formularz kursu). Poza ticketami zostały tylko pozycje wymagające decyzji Rafała (rejestracja twórcy, formularze vs przyciski dodawania, kategorie) oraz te bez danych w bazie (czas trwania kursu, poziom trudności, cena sprzed obniżki, czasy lekcji). Podgląd lekcji twórcy (`448:36`) nadal bez ticketu, bo wymaga wpierw przycisku „Podgląd". Zob. [[github-issue-candidates-2026-08]].
