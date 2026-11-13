---
name: android-emulator-setup
description: "Local Android emulator for code-busters-mobile on Rafal's PC — SDK path, AVD name, dev client APK source, Android 17 local-network permission, first-load timings"
metadata:
  node_type: memory
  type: reference
  originSessionId: ae480ef9-2ffd-4802-adfe-92a129b4bfce
  modified: 2026-11-13T05:10:43.730Z
---

Set up 2026-11-12 (WHPX enabled 09:41, reboot 13:07; Android Studio 2026.2.2.8 via winget).

- SDK: `D:\Android\Sdk` (`ANDROID_HOME` and `Path` entries for `platform-tools` and `emulator` are User-scope env vars; a Claude Code session started before that day needs full paths, e.g. `D:\Android\Sdk\platform-tools\adb.exe`).
- AVD: `Medium_Phone_API_37.0` (Android 17, Google Play, x86_64), created by the Android Studio wizard. Start: `D:\Android\Sdk\emulator\emulator.exe -avd Medium_Phone_API_37.0`. Acceleration: WHPX (Hyper-V/Docker stay on).
- Dev client: EAS build `cc074e54` (2026-11-12, profile `development`, SDK 58, app 1.1.0, commit `8062983`, after the `expo install --fix` patch bumps), installed on the AVD; it replaced `9a9c5a26` (commit `30edbef`). APK includes `x86_64`. Re-download with `eas build:list --platform android --build-profile development` when reinstalling; rebuild only when the native layer changes. A local `expo run:android` build fails on this PC (Windows long paths: `ninja: manifest 'build.ninja' still dirty` in `expo-updates` CMake, `LongPathsEnabled=0`), so builds go through EAS.
- After a `pnpm install` that rewrites `node_modules` symlinks, a running or cached Metro answers 404 `UnableToResolveError ./node_modules/expo-router/entry`; restart it with `pnpm dev --clear`.
- JS and CSS tasks are not openable from the lesson list (`SUPPORTED_KINDS` in `utlis/course.ts`); open them by deep link `codebusters://lesson/javascript/<activity-id>` (or `/css/`), ids from the local DB: `docker exec code-busters-v2-db-1 sh -c 'mariadb -uroot devstock -N -e "select id,category,name from Activity where category in (\"JAVASCRIPT\",\"CSS\") limit 5"'`.
- Local CMS data has no marketplace-visible products, coupons, promotions or loyalty missions; check pricing and reward chips in Storybook (`pnpm storybook:dev`, stories `Screens/Marketplace`, `Screens/LoyaltyProgram`).
- Android 17 asks the dev client for the "nearby devices" (local network) permission on first launch; without "Allow" it cannot reach Metro at `192.168.0.190:8081`, and the screen stays on the launcher.
- First run timings: Metro cold bundle ~330 s, then ~77 s until fonts and theme resolve (screen stays dark with the "Refreshing..." banner meanwhile). Not a hang.
- Biometrics (since 2026-11-13): the AVD has screen-lock PIN `1111` and one enrolled fingerprint; `adb -e emu finger touch 1` (then `finger remove`) answers a prompt. The system biometric prompt is FLAG_SECURE, so `screencap` returns a black frame while it is open; read it with `uiautomator dump`. Undo with `adb shell locksettings clear --old 1111`.
- Local logins: seed users in `code-busters-v2/apps/cms/prisma/data/User.ts` share one password (the commented `// password:` line at the top); used `adventureseeker@explore.com` (Alex Wanderlust) and `developer1@codebusters.pl` (Tomasz Kowalski). Git Bash needs `MSYS_NO_PATHCONV=1` for `adb shell cat /sdcard/...`.
- Backend: `.env` points at `http://192.168.0.190:3001/api/graphql` (host Wi-Fi IP), reachable from the emulator; the local CMS from `code-busters-v2` must be running for login.

Related: [[mobile-ui-testing-on-pc]]
