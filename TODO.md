# PyCat — Remaining Tasks

> **Audience:** This document is written for an AI assistant that will continue development of the PyCat project. Read it in full before starting any task. Each task is self-contained and can be done independently.

---

## Context

PyCat is a browser-based interactive Python course in Catalan, built with vanilla HTML/CSS/JS and Pyodide (CPython via WebAssembly). It is the sequel to KarelCat. The codebase has no build step, no framework, no bundler.

**What has already been done (this round):**
- Fixed the `_onDone` double-invocation bug in `pyrunner.js`
- Implemented a progress system with checkmarks in the sidebar (`capitols.js`, `curs.css`)
- Fixed multi-line triple-quote syntax highlighting in `editor.js`
- Extracted the glossary into its own file (`curs/glossari-data.js`)
- Added interactive `input()` support via SharedArrayBuffer, with a fallback stdin textarea panel for environments without COOP/COEP headers

---

## Task 1 — Create the 14 Missing Reptes (Challenges)

**Priority: HIGH** — This is the single largest content gap.

**What:** Create `curs/repte-2.html` through `curs/repte-15.html` following the detailed plan in `PYCAT-REPTES-PLAN.md`. Each repte is a standalone HTML file with an embedded simulator iframe.

**How:**
1. Read `PYCAT-REPTES-PLAN.md` in full — it contains the exact specifications for all 15 reptes (repte-1 already exists as a reference).
2. Read `curs/repte-1.html` as the canonical template — copy its structure exactly.
3. For each repte, create the HTML file with the correct `data-code`, `data-tests` (or `data-expected`/`data-testcode`), and `data-goal-id` attributes.
4. After creating all files, update `REPTES_DATA` in `curs/capitols.js` — uncomment and add all 15 entries with the correct `goalId`.
5. Make sure every repte HTML loads `glossari-data.js` before `capitols.js`.

**Validation:** Each repte should be manually testable: open it in a browser, enter the correct solution, and verify that the feedback shows "✓ Correcte". Enter an incorrect solution and verify "✗" feedback with a useful message.

**Critical rules from the plan:**
- All content in Catalan (Python keywords stay in English)
- Warm, concise, second-person singular tone
- Each repte has 3–5 test cases to avoid false positives
- Test cases must cover edge cases (zero, negative, empty string, etc.)
- Variable names in code skeletons should be in Catalan
- `data-goal-id` format: `repte-N` (e.g., `repte-2`, `repte-3`, ...)

---

## Task 2 — Mobile Keyboard Accessory

**Priority: MEDIUM**

**What:** Create `js/kbd-accessory.js` — a virtual keyboard bar that appears above the system keyboard on mobile devices, providing quick access to characters commonly needed in Python but hard to type on mobile keyboards.

**How:**
1. Look at how KarelCat implements its `kbd-accessory.js` for reference patterns.
2. The accessory should show buttons for: `=`, `(`, `)`, `[`, `]`, `{`, `}`, `"`, `'`, `:`, `#`, `_`, `<`, `>`, `+`, `-`, `*`, `/`, `%`
3. Tapping a button inserts the character at the cursor position in the `code-editor` textarea.
4. The accessory should only appear on touch devices (detect via `'ontouchstart' in window` or similar).
5. It should be a fixed bar at the bottom of the screen, above the system keyboard.
6. Add the script to `index.html` (after `ui.js`, before `main.js`).
7. Style it in `style.css` using the existing CSS variables for consistency.

**Considerations:**
- Must not interfere with the existing Tab→4-spaces behavior
- Should scroll horizontally if there are too many keys for the screen width
- Should respect embed mode (might want to hide it in small iframes)

---

## Task 3 — Shift+Tab Unindent and Block Indent/Unindent

**Priority: MEDIUM**

**What:** Enhance the editor's Tab handling in `editor.js`:
1. **Shift+Tab:** Remove 4 leading spaces from the current line (unindent).
2. **Block indent:** When text is selected across multiple lines, Tab indents all selected lines by 4 spaces.
3. **Block unindent:** When text is selected across multiple lines, Shift+Tab removes 4 leading spaces from all selected lines.

**How:**
- Modify the `keydown` handler in `initEditor()` inside `editor.js`.
- After modifying `ta.value`, call `updateEditor()` to refresh highlighting.
- Preserve the selection range after indent/unindent so the user can repeat the operation.

---

## Task 4 — CDN Fallback and Friendly Error on Pyodide Load Failure

**Priority: MEDIUM**

**What:** If the Pyodide CDN (`cdn.jsdelivr.net`) fails to load (network error, timeout, or 404), show a user-friendly message instead of a cryptic error.

**How:**
1. In `pyworker.js`, wrap the `importScripts` + `loadPyodide` call in a try/catch (already partially done).
2. If it fails, post an error message with a specific type (e.g., `{type: 'load_error', msg: '...'}`).
3. In `pyrunner.js`, handle this message by:
   - Showing a Catalan-language error: "No s'ha pogut carregar Python. Comprova la connexió a internet i recarrega la pàgina."
   - Optionally, add a "Torna a provar" button that retries `pyInit()`.
