# pytanie-o-push-bez-nazwy-repo

- **Skill:** ogólny
- **Typ:** porażka
- **Status:** otwarty

## Opis
Pytanie o push, PR albo merge nazywa gałąź i cel (`main`), ale nie repo. W sesji, która dotyka kilku repo,
użytkownik musi dopytać, którego repo dotyczy decyzja, zanim na nią odpowie.

## Przyczyna źródłowa
Claude pisze pytanie z perspektywy bieżącego katalogu roboczego, gdzie repo jest oczywiste. Użytkownik czyta
je z perspektywy całej sesji, w której padały operacje na kilku repo. Gałąź w nazwie nie rozstrzyga, bo
gałęzie o podobnych nazwach (`feat/rafal-kielbasa/dt-37-*`, `worktree-*`) żyją w każdym z nich.

## Dowody
- 2026-10-28, sesja c0757c79-09ad-4165-ad02-a020e38adc07 (id claude.ai niedostępny). Sesja Bazy wiedzy czytała
  code-busters-v2 i code-busters-mobile, kasowała w nich worktree i zamknęła PR code-busters#1669. Po „scal
  dzień” pytanie brzmiało: „wypchnąć gałąź worktree i założyć jej osobny PR do `main` (A)”. Rafał: „Jakie
  repo?”. Odpowiedź (`devstock-org/devstock-team`) kosztowała turę, dopiero potem padło „PR i merge do main”.

## Rozwiązanie
W pytaniu o push, PR, merge, zamknięcie PR-a albo zmianę w GitHubie zawsze podawaj `owner/repo` i gałąź
(„`devstock-org/devstock-team`, gałąź `worktree-…` → `main`”), także gdy repo wydaje się oczywiste
z katalogu roboczego. W sesji wielorepo dotyczy to również raportu po fakcie (link do PR-a z pełnym `owner/repo`).
