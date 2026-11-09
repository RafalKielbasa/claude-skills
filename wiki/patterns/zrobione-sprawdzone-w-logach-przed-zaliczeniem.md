# zrobione-sprawdzone-w-logach-przed-zaliczeniem

- **Skill:** ogólny (akceptacja z użytkownikiem; superpowers:subagent-driven-development, zadanie akceptacji)
- **Typ:** sukces
- **Status:** otwarty

## Opis
W ręcznej akceptacji każde „zrobione” Rafała sprawdzam w logach i transkryptach, zanim zaliczę wiersz.
Sprawdzam nie tylko wynik, ale też to, czy zaszedł warunek testu (odstęp czasu, jednoczesność, każdy krok).
Kilka razy „zrobione” nie oznaczało, że test się odbył.

## Przyczyna źródłowa
„Zrobione” opisuje to, co użytkownik zrobił i zobaczył, a nie warunek, który test miał wywołać. Dwa testy
w jednej wiadomości kuszą, żeby zrobić jeden i zgłosić całość. Logi pokazują warunek wprost: znaczniki
czasu, zdarzenia, rekordy wysyłki.

## Dowody
- 2026-11-09, sesja session_01WryF5WMM6e7iBT7efWZwJS (lokalnie 3089ecd1-38b8-4995-a6db-28273c325475),
  akceptacja planu 1 `hub-approvals`:
  - wiersz 2 (dwie bramki „w ciągu kilku sekund”): `alerts.jsonl` pokazał bramki co 33 s, więc alerty nie
    konkurowały o głośnik; powtórka dała 6,8 s i dopiero ona coś sprawdziła;
  - wiersz 3 (dwie odpowiedzi w trakcie tury): „zrobione, hub wykonał oba zadania”, a `a16 A` nie miało
    żadnego `UserPromptSubmit`; Rafał: „Ja nie wysłałem a16 A”;
  - wiersze 5b i 6 w jednej wiadomości: „zrobione”, a w rejestrze nie było sesji w `saas app`; 5b się nie
    odbył i został zrobiony osobno;
  - przed akceptacją: projektowy `settings.json` repo sond miał stary hook z sond (czekał do 300 s na plik
    decyzji), który działałby obok nowego hooka; usunięty z kopią.

## Rozwiązanie
Po każdym „zrobione” w ręcznym teście sprawdź w logach trzy rzeczy, zanim zaliczysz wiersz: że każdy krok
się odbył, że zaszedł warunek testu (czas, kolejność, jednoczesność) i że wynik zgadza się z oczekiwanym.
Brak warunku to „nie sprawdzone”, nie „zaliczone”: powiedz to i zaproponuj powtórkę. Dwa niezależne testy
dawaj w osobnych wiadomościach albo zaznacz wprost, że to dwa osobne kroki. Przed akceptacją przejrzyj
konfigurację środowiska testowego pod kątem pozostałości po sondach.
