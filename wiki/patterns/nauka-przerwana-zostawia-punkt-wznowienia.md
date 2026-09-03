# nauka-przerwana-zostawia-punkt-wznowienia

- **Skill:** nauka-z-claude
- **Typ:** sukces
- **Status:** otwarty

## Opis
Gdy użytkownik przerwał sesję nauki na pierwszym pytaniu sprawdzającym, plik
postępu został z jednoznacznym punktem wznowienia zamiast w stanie „temat
założony, nie wiadomo, gdzie stanęliśmy".

## Przyczyna źródłowa
Brak — zachowanie pożądane. Działa dzięki kolejności zapisu: sekcja tematu
trafia do pliku postępu **od razu po zatwierdzeniu roadmapy**, przed pokazaniem
materiału i przed odpowiedzią na pytanie sprawdzające. Przerwanie w dowolnym
momencie zostawia więc trwały ślad, a notatka „Następny krok" jest aktualizowana
przy wyjściu z tematu.

## Dowody
- 2026-09-02, sesja session_019Hub3mysiz4zztWAWESMQn: po pokazaniu pierwszej
  porcji tematu „WikiSkill" i zadaniu pytania sprawdzającego użytkownik
  zrezygnował z nauki. W `nauka-z-claude.md` została sekcja ze statusem
  „w trakcie" i notatką: „porcja 1 została pokazana 2026-09-02, ale pytanie
  sprawdzające zostało bez odpowiedzi — sesja przerwana na prośbę użytkownika.
  Zacznij od ponownego zadania tego pytania, bez powtarzania porcji."

## Rozwiązanie
Utrzymać kolejność: sekcja tematu zapisywana zaraz po zatwierdzeniu roadmapy,
a notatka „Następny krok" aktualizowana przy każdym wyjściu z tematu, także
wyjściu nagłym. Punkt wznowienia ma mówić, czego **nie** powtarzać.
