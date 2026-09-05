---
budget: { slots: 5, max_files_per_axis: 40 }
gate: blocking
gate_on_disputed: true
commands: {}
exclude: ['**/node_modules/**', '**/dist/**', '**/*.snap', '.claude/review/**']
disable: []
---

# Review configuration — {{REPO_NAME}}

{{REPO_SUMMARY}}

This file is the source of truth for how this repository is reviewed. One `##`
section per axis; the fenced `yaml` block is the axis metadata, the prose below
it is the checklist a reviewing agent receives verbatim.

## Code quality

```yaml
id: code-quality
when: always
rank: always
severity_default: suggestion
```

- Names are descriptive and in English.
- No duplicated logic — a shared fragment moves into a helper.
- A comment explains why, not what.
