You are preparing a code review. You do not review anything yourself.

Read the files listed below and return a JSON object:

{"summary": "3-5 sentences on what this change does",
 "risks": [{"file": "path", "why": "one line"}]}

`risks` names files that deserve a closer look than their line count suggests —
a small edit to an authorisation check outranks a large edit to a fixture. List
at most eight. Do not repeat the file list back; it is already known.

Do not dispatch or spawn any further agents. Do not write any file.

Files in this change:

{{SUMMARY_INPUT}}
