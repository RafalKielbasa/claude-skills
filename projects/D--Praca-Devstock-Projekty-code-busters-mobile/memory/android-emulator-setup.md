---
name: android-emulator-setup
description: "Local Android emulator for code-busters-mobile on Rafal's PC — SDK path, AVD name, dev client APK source, Android 17 local-network permission, first-load timings"
metadata:
  node_type: memory
  type: reference
  originSessionId: ae480ef9-2ffd-4802-adfe-92a129b4bfce
  modified: 2026-11-12T12:52:41.532Z
---

Set up 2026-11-12 (WHPX enabled 09:41, reboot 13:07; Android Studio 2026.2.2.8 via winget).

- SDK: `D:\Android\Sdk` (`ANDROID_HOME` and `Path` entries for `platform-tools` and `emulator` are User-scope env vars; a Claude Code session started before that day needs full paths, e.g. `D:\Android\Sdk\platform-tools\adb.exe`).
- AVD: `Medium_Phone_API_37.0` (Android 17, Google Play, x86_64), created by the Android Studio wizard. Start: `D:\Android\Sdk\emulator\emulator.exe -avd Medium_Phone_API_37.0`. Acceleration: WHPX (Hyper-V/Docker stay on).
- Dev client: EAS build `9a9c5a26` (profile `development`, SDK 58, app 1.1.0, commit `30edbef`), APK includes `x86_64`. Re-download with `eas build:list --platform android --build-profile development` when reinstalling; rebuild only when the native layer changes.
- Android 17 asks the dev client for the "nearby devices" (local network) permission on first launch; without "Allow" it cannot reach Metro at `192.168.0.190:8081`, and the screen stays on the launcher.
- First run timings: Metro cold bundle ~330 s, then ~77 s until fonts and theme resolve (screen stays dark with the "Refreshing..." banner meanwhile). Not a hang.
- Backend: `.env` points at `http://192.168.0.190:3001/api/graphql` (host Wi-Fi IP), reachable from the emulator; the local CMS from `code-busters-v2` must be running for login.

Related: [[mobile-ui-testing-on-pc]]
