# Hub voice — probe report

**Index:** [.claude/projects/hub.md](../projects/hub.md)
**Spec:** [2026-10-18-hub-voice-design.md](2026-10-18-hub-voice-design.md) (§10 probes)
**Plan:** [2026-10-19-hub-voice-plan-1-probes.md](../plans/2026-10-19-hub-voice-plan-1-probes.md)

Results of Plan 1, quoted verbatim where Rafal decides on them. Probe tools live in
`C:/Users/rafal/hub-probes/voice/` (throwaway, not committed); voice probes fork only sessions of
the sandbox repository `C:/Users/rafal/hub-probes/repo`.

## Preliminary findings

- Versions (2026-10-19): `node --version` → `v24.20.0`; `claude --version` →
  `2.1.302 (Claude Code)`; `claude --help` lists `--input-format`.
- `ELEVENLABS_API_KEY` was set neither in the executing session nor in the User environment at
  the start of the plan.
- `claude-haiku-5-5` is on ElevenLabs' `prompt.llm` list (agents create API reference), which the
  research of 2026-10-17 missed; on 2026-10-19 Rafal chose `claude-haiku-5-5` instead of
  `claude-haiku-4-5` for the probes.
- Seed session `7210f405-4a57-458a-ac48-09c1f0cc2615` in the sandbox repository, created with
  `claude -p --session-id`. Its one answer came in the global answer format (`## …`,
  `### 🎯 STATUS / DECYZJA`), which is what the voice role must override (spec §8).

## Fork boundary in `-p`

Tool: `VOICE/tools/boundary.mjs`; fork of the seed session in the sandbox repository, voice
`fork-settings.json` (written fork's rules plus `Read(**/<denylist name>)`), dialog directories
under `~/.claude/hub/projects/repo/dialogs/2026-10-19-voice-boundary*`. Five attempts: write in the
repository, write in the dialog directory, Read `.env`, Read `Server.PEM`, Grep for
`VOICE_PROBE_SENTINEL`.

| Permission mode | Exit, wall time | Repo write | Dialog write | `.env` | `Server.PEM` | Grep | Sentinels in stream |
|---|---|---|---|---|---|---|---|
| none given (default) | 0, 64 s | refused | **refused** | refused | refused | allowed, `No matches found` | none |
| `acceptEdits` | 0, 54 s | refused | **refused** | refused | refused | allowed, `No matches found` | none |
| `auto` | 0, 63 s | refused | **accepted** | refused | refused | allowed, no match quoted | none |

Refusal messages, verbatim from the fork's own report (default mode):

- repository write, `.env`, `Server.PEM`: `File is in a directory that is denied by your permission settings.`
- dialog write: `Claude requested permissions to edit C:\Users\rafal\.claude\hub\projects\repo\dialogs\2026-10-19-voice-boundary\probe-dialog-write.txt which is a sensitive file.`

`permission_denials` of the `result` event list exactly the refused attempts in each mode (four in
default and `acceptEdits`, three in `auto`). No run hung: a refusal in `-p` ends the attempt rather
than waiting for an answer.

Result: the acceptance criterion of spec §8 passes only with `--permission-mode auto`. Without it,
Claude Code treats a write under `~/.claude` as a sensitive file and, with nobody to answer in
`-p`, refuses it. Probe S12 of the hub saw no such refusal for `--bg` forks, which inherited
`auto` from the account default (hub spec §6.5, open point d). The `Read` denies hold in every
mode, `Server.PEM` included, and Grep did not surface the `.env` sentinel. Later probes run the
voice fork with `--permission-mode auto`.

## Round trip and latency

Tool: `VOICE/tools/roundtrip.mjs`; fork of the planning session `c0987db9` (transcript 5.3 MB) in
`D:/Notatki/notatki`, voice role from `voice-prompt.mjs`, `--permission-mode auto`, dialog
directory `~/.claude/hub/projects/notatki/dialogs/2026-10-19-voice-roundtrip2`. Ten Polish
questions about the voice spec, each framed as `Agent głosowy przekazuje: … / Rafał (transkrypcja): …`;
questions 9 and 10 sent at once. No voice.

**Run 1 was invalid.** The fork printed an empty `result` before answering its first message, so
every answer was assigned to the next question and two messages went out while a turn was still
running. Run 2 repeated it with `--replay-user-messages` and a raw stream log. The raw sequence of
run 2, `R` = result (length, subtype), `U` = the replay of a message the probe sent:

```
R(0,success) U R(142,success) U R(281,success) U R(445,success) U R(345,success) U R(334,success) U R(381,success) U R(409,success) U R(283,success) U R(240,success) U R(103,success) U R(403,success)
```

The empty result comes before the first replay, so it belongs to no message; `fork.mjs` now accepts
a result only after the replay of its own message. It did not occur in three debug forks
(seed session, this session with a short first message, this session with the voice role), so its
trigger is not identified; the correlation makes it harmless.

Run 2 summary, verbatim:

```
"readyMs": 32615, "medianMs": 5958, "maxMs": 23563, "speakable": "10/10",
"nineEndedBeforeTenStarted": true, "answer7HasDiacritics": true,
"answer8HasDecisionPrefix": true, "exitCode": 0
```

| # | ms | Answer (shortened where marked …) |
|---|---|---|
| intro | 28150 (from spawn) | Jestem głosowym rozmówcą sesji c0987db9 z projektu notatki: znam jej historię, czyli spec i sondy części hub-voice, i czekam na Twoje pytanie. |
| 1 | 4298 | Rozmowę głosową uruchamiasz komendą slash talk, którą wpisujesz w dowolnej sesji. … |
| 7 | 4035 | Zażółć gęślą jaźń. Sondy przewidują około trzynastu minut głosu: … |
| 8 | 5958 | Decyzja do potwierdzenia: raport sond zostaje pod obecną nazwą, czyli data dziewiętnasty października dwa tysiące dwadzieścia sześć, potem hub-voice i probes, zgodnie z konwencją projekt-część z indeksu projektów. Potwierdzasz to brzmienie? |
| 9 | 11467 | Zapisałem decyzję o nazwie raportu sond do pliku decyzji, razem z uzasadnieniem i Twoim potwierdzeniem. |
| 10 | 23563 | W tej rozmowie odpowiedziałem na każde Twoje pytanie, więc nie zakładam pliku pytań otwartych. … |

Answers 2–6 (4.6–7.3 s) were plain spoken Polish of three or four sentences each. The decision as
read back (answer 8) and as written into `decisions.md` match: the file quotes the read-back
sentence verbatim and Rafal's transcribed confirmation „Tak, potwierdzam.”; its body is English
Markdown, which is fine for a file Rafal reads as text.

Result: passes. Fork start to first answer about 28–33 s on a 5.3 MB session (SessionStart hooks
alone about 11 s); a typical answer about 4–7 s; a turn that writes a file or looks around 11–24 s.
In run 1, without the voice role reaching the first turn correctly, one answer carried bullets; with
the role in place every answer was speakable.

## End and wake-up

Rafal opened a new Claude Code session in VS Code on `C:/Users/rafal/hub-probes/repo` and typed
`/sid-probe` (2026-10-20, 14:40:06 UTC). The skill runs `fake-bridge.mjs` in the background: a
voice fork of that session, two confirmed decisions (CSV and a work order), the real end path
after 60 s, and the closing report on standard output.

- **(a) The session id.** The skill body reached the model with the substitution done: `--session
  73133a74-a2f4-4238-b1ea-dc58ae8c0187` in place of `${CLAUDE_SESSION_ID}`, and the Bash call ran
  exactly that line with `run_in_background: true`.
- **(b)** The same id names the session's transcript,
  `~/.claude/projects/C--Users-rafal-hub-probes-repo/73133a74-a2f4-4238-b1ea-dc58ae8c0187.jsonl`.
- **(c) The fork knows the launch.** Its first answer (3.9 s), verbatim: „Tuż przed moim
  uruchomieniem sesja źródłowa wykonała skill sid-probe i odpaliła w tle zastępczy most głosowy,
  czyli skrypt fake-bridge na sześćdziesiąt sekund, po czym zakończyła turę bez dalszej pracy.”
  The source session had ended its turn („Most sondy działa w tle.”, 14:40:13) before the fork
  read the history.
- **(d) Wake-up.** The task notification arrived at 14:41:28, 76 s after the launch. The session
  woke by itself, read the report from the task's output file (`Read` on its `tasks/*.output`,
  not on `~/.claude/hub/`), showed the two decisions as a Polish table, and carried out the work
  order.
