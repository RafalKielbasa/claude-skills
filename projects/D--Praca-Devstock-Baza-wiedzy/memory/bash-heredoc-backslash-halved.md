---
name: bash-heredoc-backslash-halved
description: The Bash tool halves doubled backslashes inside quoted heredocs and sed replacements; use the Edit tool for any content containing a doubled backslash (regex escapes, Windows paths)
metadata:
  type: feedback
---

In this environment (Windows, Git Bash via the Bash tool) a quoted heredoc (`<<'EOF'`) still turns a doubled backslash into a single one, and a `sed` replacement processes escapes a second time (`\x5c` became a literal backslash). Observed 2026-09-15 while writing `/(?<!\)\|/` into `tools/course-pipeline/src/plan-nagrania.js`: the file got `(?<!\)` and the regex failed to compile.

**Why:** the tool layer unescapes the command string before the shell sees it, so every escaping layer after it (heredoc, sed, JS source) receives one backslash fewer than typed.

**How to apply:** content with a doubled backslash (JS/regex escapes, Windows paths in strings) goes through the Edit or Write tool, not a heredoc or sed. Single backslashes (`\n`, `\d`, `\``) survive heredocs fine. Verify with `cat -A` after any Bash-side write of escape-heavy text.
