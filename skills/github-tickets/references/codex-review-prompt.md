# Codex review prompt

Passed to `codex exec --sandbox read-only`. The sandbox is read-only because
codex reads the repository and the drafts, and writes nothing.

Write the prompt to a file and feed it on stdin from the repository root:

```bash
codex exec --sandbox read-only - < <prompt file>
```

`codex exec` reads the prompt from stdin when the argument is `-` or absent.
Passing it as an argument breaks on Windows: the text is multi-paragraph Polish
with quotes, which is the same trap that forces `--body-file` for `gh`.

There are two prompts, because a new batch and a rewrite fail in different ways.
Using the coverage prompt on a rewrite misses the only failure that matters there.

## Prompt A: a new batch from a spec

    Zrób review paczki ticketów przygotowanych do wysłania na GitHub.

    Drafty: <ścieżki do plików z treścią ticketów i epiku>
    Spec: <ścieżka do specu, z którego wynikają>
    Konwencje: docs/ticket-conventions.md

    Sprawdź dwie rzeczy i tylko te dwie.

    1. Pokrycie specu. Czy każda sekcja specu ma ticket albo jest wprost
    wymieniona w "poza zakresem" epiku? Czy któryś ticket obiecuje zachowanie,
    którego spec nie opisuje? Czy podział na tickety nie rozcina rzeczy, która
    musi wejść naraz?

    2. Zgodność ze stanem repozytorium. Dla każdej ścieżki, nazwy modułu, pliku,
    endpointu i komponentu wymienionego w treści ticketu sprawdź, czy istnieje
    w repozytorium dzisiaj. Wypisz każdy, którego nie ma, chyba że ticket mówi
    wprost, że go tworzy. Sprawdź też, czy stan zakładany w sekcji "Zanim
    zaczniesz" jest prawdziwy: czy wymieniony PR jest scalony, czy wymieniony
    wcześniejszy ticket jest zamknięty.

    Nie oceniaj stylu, długości ani tego, czy zadanie warto robić. Zwróć listę
    konkretnych uwag z numerem ticketu i cytatem fragmentu, albo napisz, że nie
    ma uwag.

## Prompt B: a rewrite of existing tickets

Use whenever the drafts replace bodies that already exist. The risk here is not
coverage, it is silent loss.

    Zrób review przepisania paczki ticketów przed wysłaniem ich na GitHub.

    Katalog: <katalog z podkatalogami old/ i new/>
    - old/ to obecne treści issues pobrane z GitHuba
    - new/ to treści po przepisaniu, które mają je zastąpić

    Powód przepisania: <jedno zdanie, plus ścieżka do reguły>. Zwolnione z reguły
    są dwie rzeczy, bo nie da się ich wyczytać z kodu: ograniczenie, którego kod
    nie wyraża (wymuszona kolejność, wyścig, pułapka środowiska), oraz kontrakt,
    który jeszcze nie istnieje.

    Sprawdź trzy rzeczy i tylko te trzy. Porównuj każdy plik z new/ z jego
    odpowiednikiem z old/.

    1. Czy przepisanie wycięło informację, której NIE da się odzyskać z kodu. To
    jest główne ryzyko. Interesują mnie zwłaszcza: wymuszone kolejności,
    ostrzeżenia o pułapkach, kształty kontraktów, wartości uzgodnione (limity,
    teksty widoczne dla użytkownika, nazwy pól odpowiedzi), decyzje o zakresie.
    Wypisz każdą taką rzecz, która była w old/ a zniknęła z new/.

    2. Czy new/ mówi o repozytorium coś nieprawdziwego. Sprawdź w kodzie ścieżki,
    nazwy modułów, endpointy i twierdzenia o dzisiejszym zachowaniu. Wypisz
    każde, które nie zgadza się ze stanem repozytorium. Twierdzenie odziedziczone
    z old/ też jest błędem, jeśli jest nieprawdziwe.

    3. Czy któryś ticket z new/ jest teraz zbyt ogólny, żeby dało się go zacząć.
    Nie chodzi o to, że jest krótszy, tylko o to, czy wykonawca wie, co ma
    osiągnąć i po czym pozna, że skończył.

    Nie oceniaj stylu ani długości. Nie proponuj przywracania rzeczy, które
    wykonawca znajdzie sam w kodzie: to jest cel tej zmiany, a nie jej wada.
    Zwróć listę uwag z numerem issue i cytatem, albo napisz, że nie ma uwag.

## What to do with the result

Go through every finding, judge it, and apply the ones you recommend. Then show
the user a table: finding, your verdict, applied or not, and why. Justify every
rejection in one sentence; a rejection with no recorded reason is worse than a
wrong acceptance, because the reasoning disappears.

**Do not rule on a finding whose fix changes the scope, raises the cost, or does
something irreversible.** Show it separately and wait for the user.

Each finding you apply is evidence: the self-check did not catch something a
second reader did. Carry it to the evidence step, and add the missing check to
`self-check.md` under "From findings".
