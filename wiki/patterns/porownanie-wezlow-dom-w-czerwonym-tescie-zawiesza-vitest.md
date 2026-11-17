# porownanie-wezlow-dom-w-czerwonym-tescie-zawiesza-vitest

- **Skill:** superpowers:test-driven-development
- **Typ:** porażka
- **Status:** otwarty

## Opis
Test w fazie czerwonej porównuje węzły DOM (`expect(wrapper).toBe(section.parentElement)`). Gdy asercja nie przechodzi, worker Vitest wisi ponad dwie minuty i kończy się `ERR_WORKER_OUT_OF_MEMORY`; raport nie wymienia żadnego testu („Tests (16)”, „tests 0ms”), więc wygląda to na awarię środowiska, a nie na czerwony test.

## Przyczyna źródłowa
Przy nieudanej asercji runner buduje różnicę i serializuje „oczekiwane” i „otrzymane”. Węzeł jsdom ciągnie za sobą cały dokument i okno, więc serializacja zjada pamięć workera. Zielony test tego nie pokazuje, dlatego problem wychodzi właśnie w kroku RED, który ma paść.

## Dowody
- 2026-11-17, sesja d3dca57e-92f2-418a-b0e5-a28120ba9cf3 (id claude.ai niedostępny; code-busters-v2, worktree `landing-redesign`, przebudowa landingu DT-182 #1021): nowy test w `PublicLanding.test.tsx` (`expect(wrapper).toBe(section.parentElement)` przy `wrapper === null`) zawiesił dwa przebiegi: 142 s i 166 s, oba z `Worker terminated due to reaching memory limit`. Najpierw podejrzewałem atrapę `IntersectionObserver`. Po zamianie na `expect(wrapped).toEqual([false, false, true, …])` (tablica wartości logicznych) test padł w 15 s z czytelnym `AssertionError`.

## Rozwiązanie
W asercjach, które mają prawo paść, nie porównuj węzłów DOM ani obiektów z odwołaniem do dokumentu (`toBe(node)`, `toEqual(node)`). Sprowadź je do wartości prostych: `hasAttribute`, `tagName`, `textContent`, indeks albo tablica wartości logicznych. Gdy przebieg Vitest wisi bez nazwy testu i kończy się brakiem pamięci workera, najpierw szukaj asercji na węźle w ostatnio dodanym teście.
