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

Pending.

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

## End to end

Pending.

## Minutes ledger

| Probe | Conversation | Seconds |
|---|---|---|

## Conclusions for Plan 2

Pending.