- **(e) The work order.** The report's `prompt.md` holds only the confirmed decisions (CSV; append
  one line, no commit) under the five template sections. `git -C C:/Users/rafal/hub-probes/repo
  diff` afterwards shows exactly `+Wybrany format: CSV.` at the end of `PLAN.md`. Nothing came
  from the fork, and the session did not commit.

Fork turns: 3.9 s, 8.1 s (decision read-back), 10.8 s (write), 3.3 s (work order read-back),
9.5 s (write), 13.7 s (end message, `prompt.md` written).

Result: passes. `${CLAUDE_SESSION_ID}` in a skill body is the way for `/talk` to learn session
X's id; the registry fallback is not needed.

## Polish without the fork

Agent `hub-voice-probe` (`agent_8901m5am01ghej0ryhp9k58fvwej`), created through the API with
`language: pl`, `llm: claude-haiku-5-5`, `asr: scribe_realtime`, `ttsModel: eleven_v4_turbo`,
default voice `cjVigY5qzO86Huf0OWal`, `retentionDays: 0`, no tools. The first key Rafal made was
refused: `401 … "The API key you used is missing the permission convai_write to execute this
operation."`; it worked after he granted Agents write access.

Rafal talked to the agent in the ElevenLabs dashboard for 180 s
(`conv_3701m5am6h0pfcx9gmhvxe39wmr1`, deleted afterwards: `GET` → `404`). His speech as
transcribed, verbatim:

- 31 s: „Jakie udało mi się wprowadzić, yy, pull requesty? Yy, co zrobiłem z deploymentem? Yy, czy
  cash po stronie frontendu jest dobrym rozwiązaniem?”
- 100 s: „Tempo zmian jest gigantyczne. Czuję się przytłoczony takim, z-- takim tempem zmian.”

Recognition: „pull requesty”, „deploymentem”, „frontendu” right; „cache” came out as „cash”.

Agent behaviour, from the transcript:

- without a tool it said „Dobrze, przekażę to Claude. Chwilę poczekaj.” and then fell silent;
- it mixed „pan” and „ty”;
- it asked „Jest pan tam?” four times in three minutes, after about 10 s of silence.

Its answers carry `eleven_v4_turbo` expression tags (`[slow]`, `[excited]`) in the transcript.

**Rafal's verdict, 2026-10-19:** variant A of „Werdykt: polski w ElevenLabs”, „Przechodzi: głos
naturalny, rozpoznawanie wystarczające. Idziemy dalej z ElevenLabs.”

He also chose three agent corrections, applied before the next probe (`sync-config`; checked:
`turnTimeout: 20`, `promptHasTy: true`):

- the prompt asks for „ty”;
- the prompt forbids claiming to pass something to Claude without calling `ask_claude`;
- `turn_timeout` is 20 s.

Minutes: 3.00 of about 13.

## Vendored client

`@elevenlabs/client` latest is `1.28.0` (npm `time.modified` 2026-10-13; dependencies
`livekit-client ^2.21.0`, `@elevenlabs/types 0.25.0`).

- The esm.sh bundle is not self-contained: the entry is a stub
  (`import "/node/process.mjs"; export * from "/@elevenlabs/client@1.28.0/es2022/client.bundle.mjs";`),
  and the polyfill imports `/node/events.mjs` and `/node/tty.mjs`.
- The package itself ships `dist/lib.iife.js` (its `unpkg` export): 1,096,846 bytes,
  `var ElevenLabsClient = (function(exports) { … })`, no `import`, and the only service URL in it is
  `https://api.elevenlabs.io`. Audio worklets are inlined (blob or `data:` URLs), except one: the
  client loads `https://cdn.jsdelivr.net/npm/@alexanderolsen/libsamplerate-js@2.1.2/dist/libsamplerate.worklet.js`
  when resampling is needed, unless `libsampleratePath` is given.
- Vendored in `VOICE/web/vendor/` (`VERSION.txt`), both MIT:

```
cfccb4799627b4966153ada964744d31fce3aa6d0e343e5931d3ab5ed1f30b79 *elevenlabs-client.iife.js
ca6e162f194d3ee5a2d2cd3c3b49641d31e56845aeae507feca1cdf8aa8116cb *libsamplerate.worklet.js
```

