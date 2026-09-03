---
name: ortools-sigill-workers
description: OR-Tools CP-SAT crashes with SIGILL on this Alder Lake CPU at default worker count; cap num_search_workers
metadata: 
  node_type: memory
  type: project
  originSessionId: c329b3a1-698f-474b-b615-c21564918553
---

OR-Tools 9.15 CP-SAT `solver.Solve()` crashes the whole process with **SIGILL (exit 132)** on the realistic-month problem when `num_search_workers` is left at the default (auto = all logical threads, 20 on this Intel Alder Lake box). The hybrid P+E cores: a worker thread lands on a Gracemont E-core lacking an instruction the wheel uses.

**Empirically mapped (in the Linux Docker container, TL=20-30s):** workers 1/2/4/8/12/16 → no crash (2+ find FEASIBLE); workers 20 (=nproc) and default → SIGILL. Fix: `SolverParams.num_search_workers` defaults to **8**, wired into `solver.py`. Cap below the thread count is what matters; 8 is a safe sweet spot.

Solver-dependent tests must run in the Docker image (`docker build -t rota-api .` then `docker run --rm -v "${PWD}:/app" -w /app/engine rota-api python -m pytest -q`) — running locally on Windows crashed even before this fix. Mounting the repo at `/app` makes editable installs pick up live edits without rebuild. The `Dockerfile` and `SolverParams` comments record the high-level why.
