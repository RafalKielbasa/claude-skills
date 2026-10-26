# plan-migracji-ekranu-bez-inwentarza-zachowan

- **Skill:** superpowers:writing-plans
- **Typ:** porażka
- **Status:** otwarty

## Opis
Plan migracji ekranów na nową bibliotekę opisuje nowe komponenty z listy funkcji specu i nazw starych
plików, ale nie wylicza zachowań starego ekranu. Recenzenci zadań odkrywają potem po kolei, że
zachowanie zniknęło (zgodnie z briefem) albo że brief opisuje zachowanie, którego dziś nie ma.

## Przyczyna źródłowa
Interfejsy w planie powstają z nazw komponentów i z tabeli strumieni w specu, nie z lektury starych
handlerów, warunków renderu, obserwatorów i zapytań o media. Zasada specu „zachowanie 1:1” zostaje
deklaracją bez listy kontrolnej, więc review planu nie ma czego porównać, a brak wychodzi dopiero
w review zadania jako „plan-mandated” albo jako zmiana zakresu w trakcie.

## Dowody
- 2026-10-22/23, sesja session_01UTQuE3EwUpLuJMEs83YJwD (lokalnie 362d75a8-47e4-4b51-a94a-5c747a21b5c6), plan W1 migracji Kodożerców: siedem takich znalezisk w pięciu
  zadaniach. Zniknęły: zakup DevCoinów z licznika monet (stary `SignInTopBar`), modale opinii
  i promocji kursu (`useCourseProgressModals` bez konsumenta), śledzenie sekcji ustawień przy
  przewijaniu (`IntersectionObserver` w `SettingsNav`), ukrywanie modułów, aktywności i narzędzi
  w menu na telefonie (`showOnMobileView`) oraz zakres bramki ankiety (nowa powłoka objęła nią strony
  publiczne). Brief opisywał nieistniejące zachowania: wymagany checkbox zgody w rejestracji (usunięty
  w #859) i pole „powtórz hasło”. Każde wymagało rulingu kontrolera (R15, R16, R17, R19, R20, R26)
  i rundy poprawek.
- 2026-10-22/25, sesja session_01QxjrWc65U98yvi7rPWyHoa (lokalnie bdda6800-f7c7-4172-b436-16c321621fcf), plan M1 (mobile) tej samej migracji: ten sam brak, tym razem także w **tekstach**. Plan podawał etykiety jako „skopiowane ze starych wstęg” („Promocja”, „Okres próbny”, CTA paska okresu próbnego), a stara wstęga nie miała ani nagłówka, ani przycisku (cała była polem dotyku). Brief przy logowaniu podał „Nie pamiętasz hasła?” i „Załóż konto”, stary ekran miał „Zapomniałem hasła” i „Zarejestruj się”; `ErrorScreen` miał „Powrót”. Plan nie zauważył, że przycisk wysyłki jest dziś `disabled={!isValid}`, więc wiersz bramki „pusty submit przenosi fokus” był niewykonalny. Przełącznik „pokaż hasło” siedział w starym `TextField` i zniknął razem z nim. Stary OTP nie miał „Wstecz”, a brief go dodawał. Rulingi R12, R13, R16, R18, R20, R23, R26 i decyzja Rafała D2 (zatwierdzenie nowych tekstów).

## Rozwiązanie
W planie migracji każde zadanie przepisujące ekran zaczyna się od tabeli „zachowania starego ekranu”,
zbudowanej z lektury starych plików: handlery zdarzeń, warunki renderu i bramki (sesja, dostęp,
media query), obserwatory i efekty, hooki wołane w starym layoucie, toasty i redirecty. Każdy wiersz
mapuje się na nowy komponent albo ma jawne „odpada, bo …”. Nazwy testów zadania biorą się z tej
tabeli, a review planu porównuje ją z kodem, nie ze specem.
