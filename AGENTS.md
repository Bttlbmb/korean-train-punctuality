# Project instructions

## Purpose and project state

Maintain the website of Korean Train Punctuality, a static GitHub Pages site about the punctuality of Korail trains. The repository root is the published site. `data/` holds JSON that the exporter in the separate `backend` repository (`../backend`) writes; the pages and scripts here display it.

## Read before working

- `BUILD_NOTES.md` owns the preview, publishing, definitions and decisions, and the current interface.
- `../backend/BUILD_NOTES.md` owns the metric definitions and lists the files the exporter writes.
- Before writing or editing documentation, read `docs/writing.md`.

Keep this file short. Link to the owning document rather than repeating its rules. Record a lasting decision as one line under “Definitions and decisions” in `BUILD_NOTES.md`. Explicit user instructions take precedence over these defaults.

## Data and wording integrity

- Only completed operating dates enter statistics. Missing delay values are excluded from shares and never count as punctual. Show a dash or an explicit note when a figure cannot be computed; never guess it.
- Name the definition near every punctuality figure, such as “within 5 min”.
- Site text never says “cancelled” or “live”. An unavailable lookup is not proof of a cancellation.
- Regenerate `data/` with the backend exporter; never edit it by hand. Station IDs in `data/` come from the backend’s `exporter/stations/station_ids.json`, which keeps them stable.

## Implementation conventions

- Plain HTML, CSS, and ES modules, with no framework, build step, or third-party scripts except Google Fonts. Use relative URLs so the site works from a GitHub Pages subpath. Keep the light theme, English text, and the color meanings: green means on time (within 5 minutes), the warm ramp means late, grey is neutral, and blue marks focus only.
- This repository is published in full. It never holds the database, scraper control files, or an API key.
- Serve previews only on the local machine, with `python3 scripts/preview.py`.
- Save screenshots, preview copies, logs, and one-off audit exports under `artifacts/`, which git ignores. Put lasting conclusions in the owning guide.

## Keep it lean

- Each change removes what it makes obsolete: code, tests, styles, config, scripts, doc sentences, and exported files. Search for leftover references before finishing.
- Add a file, option, abstraction, dependency, or document only for a current need, preferring the file that already owns the topic. Completed work needs no report: the owning guide states the result, and the commit message records the change and its checks.
- Guides describe the current state. When a feature or rule is removed, delete its requirement rather than adding “omit X,” unless a specific regression is likely.
- Git history is the archive. Do not keep superseded documents, “before” copies, commented-out code, or unused compatibility paths for reference. A dated report lives only while it has pending recommendations; then fold its outcome into the owning guide and delete it.
- Flag unused material noticed outside the task rather than leaving it silently.

## Verification and completion

- Run `node scripts/check_trains.mjs` after a change to the train page or the data.
- Verify UI changes in the local preview at 360, 768, 1,280, and 1,440 pixels, including URL restore, Back, and empty, error, and missing-data states.
- Report what changed, what was removed, what was verified, and what remains open. Do not claim checks or measurements that were not run.