4. Optionally, try a fallback CDN URL (e.g., `https://cdn.jsdelivr.net/pyodide/v0.27.7/full/` → `https://pyodide-cdn2.iodide.io/v0.27.7/full/`).

---

## Task 5 — i18n Module Separation

**Priority: LOW**

**What:** Extract the i18n system from `constants.js` into its own `js/i18n.js` module for cleaner separation and future multi-language support.

**How:**
1. Create `js/i18n.js` containing `P.UI_LANGS`, `P.t()`, and a `P.setLang(code)` function.
2. Move the language data out of `constants.js`.
3. Add support for `es` (Spanish) and `en` (English) as secondary languages (with translations for all existing keys).
4. Add a language selector to the UI (small dropdown in the topbar or settings area).
5. Update `index.html` to load `i18n.js` after `constants.js` and before `state.js`.
6. Make sure the course pages (`curs/*.html`) are unaffected — they are always in Catalan.

---

## Task 6 — Automated Test Runner for Exercises

**Priority: LOW**

**What:** Create a script/page that automatically runs every chapter exercise and repte with their correct solutions and verifies they pass all test cases.

**How:**
1. Create `tests/test-exercises.html` — a page that:
   - Loads Pyodide
   - For each exercise (from a data file), runs the solution code with each test case's stdin
   - Compares stdout to expected output
   - Reports pass/fail for each
2. The test data could be a JSON file listing: `{goalId, solution, testCases: [{stdin, expected}]}`.
3. This is a development tool — it doesn't need to be linked from the course UI.

**Why:** Prevents regressions when editing test cases or exercise code. Catches typos in expected output.

---

## Task 7 — Service Worker for Offline Support

**Priority: LOW**

**What:** Add a service worker that caches Pyodide and static assets for full offline functionality after the first load.

**How:**
1. Create `sw.js` in the project root.
2. Cache strategy: cache-first for Pyodide CDN assets and static files (HTML, CSS, JS); network-first for everything else.
3. Register the service worker in `index.html` and in `curs/index.html`.
4. Add a small "Available offline" indicator after caching is complete.

**Considerations:**
- Pyodide files are ~12MB — cache them progressively.
- The service worker must invalidate its cache when the Pyodide version changes (update the CDN URL in `constants.js`).
- Must not interfere with the development workflow (add a bypass for `localhost` or a version query param).

---

## Task 8 — Chapter Template Generator

**Priority: LOW**

**What:** Create a build script that generates the boilerplate HTML for chapter and repte pages from a minimal data file, eliminating the manual duplication of the header/sidebar/footer/scripts skeleton.

**How:**
1. Create `tools/generate-pages.js` (Node.js script, no external dependencies).
2. Input: a JSON/YAML file with chapter metadata and content sections.
3. Output: the full HTML file for each chapter/repte.
4. The template includes: `<head>`, `<header>`, sidebar, navigation, and script tags.
5. Content sections are written in a simple format (Markdown or HTML fragments).
6. This is a development tool — it runs once to generate the static HTML files, which are then committed to the repo.

**Why:** Currently, changing the page skeleton (e.g., adding a new `<script>` tag) requires editing 12+ files. A generator reduces this to one template.

---

## Task 9 — Migrate to ES Modules

**Priority: LOW — Only do if the project grows significantly.**

**What:** Convert the global namespace `P.*` pattern to ES modules (`import`/`export`).

**How:**
1. Change all `<script>` tags to `<script type="module">`.
2. Convert each JS file to use `export` for its public API and `import` for dependencies.
3. Remove the global `P` object.
4. The Web Worker (`pyworker.js`) already runs in its own scope and doesn't need module conversion.
5. Test that everything still works in all target browsers (Chrome 89+, Firefox 89+, Safari 15.2+).

**Risk:** This is a large refactor. Only worthwhile if the JS codebase grows beyond ~15 modules.

---

## Task 10 — Progress Tracking for Capítol 2 and Capítol 10

**Priority: LOW**

**What:** Capítol 2 (Variables) and Capítol 10 (Posant-ho tot junt) currently have no `data-goal-id` and therefore no progress tracking.

**For Capítol 2:** The exercise asks the student to "put your name" — it's open-ended by design. Options:
- Add a `data-testcode` that checks `type(nom) == str and len(nom) > 0` or similar lightweight validation.
- Or accept that chapter 2 has no trackable exercise and leave it as-is.

**For Capítol 10:** This is a project chapter. It could have a `data-goal-id` tied to a specific exercise within it, or a "mark as done" button.

---

## General Guidelines for All Tasks

1. **No build step.** All output must be vanilla HTML/CSS/JS files that work when served by `python3 -m http.server`.
2. **All user-facing text in Catalan.** Code comments can be in Catalan or English.
3. **Verify syntax** with `node --check` for every modified JS file.
4. **Test manually** in a browser after making changes.
5. **Respect the existing architecture** — read `docs/ARCHITECTURE.md` and `README.md` before starting.
6. **Match the existing code style** — look at the files you're modifying and follow the same patterns (commenting style, naming conventions, indentation).
