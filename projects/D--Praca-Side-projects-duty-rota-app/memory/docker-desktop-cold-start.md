---
name: docker-desktop-cold-start
description: "On this machine Docker Desktop isn't running by default; first `docker build` right after starting it can fail transiently"
metadata: 
  node_type: memory
  type: project
  originSessionId: ac573fe8-a2b4-418c-8d70-7ac7dcfcc9aa
---

Docker Desktop is not left running on this Windows machine — `docker build`/`docker run` fail immediately with `error during connect: ... dockerDesktopLinuxEngine: The system cannot find the file specified.` Start it with `Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'` (or `powershell -NoProfile -Command "Start-Process ..."` from Bash), then poll `docker info` until it succeeds (cold start ~30-90s) before running docker commands.

**Why:** Even after `docker info` first succeeds, the very first `docker build` can still fail mid-build with `ERROR: failed to build: failed to receive status: rpc error: code = Unavailable desc = error reading from server: EOF` — buildkit was still warming up. Simply retrying the same `docker build` immediately succeeds.

**How to apply:** When Docker commands are needed in this repo (see also [[ortools-sigill-workers]] for why solver tests must run in the built image), check/start Docker Desktop first, wait for `docker info` to succeed, and if the first build hits that EOF error, just retry once before treating it as a real failure.
