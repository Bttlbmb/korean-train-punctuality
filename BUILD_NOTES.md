# Korean Train Punctuality website

This public repository is [Bttlbmb/korean-train-punctuality](https://github.com/Bttlbmb/korean-train-punctuality). It holds the static site: a front page (`index.html`) and one page for each train (`app.html?train=<id>`). It uses the Porcelain palette in `tokens.css`, SVG and canvas drawing, and plain JavaScript modules, with no build step or third-party scripts. The backend repository holds the handover specs in `handover/`, which defined the first version of the site and its data contract. [Interface](#interface) states where the current site departs from them.

## Preview

```sh
python3 scripts/preview.py
```

Open <http://127.0.0.1:8765/> for the front page and, for example, <http://127.0.0.1:8765/app.html?train=456-ktx> for a train page. The server binds only to the local machine.

`data/` holds the export that the backend’s `exporter/export_site_data.py` writes. The site reads `meta.json`, `days.json`, `windows/yesterday.json`, `windows/month.json`, `stations/index.json`, and `trains/<id>.json`. `meta.json` records the complete-date range and any date still collecting. To refresh the site, run the export described in the backend’s `BUILD_NOTES.md`, which writes here by default when the two repositories sit side by side.

## GitHub Pages

GitHub Pages publishes the repository root on `main` at <https://bttlbmb.github.io/korean-train-punctuality/>.

Serve the repository root with Pages. Keep `.nojekyll`. `index.html`, `app.html`, local scripts and styles, and data requests all use relative URLs, so `/repository-name/app.html?train=117-ktx` works unchanged. Commit the refreshed static data after each successful export, then publish. This repository holds no database, scraper control file, or key, and must stay that way.

No runtime requests are made except the site’s own data and assets and Google Fonts. Fonts have local system fallbacks. Source-credit links are ordinary navigation links.

## Definitions and decisions

- The site draws figures from the exporter’s files; the backend’s `BUILD_NOTES.md` owns the metric definitions.
- Day by day preserves calendar gaps and distinguishes dates not collected from unavailable or missing records. Chart values are also exposed in screen-reader tables; marks support keyboard focus and touch tooltips.
- Guides describe the current state, and git history is the archive; the owner decided this on 8 October 2026. Completed work gets no dated report or “before” copy; the commit message records the change and its checks.
- Repository documentation follows [the writing guide](docs/writing.md): American spelling with day-first dates such as 8 October 2026, matching the existing documents and the site’s own date format. It applies to text written or edited from 8 October 2026; existing passages are not rewritten for style alone. Each repository keeps its own copy of the guide; the copies differ only where they name that repository’s documents, so apply a change to both.
- The owner split the project into the `backend` and `website` repositories on 23 October 2026, without carrying over the earlier git history.
- The owner named the public site Korean Train Punctuality, placed it at `Bttlbmb/korean-train-punctuality`, and kept its scraper and exporter in the private `Bttlbmb/korean-train-punctuality-generator` repository.
- The owner chose the logo on 2 November 2026: a KTX profile on a rail inside a double ring, drawn in `--ink` rather than the accent so the header adds no color beyond the data colors. `logo.svg` sits at 1.2 times the wordmark size and is centered on it; `favicon.svg` is the same train in the canvas color on an ink disc.
- The owner described the site on 3 November 2026 as a front page with train pages. The Overview, Trains, Stations, Station, Journey, and About views, their code, and the data files only they read were removed that day.
- The owner chose the train page design on 2 November 2026: a brand-only header, a compact row of three figures, one row per stop with a dot for each recorded day, no window tabs, and no timetable sections. The owner also chose a small filled map of South Korea with the route in `--ink` beside the heading. It takes station coordinates from the exporter and the outline from Natural Earth (public domain), which the owner approved downloading on 3 November 2026.

## Interface

The data the site reads is listed in the backend’s `BUILD_NOTES.md` under Published files; the handover specs still define the metric definitions. This section wins where they disagree.

- **Start page:** `index.html`, with `js/start.js`, is the front page: a single page with no navigation, whose Yesterday dots lead to the train pages. It has one row per period, Yesterday and the past 30 days. Each row has a 64-pixel share of stops within 5 minutes, one sentence, and support lines (the typical delay when late, and for the past 30 days the best and worst days), and a visual of the same height. Yesterday draws one dot per train in order of departure, in the late color when the train had at least one reported stop more than 5 minutes late (a train with no countable stops is grey). Hover and arrow keys name the train. A click, or Enter on a selected dot, opens its page; on touch screens the first tap selects a dot, and a second tap on it opens the page. A screen-reader table lists the trains with a late stop. The past 30 days draws one bar per calendar day on a true 0–100% axis, and a short outlined stub marks a day not collected. Hover, touch, and arrow keys on the bars show that day’s share and late stops. When the window holds fewer than 30 complete days, the sentence says “the N days collected so far.” The page says “yesterday” and “past 30 days” only when the newest complete date is yesterday in Korea time. Otherwise the labels name the dates: the Yesterday row shows the weekday and date, and the 30-day row shows the date range and says “the 30 days to 24 Oct.” The page reads `meta.json`, `days.json`, and the Yesterday and Past month window files.
- **Train page:** `app.html?train=<id>`, with `js/app.js` and `js/train.js`, has no navigation. Only the site name heads the page, and it links to the front page. A request without a well-formed train id goes to the front page; an id with no train file shows an empty state. The page always covers the past month, so it has no window tabs and loads no window file.
  - **Heading:** a back link to the front page, the title, and a meta line (scheduled times, stops, and the date range), then three figures in one row: Stops within 5 min, On time at the final stop, and Typical delay when late. A small map of South Korea sits to the right, centered on the title, meta line, and figures: a grey landmass with the route in ink, drawn from `latitude` and `longitude` in `stations/index.json` and the outline in `js/korea.js`. It is decoration, so screen readers skip it, and it is left out unless every stop has coordinates.
  - **Stop list:** the card title is “Delay at every stop in the past 30 days.” There is a row for each stop, with its scheduled time at the left: the arrival, or at the origin the departure, marked “departs”. The origin has no arrival delay, so its row has no dots. A time after midnight carries a small +1. Each row shows one dot per recorded day at its delay in whole minutes, green within 5 minutes and orange later, with a dashed line between 5 and 6 minutes. A small “5 min” label above the first row names that line; the list has no minute scale, because the card caption says the unit is minutes. Stop names are plain text. Each row shows its share of days within 5 minutes at the right, or a dash when no arrival was reported; the tooltip gives the full count. On phones the “departs” mark is hidden and the time column narrows.
  - **Day by day:** one cell per calendar day, filling the card’s width, colored by the delay at the final stop. A mark shows a timetable change.
- **Colors:** `tokens.css` holds the Porcelain palette: nearly neutral greys, an ink-navy accent, and a muted terracotta delay ramp. Green means on time, the warm ramp means late, grey is neutral, and blue marks focus; this departs from the handover rule that grey means on time. An arrival within 5 minutes counts as on time, so delay scales color it green (`--ontime` for bars and cells, the darker `--ontime-mark` for dots), and `--d1` appears only in share scales. The accent marks links, hover, and focus; headline figures use `--ink`. `theme-color` repeats the canvas value.
- **Legends:** every color scale has a legend that names what it measures and labels each step.

## Checks

- In the local preview, check the front page and a train page at 360, 768, 1,280, and 1,440 pixels: the dot click-through, Back, the empty, error, and missing-data states, and that no request fails. Wide content scrolls inside its own container, never the page.