- `startSession` options in 1.28.0 (from the package's `.d.ts`): `conversationToken`, `signedUrl`,
  `connectionType` (`"webrtc"` | `"websocket"`), `clientTools`, `onConnect({ conversationId })`,
  `onMessage({ message, role: "user" | "agent", source /* deprecated */, event_id, response_id })`,
  `onDisconnect`, `onError(message, context)`, `onModeChange`, `onStatusChange`,
  `libsampleratePath`, `workletPaths`, `overrides`, `textOnly`; `endSession()`, `getId()`.

Deviation from spec §4 wording ("an ES module"): the self-contained build is an IIFE loaded by a
classic script tag, and a second vendored file (the libsamplerate worklet) keeps the client off
the CDN. No build tooling was needed.

**Voiceless harness** (`bridge-smoke.mjs`, real fork of the seed session through the probe bridge,
stub ElevenLabs), verbatim:

```
"askMs": 24914,
"answer": "Pierwszy otwarty wybór w planie to format pliku eksportu: CSV albo JSON. Pozostałe dwa dotyczą miejsca przycisku i domyślnej nazwy pliku.",
"speakable": { "ok": true, "hits": [] },
"noTokenStatus": 403,
"foreignHostStatus": 403,
"report": "TALK CLOSING REPORT\ndialog: …/2026-10-19-voice-smoke\ndeletion: no conversation id\n--- decisions.md ---\n(not written)\n…END OF REPORT\n"
```

The first ask includes the fork's start (it queues behind the start prompt). Probe suite:
`node --test` → 29/29 pass.

## Haiku and Sonnet

Agent with `ask_claude` (`tool_9901m5an60rffxbryj877vay4gqc`), corrections of the Polish probe
applied. Probe bridge on a fork of the seed session, dialog `…/2026-10-19-voice-haiku`.

**Run A, Haiku 5.5** (`conv_6901m5anbrcqe45b676qh88aravw`, 601 s, deleted: report
`deletion: deleted`). Rafal covered script steps 1 and 2; after 20:09:03 there was no speech.

- **Read-back fidelity.** Spoken: „Decyzja do potwierdzenia: eksport listy lektur zapisuje plik w
  formacie CSV, a JSON nie wchodzi do pierwszej wersji.” `decisions.md`: „**Decyzja:** eksport
  listy lektur zapisuje plik w formacie CSV, a JSON nie wchodzi do pierwszej wersji.” Verbatim.
  Written only after Rafal's „Tak.”, with the source „Potwierdzone głosowo przez Rafała („Tak”)”.
- **Asks** (bridge log): 55.0 s (first, includes the fork's start), 23.7 s, 28.3 s (the „Tak.” that
  wrote the decision), 9.5 s, 12.7 s. `transcriptLate` false for all five.
- **Recognition:** „PLAN.md” came out as „Plan MD” and „plan MDA”; Claude understood both.
- **Interruption during a wait.** Rafal spoke while the agent waited for step 2. The agent then
  said: „Poprzednie zapytanie o cały plan MDA zostało przerwane, więc Claude nie odpowiedział.”
  The bridge log shows the fork did answer that ask (9.5 s), so ElevenLabs dropped the tool result
  once the user interrupted. The agent asked again („Ponówmy”) and the fork answered the same
  question a second time (12.7 s).
- **Silence.** From 20:09:42 to 20:14:01 the agent spoke into silence every 20–25 s („Jesteś
  tam?”, „Kończę rozmowę”, „Do usłyszenia”, ten times). It cannot end the call itself: no
  end-call tool and no silence timeout. The call ran to 601 s, which looks like ElevenLabs' default
  maximum duration. One `[sad]` expression tag in the transcript.
- The work order, step 3 (toolbar) and step 4 (the correction) were not reached in run A.

Minutes after run A: 13.02 of the Free plan's 15 (polish 180 s, haiku 601 s). Run B (Sonnet) and
the end-to-end probe do not fit; the plan stopped here for Rafal's decision.

Rafal's decisions, 2026-10-19 (variant A of each):

- „Minuty głosu po rozmowie A”: a paid ElevenLabs plan (Starter), so run B and the end-to-end
  probe run in full.
- „Rozłączanie przy ciszy”: the agent gets the built-in `end_call` tool
  (`built_in_tools.end_call`, `params.system_tool_type: "end_call"`) and
  `turn.silence_end_call_timeout: 30`. Applied and checked: `silenceEnd: 30`,
  `endCall: "end_call"`. The API reference confirms `conversation.max_duration_seconds` defaults
  to 600, which explains the 601 s.
- „Dlaczego rozmowa urwała się po kroku 2”: Rafal judged it enough or stepped away; no audio
  problem.

**Run B, Sonnet 5.5** (`conv_2801m5at992zff9axh057m8tb1xs`, 464 s, deleted: `deletion: deleted`),
full script, with `end_call` and the 30 s silence limit.

- **Read-back fidelity, all three decisions verbatim.** Spoken and written (`**Brzmienie
  potwierdzone:**`) match word for word:
  - „format eksportu listy lektur to CSV, bo plik ma być czytelny w arkuszu kalkulacyjnym, a lista jest płaska”;
  - „przycisk eksportu listy lektur trafia na pasek narzędzi, żeby był widoczny bez otwierania menu, z zastrzeżeniem, że przy zatłoczonym pasku można go później przenieść”;
  - „domyślna nazwa pliku eksportu nie zawiera daty, czyli jest stała, na przykład lista lektur, a użytkownik w razie potrzeby zmienia ją sam w oknie zapisu”.
- **Correction.** Rafal said „nazwa z datą”, then „A nie, jednak nie, bez daty.” before any
  read-back; only the corrected wording was read back and written. The file records the course
  („pierwotne wskazanie unieważnione na jego prośbę”).
- **An ambiguous „Tak.”** right after the fork laid out two options was not forwarded as a
  confirmation; the agent asked what Rafal confirms.
- **Asks:** 56.1 s (first, with the fork's start), 15.1, 56.9 (the „Tak” that wrote the first
  decision), 18.8, 14.5, 28.6 (a „Tak”), 24.3, 31.3, 40.2 (a „Tak”). A confirmation costs 28–57 s,
  because the fork writes the file before answering.
- **End during a pending write.** Rafal said „Kończymy.” 12 s after his last „Tak.”, while that
  ask was still running (40.2 s). The agent ended with „ostatniego potwierdzenia nazwy bez daty
  mogło nie dojść do zapisu”, yet `decisions.md` holds the third decision (file time 21:37:50):
  the interruption dropped the tool result on ElevenLabs' side, as in run A, not the write.
- **Ending.** After „Do usłyszenia” the call ended without Rafal's button (464 s total), and the
  bridge produced the report 56 s later (the fork's end turn).
- The interruption over the wait filler (step 2) was not exercised in run B.

Minutes after run B: 20.75 (Starter plan).

**Run A2, Haiku 5.5 top-up** (`conv_2801m5ax7j0ff43bjcy458rzqxdm`, 216 s, deleted), script steps
3–4 plus an interruption; the first bridge of this run opened no visible tab and was stopped with
`taskkill` (its fork too), the second was opened with `Start-Process`.

- **Read-back fidelity, all three decisions verbatim** (spoken against `**Treść:**` in the file):
  - „przycisk eksportu listy lektur trafia na pasek narzędzi, nie do menu”;
  - „lista lektur eksportuje się do pliku w formacie CSV, nie JSON”;
  - „domyślna nazwa eksportowanego pliku nie zawiera daty”.
- **Correction.** Read-back „…zawiera datę eksportu”, Rafal: „Nie, bez daty.”, read-back of the
  corrected wording, „Tak.”; only the corrected decision was written, with the correction noted.
- **Interruption during a write.** After „Tak.” Rafal said „Pierwsze potrwa.” while the ask ran;
  the agent answered „Dobrze, poczekam, aż pierwsza odpowiedź się skończy.” and never reported the
  write. Rafal had to ask again; the fork replied „Decyzja o pasku narzędzi jest już zapisana”.
  Third occurrence (A, B, A2): an interruption drops the pending tool result on ElevenLabs' side.
- **Asks:** 5.6 s (the fork had started before Rafal spoke), 16.8 (a „Tak”), 6.2, 7.0, 15.9 (a
  „Tak”), 3.5, 4.7, 18.0 (a „Tak”). Writes 16–18 s here against 28–57 s in run B with the same
  fork model; answers without a write 3.5–7 s.
- **Ending.** „Kończymy.” after the last write was reported; the agent said goodbye and the call
  ended (216 s).
- Expression tags appear as `[Neutral]` in the transcript.

Minutes after run A2: 24.35.

**Rafal's choice, 2026-10-19:** variant A of „Model agenta ElevenLabs”, Haiku 5.5. Fidelity and
the correction behaved the same on both models, latency comes from the fork, and Haiku costs
less. The agent stays on `claude-haiku-5-5`.

## End to end

Sandbox skill `talk-probe` (a probe-grade `/talk`), run by Rafal in a new VS Code session on the
sandbox repository (2026-10-20, 14:51:43 UTC). The skill body reached the model as `--session
e983708b-1824-4825-96e8-a6330ebb9606` (the `${CLAUDE_SESSION_ID}` substitution), and the session
started the bridge through `with-key.sh` with `run_in_background: true`. Agent on Haiku 5.5 with
`end_call` and the 30 s silence limit. Conversation `conv_8901m5cwz5e4f4k9jda0wtaw65gd`, 152 s.

- **Conversation.** One decision and one work order, each read back and confirmed:
  - „Decyzja do potwierdzenia: eksport listy lektur zapisuje plik w formacie CSV, a nie JSON.”;
  - „…sesja źródłowa dopisuje na końcu pliku PLAN.md informację, że wybrany format eksportu listy
    lektur to CSV, nie zmienia nic poza tym plikiem i niczego nie commituje…”.

  „Kończymy.” ended the call with no button. Recognition turned „sesji” into „Cecii”; the fork
  read it as „sesji” and wrote so in the decision's source.
- **Asks:** 6.7 s, 7.0 s (write), 4.2 s, 8.4 s (write).
- **Files.** `decisions.md` holds both confirmed wordings. `prompt.md` holds only them, under
  **Cel**, **Kontekst**, **Decyzje z uzasadnieniem**, **Ograniczenia**, **Oczekiwany rezultat**.
  `open-questions.md` lists the two choices left open. `transcript.md` is written.
- **Deletion.** The report says `deletion: deleted`; `conversations.mjs get
  conv_8901m5cwz5e4f4k9jda0wtaw65gd` → `404`; the agent lists no conversation.
- **Wake-up and the work order.** The task notification reached session X at 14:58:40. X read
  the report from the task's output file, showed decisions and open questions as Polish tables,
  and appended the line. `git diff` of the sandbox afterwards:

  ```
  +
  +Wybrany format pliku eksportu listy lektur: CSV (rozmowa głosowa 2026-10-20).
  ```

  X reported the blank line as its own deviation („Bez niej Markdown dokleiłby nowy tekst do
  punktu 3 listy”). No commit (`git log` unchanged); nothing from the fork in the repository.

Result: passes. Rafal reported „e2e gotowe” about 20 s after the wake-up, while X was still
working; the edit landed at 14:58:58.

## Minutes ledger

| Probe | Conversation | Seconds |
|---|---|---|
| Polish without the fork | `conv_3701m5am6h0pfcx9gmhvxe39wmr1` | 180 |
| Haiku run A | `conv_6901m5anbrcqe45b676qh88aravw` | 601 |
| Sonnet run B | `conv_2801m5at992zff9axh057m8tb1xs` | 464 |
| Haiku run A2 | `conv_2801m5ax7j0ff43bjcy458rzqxdm` | 216 |
| End to end | `conv_8901m5cwz5e4f4k9jda0wtaw65gd` | 152 |
| **Total** | | **1613 s = 26.88 min** |

## Conclusions for Plan 2

All six probes of spec §10 passed, with the limits named in „Final review” below. The fork's
permission boundary in `auto` mode does **not** hold the way this section first claimed: see C1
there before Plan 2.

| Area | Verified mechanism | Evidence |
|---|---|---|
| Session id | `${CLAUDE_SESSION_ID}` in the skill body is substituted before the model sees it and equals the transcript name; no registry fallback | End and wake-up (a), (b); End to end |
| Voice fork command | `claude -p --resume <X> --fork-session --permission-mode auto --input-format stream-json --output-format stream-json --verbose --replay-user-messages --settings <dialog>/fork-settings.json --add-dir <dialog>` (spec §8 amended 2026-10-19) | Fork boundary; Round trip |
| Fork settings | the written fork's rules plus `Read(**/<denylist name>)`; the repository write and both secret reads refused in every mode; the dialog write under `~/.claude` passes only in `auto`, where the classifier, not the settings file, decides about every other tool (C1) | Fork boundary; Final review |
| Turn correlation | a result belongs to a message only after that message's replay; one fork printed an empty result first | Round trip, run 1 and raw sequence of run 2 |
| Voice role | spoken Polish with no Markdown in 10/10 answers; decisions prefixed and written only after Rafal's words confirm them; the work order read back and confirmed; `prompt.md` only from confirmed items | Round trip; Haiku and Sonnet; End and wake-up; End to end |
| Wake-up | a background `Bash` task wakes session X when the bridge exits; X reads the closing report from the task's output file with no permission prompt and carries out the order | End and wake-up (d), (e); End to end |
| Browser client | `@elevenlabs/client` 1.28.0 `dist/lib.iife.js` and the `libsamplerate` worklet, vendored with hashes; option names listed above | Vendored client |
| Agent | Haiku 5.5 (Rafal's choice), Polish, `scribe_realtime`, `eleven_v4_turbo`, `retention_days` 0, `ask_claude` (120 s, pre-tool speech, interruptions allowed), the prompt's „ty” and no claimed forwarding, `turn_timeout` 20, `end_call`, `silence_end_call_timeout` 30 | Polish without the fork; Haiku and Sonnet |
| Retention | the bridge deletes each conversation at its end; `GET` afterwards → `404`; a dashboard test is deleted by `purge` | all voice probes |
| Bridge security | requests without the token or with a foreign `Host` → `403` | Vendored client (harness); `auth.test.mjs` |

Numbers that shape the design:

- the fork's start to its introduction: 28.2 s on a 5.3 MB session (SessionStart hooks about
  11 s), 16–41 s on the sandbox seed; with `--restricted` (no user hooks) the whole boundary
  probe took 17–23 s instead of 54–64 s;
- the first real question after the introduction: up to 55 s in run A, spent on four turns in
  which the fork read the git snapshot, not on its start;
- an answer without a write: 3.5–7 s (round trip, A2), 9.5–24 s (A, B);
- a confirmed decision with its write: 7–57 s; in the 56.9 s write turn of run B only 13.2 s were
  model API time, so most of it is spent outside the model (inherited hooks per tool call are
  the likely cause; not measured);
- the fork runs on the source session's model: `claude-fable-5-1` for the sandbox seed,
  `claude-opus-5-5` for the end-to-end session;
- voice minutes: 26.88, on the Starter plan.

Findings Plan 2 must answer (none blocks it):

1. **An interruption drops the pending tool result** (3 of 3 conversations). Talking while
   `ask_claude` waits makes ElevenLabs discard the answer. The fork's work is not lost (the
   decisions were written), but the agent does not hear about it and asks again. Plan 2 needs a
   decision: keep interruptions and push the late answer back into the conversation (for example
   `sendContextualUpdate`), or block interruptions during the tool call
   (`interruption_mode: disable_during_tool`).
2. **The first question waits for the fork's orientation.** The bridge starts the fork at once,
   but the fork reads the snapshot on its first real question. The introduction turn could read
   it instead, and the page could show when Claude is ready.
3. **A tab may not show up.** Once, `cmd /c start` opened no visible tab. The bridge now stores
   its URL in a local file and the skill can reopen it with `Start-Process`.
4. **Recognition slips on project words:** „cache” → „cash”, „PLAN.md” → „Plan MD”, „sesji” →
   „Cecii”. Claude read all of them right from context. ElevenLabs' ASR `keywords` could carry
   project vocabulary.
5. **Writes are slow and uneven** (7–57 s for one confirmed decision). Model time explains only
   part of it; measure the hooks' share before redesigning the write.
6. **The page keeps polling after the end.** A finished tab polls `/api/decisions` after the
   bridge exits; harmless, but Plan 2 should stop the polling (`talk.mjs`, last line).

Deviations from the spec's wording, for Rafal to approve as spec amendments:

- §4 (browser client): an IIFE build plus the vendored `libsamplerate` worklet instead of „an ES
  module”;
- §7 (agent): `end_call`, `silence_end_call_timeout` 30, `turn_timeout` 20, the prompt's „ty” and
  no claimed forwarding, Haiku 5.5;
- §10 (probes): the minute budget was exceeded (26.88 against about 13); the plan moved to the
  Starter plan on Rafal's decision.

## Final review (2026-10-20)

A fresh reviewer (subagent on Opus) read the plan, spec, report, raw data and probe code; the
probe suite was 31/31. One Critical and four Important findings, re-checked by the executor:

**C1. In `auto` the settings file is not the boundary.** The `init` line of the `auto` fork
(`boundary-auto.jsonl`) lists 54 tools, among them `mcp__claude_ai_Google_Calendar__create_event`
and `__delete_event`, `mcp__claude_ai_Google_Sheets__update_values`, `SendMessage`,
`RemoteTrigger`, `CronCreate`, `Workflow`, `Artifact` and `WebFetch`. The voice settings deny only
`Edit(./**)`, `Bash`, `EnterWorktree` and the secret reads, so in `auto` the classifier decides
about all the rest. The §14 row „the boundary still comes from the settings file” was wrong.

Re-probe with `--restricted --tools Read,Grep,Glob,Edit,Write --strict-mcp-config`
(`boundary.mjs --restricted`, seed fork, attempts 1–5 plus a write to
`C:/Users/rafal/hub-probes/outside-probe.txt` and `WebFetch`):

| Variant | Tools in `init` | Repo write | Dialog write | Outside write | `WebFetch` | Secrets |
|---|---|---|---|---|---|---|
| restricted, `default`, dialog under `~/.claude` | Edit, Glob, Grep, Read, Write | refused | **refused** („…which is a sensitive file”) | refused | gone | refused |
| restricted, `auto`, dialog under `~/.claude` | the same five | refused | **refused** (the same) | refused | gone | refused |
| restricted, `default`, dialog outside `~/.claude`, allow rule `//C:/…` | the same five | refused | **refused** („…you haven't granted it yet”) | refused | gone | refused |
| restricted, `default`, dialog outside `~/.claude`, allow rule `//c/…` | the same five | — | **accepted** | — | — | — |
| restricted, `default` and `auto`, dialog under `~/.claude`, allow rule `//c/…` | the same five | — | **refused** („…sensitive file”) | — | — | — |

The outside write was refused with: `C:\Users\rafal\hub-probes\outside-probe.txt is outside
C:\Users\rafal\hub-probes\repo, C:\Users\rafal\.claude\hub\projects\repo\dialogs\…; --restricted
confines the file tools to the working directory.`

Conclusions:

- On Windows a permission path must be written `//c/Users/…`. The form `//C:/Users/…`, used by
  the hub's `forkSettings` (`~/.claude/skills/hub/lib/dialog.mjs`) and by the voice settings,
  matches nothing. The written dialog forks have so far written through the `auto` classifier,
  not through their allow rule. This is a finding for `hub-core` too.
- A write under `~/.claude` is a sensitive file for Claude Code; only the `auto` classifier lets
  it through, and only without `--restricted`.
- A hard boundary that needs no classifier is possible: `--restricted` with the five file tools,
  no MCP, `default` mode, a `//c/…` allow rule, and the dialog directory outside `~/.claude`.
  That moves voice dialogs out of the hub's data directory: Rafal's decision.

**Rafal's decision, 2026-10-20:** variant A of „Granica forka głosowego”: voice dialogs outside
`~/.claude` (`C:\Users\rafal\hub-data\projects\<project>\dialogs\`), the fork restricted to the five
file tools, no MCP, `default` mode, a `//c/…` allow rule. Recorded in spec §3, §4, §8 and §15.

**I1. The bridge's end could hang or crash** (no deadline on the fork's close, a thrown deletion
error, no end without a first heartbeat). Fixed in the probe code with four tests RED→GREEN, and
the fork no longer inherits `ELEVENLABS_API_KEY`: the session restarted after Rafal set the key,
and its forks would have carried it, which spec §3 forbids. Suite 36/36.

**I2. Numbers.** Corrected above, against the raw logs: the start, the first question, the write
turns, the fork's model.

**I3. End paths not run live.** The lost heartbeat ran only against `fake-claude` and the 60 s
timer of `fake-bridge.mjs`. The end-to-end probe ended by `end_call` (agent hang-up), not by the
button. No run ended by a closed tab. Plan 2's acceptance has to cover the button and a closed
tab.

**I4. The `~/.claude` repository on the allowlist.** With cwd `~/.claude`, `Edit(./**)` covers
`~/.claude/hub/…`, so the dialog write would be denied. This is the reviewer's inference, not
probed. It disappears if dialogs leave `~/.claude`.

Minor findings, deferred to Plan 2:

- drop results with `num_turns` 0: the empty first result recurred in the end-to-end run;
- decode request bodies as UTF-8 streams;
- a page reload overwrites `conversationId`;
- the bridge still accepts asks while ending;
- `Server.PEM` was refused only through `Read`;
- the page keeps polling after the end;
- the URL file with the token stays in `data/`.

## Interruption with a contextual update (Plan 2, Task 1)

Spec §16. The probe page (`web/talk.mjs`) was taught to resend an answer whose ask was interrupted:
`onInterruption` marks the pending ask, and when the bridge's answer arrives for a marked ask the
page calls `sendContextualUpdate("Odpowiedź Claude na pytanie „…”, której nie usłyszałeś: …")` and
writes a `Notatka` line. Probe agent `hub-voice-probe` (Haiku 5.5), tool `ask_claude` with
`interruption_mode: allow` (read from the API before the run), sandbox seed `7210f405`.

### Run 1 (2026-10-20 20:20, 34 s of voice)

`transcript.md`, verbatim:

```
- 20:20:18 **Agent**: Cześć, słucham.
- 20:20:26 **Rafał**: Przejdź cały plan MD i powiedz, który wybór jest najtrudniejszy i dlaczego.
- 20:20:26 **Agent**: Dobrze, sprawdzę to u Claude'a. Chwilę to zajmie.
- 20:20:31 **Notatka**: interruption during ask
- 20:20:33 **Rafał**: A ile to potrwa?
- 20:20:34 **Agent**: Odpowiedź może zająć do dwóch minut. Poprzednie zapytanie zostało przerwane, więc ponawiam je teraz.
```

`asks-interrupt.jsonl`, verbatim:

```
{"at":"2026-10-20T18:20:43.613Z","ms":16741,"request":"Przejdź cały plan MD i powiedz, który wybór jest najtrudniejszy i dlaczego.","transcriptLate":false,"timedOut":false}
{"at":"2026-10-20T18:20:57.309Z","ms":22427,"request":"Przejdź cały plan MD i powiedz, który wybór jest najtrudniejszy i dlaczego.","transcriptLate":false,"timedOut":false}
```

The fork's session file (`ed8a273c`) gives the order:

| Time (UTC) | Event |
|---|---|
| 18:20:26.9 | ask 1 written to the fork |
| 18:20:31 | interruption while ask 1 is pending (`Notatka`) |
| 18:20:34.9 | the agent calls `ask_claude` again with the same request (ask 2); the fork driver queues it behind ask 1 |
| 18:20:43.6 | ask 1 answered („Najtrudniejszy jest wybór formatu pliku, bo…”); the page sends no contextual update |
| 18:20:43.6 | ask 2 written to the fork |
| ≈18:20:49 | the conversation ends (34 s); nothing more is heard |
| 18:20:57.3 | ask 2 answered: „Jeśli pytasz o samą analizę planu, to już ją zrobiłem i wynik masz w poprzedniej odpowiedzi…” |
| 18:20:57.3 | end message; nothing written; conversation `conv_0601m5d8nhhtewh9w9qawzhy0yfw` deleted |

**Verdict: not passed, and `sendContextualUpdate` was never exercised.** The pass criteria fail:
no `contextual update sent` line, Rafal never heard the answer, two asks instead of one. Cause,
from the order above:

1. **Haiku 5.5 re-issues the tool call itself** after an interruption („Poprzednie zapytanie
   zostało przerwane, więc ponawiam je teraz.”). Plan 1's runs did not show this.
2. **The page's single flag was reset by the re-issued call.** `askClaude` for ask 2 set
   `interruptedDuringAsk = false` before ask 1 returned, so ask 1's answer was dropped without a
   resend. A defect of the probe page, not of the SDK call.
3. **The bridge sent the duplicate to the fork as a new turn.** The fork, believing its first
   answer was heard, answered the duplicate with „już ją zrobiłem”, 22 s later.

Ask 1's latency (16.7 s for reading `PLAN.md`) matches Plan 1.

### Fix between the runs

- The bridge joins an ask whose request equals one in flight: the repeat awaits the same answer,
  the fork gets one turn, and the asks log marks the repeat `"joined": true`. Test RED→GREEN
  („an ask identical to one in flight joins it: one fork turn, the same answer for both”), suite
  37/37.
- The page keeps a mark per ask. An interrupted ask's answer is resent with `sendContextualUpdate`
  only when no other ask is pending and the same request was not already answered by an
  uninterrupted call; otherwise the page writes the note „interrupted answer not resent (another ask
  delivers it)”.

### Run 2 (2026-10-20 20:51, 49 s of voice)

`transcript.md`, verbatim:

```
- 20:51:46 **Agent**: Cześć, słucham.
- 20:51:55 **Rafał**: Przejrzyj cały plan i powiedz, który wybór jest najtrudniejszy i dlaczego.
- 20:51:56 **Agent**: Chwila, przekazuję to pytanie do Claude'a, zaraz wracam z odpowiedzią.
- 20:52:00 **Notatka**: interruption during ask
- 20:52:03 **Rafał**: A ile to potrwa?
- 20:52:04 **Agent**: Odpowiedź może zająć do dwóch minut. Ponawiam pytanie do Claude'a.
- 20:52:08 **Notatka**: interrupted answer not resent (another ask delivers it)
- 20:52:10 **Agent**: Claude odpowiedział. Przejrzał plan i zauważył, że w repozytorium jest już zapisane, że format pliku to CSV. Według niego najtrudniejszy wybór to właśnie format. Jest on dla odbiorców najbardziej wiążący i trudno go potem cofnąć. CSV gubi strukturę przy zagnieżdżonych danych, na przykład listy autorów. Miejsce przycisku jest trudniejsze niż nazwa pliku, ale plan nie mówi, jak często użytkownicy eksportują. Nazwa pliku z datą jest prawie oczywista, bo chroni przed nadpisaniem.
- 20:52:27 **Rafał**: Kończymy.
- 20:52:27 **Agent**: Dobrze, kończymy. Do usłyszenia, powodzenia z planem.
- 20:52:32 **Rafał**: Na razie.
- 20:52:32 **Agent**: Na razie. Do usłyszenia.
```

`asks-interrupt.jsonl`, verbatim:

```
{"at":"2026-10-20T18:52:08.476Z","ms":12133,"request":"Przejrzyj cały plan i powiedz, który wybór jest najtrudniejszy i dlaczego.","transcriptLate":false,"timedOut":false}
{"at":"2026-10-20T18:52:08.477Z","ms":4271,"request":"Przejrzyj cały plan i powiedz, który wybór jest najtrudniejszy i dlaczego.","joined":true}
```

The fork's raw log holds three user turns: the start, the question (one turn, `num_turns` 3) and the
end message. Closing report: `deletion: deleted`, all three dialog files `(not written)`;
conversation `conv_1601m5dafby5ebds7d75dbxwpn30`, 49 s.

**Verdict: passed.** Rafal heard Claude's answer 2 s after the fork gave it, without asking
again, and the fork worked on the question once. The agent re-issued the call again (2 of 2 runs),
so the answer came through the joined tool call; the `sendContextualUpdate` path stayed unexercised
and remains the page's fallback for an agent that does not re-issue.

**Strategy for `config.json`:** `contextual-update` (interruptions allowed; the bridge joins
repeats, the page resends when no repeat is pending). Plan 2 changes: Task 5 adds the join, Task 7's
`ask-tracker` tracks each ask.

Voice minutes of Task 1: 34 s + 49 s = 83 s.

## Rejoining a conversation (Plan 3, Task 9)

Run 2026-10-22 20:49, in `notatki`, from session c0987db9 (`/talk sonda planu 3`), on the code of
Plan 3 Tasks 1–8. Setup (Task 9 Step 1): `config.json` `agentHangup: "pause"`,
`rejoinFirstMessage: true`; `TALK_MAX_DURATION_SECONDS=60 agent sync` created the
`end_conversation` tool (`tool_4601m5jezbhze889xheh5vcqenxd`, saved as `endToolId`). Read back:
`max_duration_seconds` 60, two tool ids, `max_conversation_duration_message` „Kończy się czas tego
połączenia, zaraz łączę ponownie.”, the `first_message` override allowed. The first `agent sync`
from the controller was refused by the auto-mode classifier; it ran after Rafal's order in text.

`transcript.md`, verbatim:

```
- 20:50:19 **Agent**: Cześć, słucham.
- 20:50:27 **Rafał**: Cześć, jak tam dzisiaj leci?
- 20:50:28 **Agent**: Cześć! [happy] Dzięki, leci dobrze. Jak u ciebie? Co słychać?
- 20:50:35 **Rafał**: Dobrze. Zrób przerwę.
- 20:50:36 **Agent**: Okej, [slow] rozmowa na ciebie poczeka. Do usłyszenia!
- 20:50:40 **Notatka**: call ended: agent/end_call
- 20:51:02 **Agent**: Wracamy do rozmowy. Słucham.
- 20:51:02 **Rafał**: Na-na jakim etapie stoisz?
- 20:51:02 **Notatka**: rejoin context sent
- 20:51:02 **Agent**: Chwila, pytam Claude o aktualny etap projektu, to może potrwać.
- 20:51:08 **Agent**: Claude mówi, że jesteśmy w zadaniu dziewiątym planu trzeciego, czyli w samej sondzie głosowej. Agent ma limit sześćdziesięciu sekund. Po przerwie masz poczekać na komunikat o końcu czasu i sprawdzić, czy strona sama połączy się ponownie. Dopiero potem powiedz „Kończymy”.
- 20:51:46 **Rafał**: ...
- 20:51:47 **Agent**: Jesteś tam jeszcze? Jeśli chcesz coś dopytać o etap projektu, po prostu powiedz.
- 20:51:56 **Agent**: Kończy się czas tego połączenia, zaraz łączę ponownie.
- 20:51:59 **Notatka**: call ended: agent/close
- 20:57:21 **Agent**: Wracamy do rozmowy. Słucham.
- 20:57:21 **Rafał**: Kończymy.
- 20:57:21 **Notatka**: rejoin context sent
- 20:57:22 **Agent**: Do usłyszenia, Rafał, miłego dnia!
- 20:57:24 **Notatka**: call ended: agent/end_call
```

Closing report: `origin: session`, `deletion: deleted`, `conversations:
conv_7901m5jf5mcwfmtsv4wd6gmjnd81 (22 s), conv_8501m5jf7bv4e14rvmzd26rm2xqm (64 s),
conv_3401m5jfjwcqfp3sy52gq83pw3vm (11 s)`; all three dialog files `(not written)`.

| Check | Result | Evidence |
|---|---|---|
| (a) `end_conversation` on „Kończymy”, not on „Zrób przerwę” | passed | The break call ended `agent/end_call` and the dialog paused (a call followed). The last call also ended `agent/end_call`, yet the dialog ended at once with no fork note: with `agentHangup: "pause"`, `endCall` (`lib/bridge.mjs:280`) ends it only after `end-request`, which only `end_conversation` posts. |
| (b) a later call's first message and its contextual update | passed | „Wracamy do rozmowy. Słucham.” opened both later calls, `rejoin context sent` followed each, and the agent went on without a new greeting. |
| (c) the duration message on a 60 s call | passed | Spoken at 20:51:56, 3 s before the cut. |
| (d) what `onDisconnect` receives | break: `agent/end_call`; end: `agent/end_call` after `end_conversation`; duration cut: `agent/close` | See the finding below. |

**Finding: the duration cut arrives as `close`.** Over WebRTC the cut came as
`{ reason: 'agent', context: { type: 'close' } }`, not `max_duration_exceeded`. In the vendored
client 1.28.0, `max_duration_exceeded` comes only from `handleErrorEvent`, on a server `error_event`
with that `error_type`; LiveKit's `RoomEvent.Disconnected` and the agent's `ParticipantDisconnected`
both give `close`. So `callEnded` (`web/talk.mjs:199`) did not reconnect, and `endCall` paused the
dialog. Rafal rejoined with „Połącz ponownie” 5 min 22 s later; nothing was lost (the rejoin context
was sent and the dialog went on). The page logs only `context.type`, so which of the two LiveKit
events closed the call is not known. The automatic next call of spec §18 does not happen on this
client; the fix waits for Rafal's decision „Ponowne połączenie po limicie czasu”.

**Configuration:** `agentHangup: "pause"`, `rejoinFirstMessage: true` (both stay as set for the
probe); the fallback of §18.3 does not apply, so the question „Silence in the fallback” is not asked.
Step 4: `agent sync` without the variable, read back `max_duration_seconds` 1800.

Voice minutes of Task 9: 22 s + 64 s + 11 s = 97 s.

### Re-probe after the duration-cut fix (Task 9 Step 5, 2026-10-23)

Run 2026-10-23 12:57, in `notatki`, from session c0987db9 (`/talk sonda limitu`), on the page fix of
Step 5 after its review. Setup: `TALK_MAX_DURATION_SECONDS=60 agent sync` (2026-10-22), read back
`max_duration_seconds` 60, two tool ids, the duration message, the `first_message` override allowed.

`transcript.md`, verbatim:

```
- 12:58:45 **Agent**: Cześć, słucham.
- 12:58:53 **Rafał**: Cześć. Jaka jest twoja wiedza odnośnie tej sesji?
- 12:58:53 **Agent**: Chwila, sprawdzę to u Claude'a.
- 12:58:58 **Agent**: [calm] Claude mówi, że ta sesja dotyczy planu trzech części hub-voice, czyli wznawiania rozmowy głosowej. Sonda pokazała, że cięcie po limicie przychodzi jako close, przez co strona nie łączyła się ponownie. Poprawka rozpoznaje teraz close po komunikacie o limicie jako cięcie i przeszła recenzję. Oba commity są już na remote. Agent ma limit sześćdziesiąt sekund, więc za chwilę powinieneś usłyszeć komunikat o końcu czasu, a nowe połączenie powinno ruszyć samo.
- 12:59:40 **Rafał**: Okej, yy, czyli sześćdziesiąt sekund to czas-- okienko połączenia?
- 12:59:40 **Agent**: Sprawdzę to u Claude'a, chwilę potrwa.
- 12:59:45 **Notatka**: interruption during ask
- 12:59:45 **Agent**: Kończy się czas tego połączenia, zaraz łączę ponownie.
- 12:59:49 **Notatka**: call ended: agent/max_duration_exceeded (close: agent disconnected)
- 13:00:00 **Agent**: Wracamy do rozmowy. Słucham.
- 13:00:00 **Notatka**: rejoin context sent
- 13:00:04 **Rafał**: Miałeś mi odpowiedzieć.
- 13:00:04 **Agent**: Sprawdzę to u Claude'a, zaraz odpowiem.
- 13:00:09 **Agent**: Tak, sześćdziesiąt sekund to długość jednego połączenia. Limit jest ustawiony tylko na czas tej sondy, potem wraca do pół godziny. Poprawka działa, bo połączenie zostało ucięte po limicie i strona sama zestawiła nowe. Jeśli tak to wyglądało po twojej stronie, powiedz [calm] „Kończymy”, a sesja przywróci limit i zapisze wynik.
- 13:00:39 **Rafał**: Kończymy.
- 13:00:40 **Agent**: Kończę rozmowę, zapisuję wynik sesji.
- 13:00:41 **Agent**: Dziękuję za rozmowę, do usłyszenia!
- 13:00:45 **Notatka**: call ended: agent/end_call (Agent ended the call)
```

Closing report: `origin: session`, `deletion: deleted`, `conversations:
conv_0001m5m6kcr3e7r9yy5et6k3h1dy (64 s), conv_0501m5m6nh8degr8yrjb0hc24z3f (54 s)`; all three
dialog files `(not written)`.

| Check | Result | Evidence |
|---|---|---|
| The cut is read as the cut | passed | `call ended: agent/max_duration_exceeded (close: agent disconnected)`, 4 s after the duration message: the client gave `close` with the reason of the agent's `ParticipantDisconnected` (not LiveKit's numeric `RoomEvent.Disconnected` reason), and `callEnded` (`web/talk.mjs:192-219`) took it for the cut. |
| The next call starts by itself | passed | 11 s after the cut note, with no click: „Wracamy do rozmowy. Słucham.” and `rejoin context sent`. |
| „Kończymy” ends the dialog | passed | `end_conversation`, then `call ended: agent/end_call (Agent ended the call)`; the task ended with the closing report. |

**Observation: an answer returned just before the cut is lost.** Rafal's question at 12:59:40
started `ask_claude`. The fork's log (session `dbf652d3`) has its answer at 12:59:44; the page noted
the interruption and the agent spoke the duration message at 12:59:45; the call was cut at 12:59:49.
No `contextual update sent` note followed, so when the answer came the page did not hold the ask
as interrupted: the answer most likely went back as the tool result, and the cut left it unspoken.
The bridge counts an answer as heard when its caller's call is live and its response open
(`unheard`, `lib/bridge.mjs:158`), so nothing was kept for the rejoin context
(`lib/bridge.mjs:180`, `rejoinContext` at `lib/bridge.mjs:229`), and the prompt rule of Ruling F3
(`lib/agent-config.mjs:14`: say a kept answer at the next turn) had nothing to say. The next call
opened with the fixed first message; Rafal had to say „Miałeś mi odpowiedzieć.”, and the agent asked
again (answered 5 s later). Inferred, not logged: the order of the answer and the interruption at the
page, since the dialog keeps no ask log. The fork note of a later call worked: the fork's next
message began „(Połączenie odnowione po limicie czasu. …)”. Decision „Odpowiedź utracona przy
cięciu” (2026-10-23, variant A): no change in Plan 3; a known limitation, listed in the acceptance
report.

Step 4 after the re-probe: `agent sync` without the variable (2026-10-23), read back
`max_duration_seconds` 1800.

Voice minutes of the re-probe: 64 s + 54 s = 118 s; Task 9 in all: 97 s + 118 s = 215 s.
