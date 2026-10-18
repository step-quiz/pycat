# PyCat — Remaining Tasks

> **Audience:** This document is written for an AI assistant that will continue development of the PyCat project. Read it in full before starting any task. Each task is self-contained and can be done independently.

---

## Context

PyCat is a browser-based interactive Python course in Catalan, built with vanilla HTML/CSS/JS and Pyodide (CPython via WebAssembly). It is the sequel to KarelCat. The codebase has no build step, no framework, no bundler.

There are no open tasks in this file right now (tasks 7 and 8 were done on 2026-10-18). Pending ideas are listed in `docs/CURRENT-STATE.md` (§11, «Tasques pendents»).

**What has already been done:**
- Fixed the `_onDone` double-invocation bug in `pyrunner.js`
- Implemented a progress system with checkmarks in the sidebar (`capitols.js`, `curs.css`)
- Fixed multi-line triple-quote syntax highlighting in `editor.js`
- Extracted the glossary into its own file (`curs/glossari-data.js`)
- Added interactive `input()` support via SharedArrayBuffer, with a fallback stdin textarea panel for environments without COOP/COEP headers
- Added mobile keyboard accessory (`js/kbd-accessory.js`) — a fixed bottom bar with Python-specific keys that appears on touch devices when the editor has focus. Scrollable, respects embed mode, hidden on desktop. Styles in `style.css`, loaded from `index.html`.
- Created all 14 missing reptes (`curs/repte-2.html` through `curs/repte-15.html`) — 5 easy, 5 intermediate, 5 hard. Updated `REPTES_DATA` in `capitols.js` with all 15 entries. Updated `repte-1.html` navigation. Each repte uses Mode C validation with 4–6 test cases covering edge cases.
- **[Task 1]** Implemented Shift+Tab unindent and block indent/unindent in `editor.js`. Tab with multi-line selection indents all selected lines by 4 spaces; Shift+Tab (with or without selection) removes up to 4 leading spaces per line. Selection is preserved after the operation.
- **[Task 2]** Added CDN fallback and friendly error on Pyodide load failure. `pyworker.js` emits a specific `load_error` message type (with the failed CDN URL). `pyrunner.js` automatically retries with `P.PYODIDE_CDN_FALLBACK` (`pyodide-cdn2.iodide.io`); if that also fails, shows a Catalan error and a "Torna a provar" button. New CDN constant and 3 new i18n keys added.
- **[Task 3]** Extracted the i18n system into `js/i18n.js`. Removed `UI_LANGS` and `P.t` from `constants.js`. Added Spanish (`es`) and English (`en`) translations for all 22 UI keys. Added a language selector (`<select id="lang-select">`) in the topbar, with persistence via `localStorage` (`pycat_lang`). `P.setLang(code)` refreshes visible UI elements (run button, reset button, state badge). Hidden in embed mode. **Later removed:** today `js/i18n.js` is Catalan only and there is no language selector. Loaded in `index.html` between `constants.js` and `state.js`. Course pages (`curs/*.html`) are unaffected — they don't load these scripts and remain Catalan-only.
- **[Task 4]** Created `tests/test-exercises.html` — a browser-based test runner that loads Pyodide, extracts all exercises from `curs/*.html` via `fetch` + `DOMParser`, and runs the reference solution for each `goalId` against its test cases. Solutions live in `tests/solutions.js` (23 solutions covering all chapter exercises and reptes 1–15). The runner shows PASS/FAIL per exercise with per-test diff. Verified locally with CPython: **81/81 tests pass** (at the time; `tests/comprova-curs.py` now checks 44 exercises and 99 test cases). Includes `tests/README.md` with usage instructions. Not linked from the course UI (development tool).
- **[Task 5]** ~~Added offline support via Service Worker.~~ **REVERTED in production** — the SW was causing `ERR_FAILED` in production at pycat.step-quiz.net (Cloudflare Pages) on repeat visits. Both `sw.js` and `js/sw-register.js` have been replaced with kill-switch variants that actively unregister any previously-installed SW and clear all `pycat-*` caches. The files remain in place so that any user browser that had cached the old SW receives the self-destruct update. They can be kept as-is indefinitely with no side effects. If offline support is needed in the future, rewrite from scratch with extensive production testing — don't restore the old files.
- **[Task 7]** (2026-10-18) Migrated `js/` to ES modules. Every app file exports its public API and imports what it needs; the global `P` namespace is gone (the three values `main.js` used to put on `P` — `parentOrigin`, `codeStorageKey`, `initialCode` — now live in `state`). `index.html` loads only `<script type="module" src="js/main.js">`; `kbd-accessory.js`, `sw-register.js`, `glossari-data.js`, `footer.js` and `family.js` stay classic scripts, and `ui.js` still exposes the inline `onclick` handlers on `window`. `pyworker.js` is unchanged. Verified in Chromium with a local Pyodide: all 29 exercises with reference solutions pass end to end from the course pages, and the editor page (run, error explanation, interactive `input()`, turtle, step-by-step, theme, glossary, touch key bar) behaves exactly as before.
- **[Task 8]** (2026-10-18) Chapter 11 now has a 5-question quiz (`cap-11-quiz`, «Comprova què has après», before «I ara què?»), and `capitols.js` uses it as the chapter's `goalId`, so the sidebar shows ✓ when it is done.
- **[Task 6]** Created `tools/generate-pages.js` — a zero-dependency Node.js generator that produces `curs/{capitol,repte}-N.html` from JSON descriptions in `tools/pages/*.json`. The CLI supports `--only`, `--dry-run`, `--input`, `--out`. The JSON format allows grouping multiple `h2`+body into a single `<section>` via `parts[]` to preserve the `.chapter-section { margin-bottom: 2rem }` layout. Two example inputs are included (`repte-1.json`, `repte-6.json`) — verified end-to-end: generated pages extract identically to originals via DOMParser, and Task 4's reference solutions still pass 6/6 tests against them. `tools/README.md` documents the format and workflow.

---

## General Guidelines for All Tasks

1. **No build step.** All output must be vanilla HTML/CSS/JS files that work when served by `python3 -m http.server`.
2. **All user-facing text in Catalan.** Code comments can be in Catalan or English.
3. **Verify syntax** with `node --check` for every modified JS file.
4. **Test manually** in a browser after making changes.
5. **Respect the existing architecture** — read `docs/CURRENT-STATE.md` and `README.md` before starting (`docs/ARCHITECTURE.md` is the original design and is out of date).
6. **Match the existing code style** — look at the files you're modifying and follow the same patterns (commenting style, naming conventions, indentation).
