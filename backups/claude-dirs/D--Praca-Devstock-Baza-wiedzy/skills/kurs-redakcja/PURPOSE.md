# PURPOSE — kurs-redakcja

## Pochodzenie

Skill pojawił się 2026-08-24 commitem `ba4c109` („docs: course video pipeline"),
razem z pipeline'em wideo — jest to pierwszy commit dotykający
`.claude/skills/kurs-redakcja/SKILL.md` w historii repo (`git log --follow`).
Powód powstania `?` — nie da się go ustalić z gita: komunikaty commitów są
zbiorcze („docs: …"), a dziennik sesji `praca-z-claude.md` zaczyna się
2026-09-03, dziesięć dni później.

**Własnego specu skill nie ma.** Przeszukanie `docs/superpowers/specs/` daje dwa
trafienia i oba są późniejsze od skilla oraz traktują go jako etap już
istniejący: `2026-09-09-plan-nagrania-generator-design.md`
i `2026-09-10-kurs-uwagi-design.md`. Spec pipeline'u treści kursowych
(`2026-07-13-pipeline-tresci-kursowych-design.md`), który opisuje etapy 1a–1c
i z którego wywodzą się `kurs-lekcja`, `kurs-zadania` i `kurs-publikuj`, redakcji
nie przewiduje — skill jest więc dodatkiem do pipeline'u, a nie jego etapem
z projektu `?`.

Rola w rodzinie `kurs-*` jest natomiast jednoznaczna z treści samego pliku:
redakcja **istniejącej** treści lekcji pod zrozumiałość i naturalny język, na
wejściu komplet plików lekcji, na wyjściu bramka Rafała. Odróżnia ją od
`/kurs-uwagi` zakres: redakcja przepisuje całe pliki, `/kurs-uwagi` rusza tylko
miejsca wskazane znacznikiem.

## Adresowane wzorce

- [walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki](../../wiki/patterns/walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki.md) — Krok 5 (2026-09-07, walidacja katalogu lekcji zamiast katalogu kursu)
- [poprawka-frazy-tylko-w-scenariuszu-zostawia-artykul-i-konspekt](../../wiki/patterns/poprawka-frazy-tylko-w-scenariuszu-zostawia-artykul-i-konspekt.md) — Krok 6 (2026-09-11, propagacja na pliki zależne)
- [grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji](../../wiki/patterns/grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji.md) — Krok 5 (2026-09-11, kontrole odczytem i kotwiczenie wzorca); wzorzec zostaje w statusie `nawrót`, bo jego nawrót dotyczy `kurs-lekcja`

## Historia ewolucji

- 2026-08-24 — utworzenie skilla razem z pipeline'em wideo — powód: `?` — wynik: wprowadzona ręcznie — źródło: commit `ba4c109`
- 2026-08-25 … 2026-09-10 — sześć commitów zbiorczych dotykających `SKILL.md` (`f11f452`, `1a7b973`, `2e9f766`, `bc15c11`, `d2808a9`), wnoszących m.in. format podpisów ilustracji — powód i zakres każdej zmiany z osobna `?`, bo commity są zbiorcze i obejmują treść kursu razem ze skillem — wynik: wprowadzane ręcznie — źródło: `git log --follow -- .claude/skills/kurs-redakcja/SKILL.md`
- 2026-09-07 — krok 5: walidacja katalogu lekcji (`../../kursy/<slug>/<modul>/<lekcja>`) zamiast katalogu kursu, z dopiskiem, że błędy z innych lekcji nie wchodzą do tej bramki — powód: wzorzec `walidacja-calego-kursu-wnosi-cudze-bledy-do-bramki`; `kurs-redakcja` był pierwszym skillem rodziny, który dostał tę poprawkę — wynik: zaakceptowana przez `/evolve-skill` — źródło: `.claude/wiki/skill-impact.md`, wpis 2026-09-07 — kurs-redakcja
- 2026-09-11 — nowy krok 6 „Propagacja na pliki zależne": tabela rodzajów zmiany i ich odpowiedników, jednokierunkowość (scenariusz źródłem prawdy), tłumaczenie pisowni zamiast kopiowania stringu, obowiązkowy `grep` po starym brzmieniu z cytowaniem liczników — powód: wzorzec `poprawka-frazy-tylko-w-scenariuszu-zostawia-artykul-i-konspekt` — wynik: zaakceptowana — źródło: `.claude/wiki/skill-impact.md`, wpis 2026-09-11 — kurs-redakcja (propagacja)
- 2026-09-11 — krok 5: kontrole checklisty robi się odczytem pliku, nie `grep`-em po frazie z treści; wzorzec kotwiczy się na fragmencie bez jednoliterowego słowa i bez emoji, a przy krótkich akronimach na granicy słowa (`\bAPI\b`); „0 trafień" i „kilkanaście trafień" na pliku właśnie przeczytanym to wynik wzorca, nie fakt — powód: wzorzec `grep-po-tresciach-kursu-gubi-twarde-spacje-i-emoji`, 5 dowodów, status `nawrót (2026-09-11)`; reguła stała dotąd tylko w `kurs-lekcja` krok 4, a `kurs-redakcja` i `kurs-zadania` pominięto świadomie zasadą „jedna zmiana, jeden skill" — wynik: zaakceptowana przez `/evolve-skill`, słowem „Akceptuję" — źródło: `.claude/wiki/skill-impact.md`, wpis 2026-09-11 — kurs-redakcja (kontrole odczytem); sesja `https://claude.ai/code/session_01YVYBimtiCfF3SS1QHH4Cvi`
- 2026-09-15 — krok 7: `video/dane-do-nagrania.md` dopisany do listy plików, których zmiana wymaga przegenerowania planu nagrania — powód: ściąga jest od dziś trzecim źródłem planu (kolumna „Do wpisania" i bloki pod tabelami) i wchodzi do haszu źródeł, więc `npm run validate` zgłasza plan jako nieaktualny także po redakcji samej ściągi — wynik: wprowadzona ręcznie — źródło: sesja z 2026-09-15, `tools/course-pipeline/src/plan-nagrania.js` (`hashSources` z trzecim argumentem)
