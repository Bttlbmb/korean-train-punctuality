# Korean Train Data website

This repository holds the static site. It opens on a start page (`index.html`). The full site (`app.html`) has 5 navigation sections (Overview, Trains, Stations, Journey, and About) plus train and station detail pages. It uses the handover token names with the Porcelain palette, SVG charts, plain JavaScript modules, and query-string routes, with no build step or third-party scripts. The backend repository holds the handover specs in `handover/`: `#1` specified the first version and `#2` added Stations and Journey. [Interface](#interface) states where the current site departs from them.

## Preview

```sh
python3 scripts/preview.py
```

Open <http://127.0.0.1:8765/> for the start page and <http://127.0.0.1:8765/app.html> for the full site. The server binds only to the local machine.

Example routes: `/app.html?view=stations`, `/app.html?view=station&station=daejeon`, and `/app.html?view=journey&from=seoul-all&to=busan-all&depart=05-08`.

`data/` holds the export that the backend’s `exporter/export_site_data.py` writes. `data/meta.json` records the complete-date range and any date still collecting. To refresh the site, run the export described in the backend’s `BUILD_NOTES.md`, which writes here by default when the two repositories sit side by side.

## GitHub Pages

The handover specifies GitHub Pages. This repository has no remote yet, so the static files are prepared but not published.

Serve the repository root with Pages. Keep `.nojekyll`. `index.html`, `app.html`, local scripts and styles, and data requests all use relative URLs, so `/repository-name/app.html?view=train&train=117-ktx&window=month` works unchanged. Commit the refreshed static data after each successful export, then publish. This repository holds no database, scraper control file, or key, and must stay that way.

No runtime requests are made except the site’s own data and assets and Google Fonts. Fonts have local system fallbacks. Source-credit links are ordinary navigation links.

## Definitions and decisions

- The site draws figures from the exporter’s files; the backend’s `BUILD_NOTES.md` owns the metric definitions.
- Day strips preserve calendar gaps and distinguish dates not collected from unavailable or missing records. Chart values are also exposed in screen-reader tables; marks support keyboard focus and touch tooltips.
- Controls replace the current query state; moving between views pushes a history entry. Search and sorting are preserved in URLs.
- The hours files give only counts per hour, so the Yesterday dot fields place each late dot at random inside its hour, seeded by the date. A dot’s position means its hour and nothing finer.
- Guides describe the current state, and git history is the archive; the owner decided this on 8 October 2026. Completed work gets no dated report or “before” copy; the commit message records the change and its checks.
- Repository documentation follows [the writing guide](docs/writing.md): American spelling with day-first dates such as 8 October 2026, matching the existing documents and the site’s own date format. It applies to text written or edited from 8 October 2026; existing passages are not rewritten for style alone. Each repository keeps its own copy of the guide; the copies differ only where they name that repository’s documents, so apply a change to both.
- The owner split the project into the `backend` and `website` repositories on 23 October 2026, without carrying over the earlier git history.

## Interface

The site follows the handover specs except where this section differs; this section wins. Each view shows what an average visitor needs to answer “how punctual are the trains?”, and About holds the collection detail.

- **Header and navigation:** the site name, plus “<date> still collecting” (linking to collection status) while a day is in progress. Navigation labels are Overview, Trains, Stations, Journey, and About. The navigation fades and shows an arrow at each overflowing edge, and keeps the current tab visible.
- **Start page:** `index.html`, with `js/start.js`, is the front page: a single page with no navigation and no link to the full site. It has one row per period, Yesterday and the past 30 days. Each row has a 64-pixel share of stops within 5 minutes, one sentence, and support lines (late count, typical delay when late, and for the past 30 days the worst day), and a visual of the same height. Yesterday draws one dot per train in order of departure, in the late color when the train had at least one reported stop more than 5 minutes late (a train with no countable stops is grey). Hover and arrow keys name the train, and a screen-reader table lists the trains with a late stop. The past 30 days draws one bar per calendar day on a true 0–100% axis, and a short outlined stub marks a day not collected. Hover, touch, and arrow keys on the bars show that day’s share and late stops. When the window holds fewer than 30 complete days, the sentence says “the N days collected so far.” The page reads `meta.json`, `days.json`, the Yesterday and Past month window files, and one hours file. The full site is `app.html`, and a start page request with a `view` parameter redirects there with its query, so older public links still work.
- **Time windows:** Yesterday, Past month, and This year. `window=week` links resolve to Past month and `window=all` to This year, and the URL is rewritten in place. The exporter still writes `week` and `all` files, which the site does not request.
- **Train type filter:** on Trains, Stations, Station detail, and Journey. On phones it sits behind a Filters button that shows the active type. The Overview always covers all train types and ignores a `type` parameter.
- **Train labels:** the train type leads the number in every train table.
- **Overview:** a one-sentence statement leads, with the share of stops within 5 minutes in bold (for example, “94.7% of Korail train stops were on time yesterday”). On Past month and This year it also names the worst day when the window holds at least 2 days. A line under it gives the late and total stop counts, the typical delay when late, the date or date range, the comparison, and an ⓘ link to the method. Yesterday shows one dot per stop from the day’s hours file, in scheduled-arrival order, and Past month shows Day by day. This year shows the calendar. A Planning a trip row links four popular journeys, the Trains list, and the Stations list. Notable items show their tag (Worst day, Recurring, or Large delay), the time when one applies, and a sentence; `fewer_trains` items appear in About instead, so up to 3 exported items may display as 2. The Least punctual table shows #, Train, Route, and either Final stop (Yesterday) or Within 5 min and When late. Day by day starts its axis at 80%, or at 60% when any day falls below 80%, and the header names the floor. The This year calendar starts at the first month with collected data and keeps the rest of the year.
- **Trains list:** search sits in the table card header. Columns are #, Train, Route, Within 5 min, When late, and Past 30 days. Clicking the “Within 5 min” header toggles least and most punctual; “When late” is also sortable. On phones, the route and departure time sit under the train name instead of in a Route column.
- **Train page:** back link, title, meta line (scheduled times, stops, “ran X of Y days”, and date range), then the window tabs. Figures are Stops within 5 min, On time at the final stop, and Typical delay when late. One card holds the route chart, with a line per day and the median day, and Day by day. The route chart labels stops on one row and skips labels that would collide; the first and last stops always keep their labels, and every stop keeps a tick. Stops and scheduled times are open by default. Timetable history appears only when a timetable change falls inside the selected window.
- **Stations list:** search sits in the table card header. Columns are #, Station, Within 5 min, When late, and Past 30 days; the “Within 5 min” header toggles least and most punctual. The table footnote explains that stations late on long routes inherit earlier delay.
- **Station detail:** the meta line under the title holds the train types, arrivals per day, and date range. Figures are Within 5 min (with comparison) and Typical delay when late. Trains stopping here shows Arrives, Train, Route, Within 5 min here, and When late. Station charts keep the handover color scales, except that heatmap cells under 4% late use `--ontime`.
- **Journey:** station controls use compact labeled rows, and the table note names the timetable source. Plots are 340 pixels wide, with larger dots for arrivals more than 5 minutes late, smaller green dots for the rest, aligned scale labels, and a 5-minute reference line. Each reported day has a tooltip and an accessible table entry. The Within 5 min tooltip gives the reported-arrival count and median delay; the median also breaks ties in reliability sorting. Missing values and services with fewer than 5 reports keep their distinct treatment. On phones, each row stacks departure, train, and Within 5 min above arrival and journey time, with the plot full width below.
- **About:** opens with a contents line linking to each section (`#shows`, `#method`, `#limits`, `#collection`, `#sources`). It shows the window’s Korail measure in the method table, the complete-day range, the latest day’s found, candidate, unavailable, pending, and error counts, the latest complete day’s missing-value count, any “fewer trains found” notices, and the “not official statistics” statement under Sources. The footer is a single credits line linking to `#sources`.
- **Colors:** `tokens.css` holds the Porcelain palette: nearly neutral greys, an ink-navy accent, and a muted terracotta delay ramp. Green means on time, the warm ramp means late, grey is neutral, and blue marks focus; this departs from the handover rule that grey means on time. An arrival within 5 minutes counts as on time, so delay scales color it green (`--ontime` for bars and cells, the darker `--ontime-mark` for dots, ticks, and lines), and `--d1` appears only in share scales. The accent marks links, tabs, hover, and the route median line; headline figures use `--ink`. Public-holiday shading uses `--line-soft`, and the coverage chart’s found counts use `--faint`, because they do not measure punctuality. `favicon.svg` and the `theme-color` meta tag repeat the accent and canvas values.
- **Legends:** every color scale has a legend that names what it measures and labels each step. The Trains and Stations legends sit above their tables and are hidden with the Past 30 days column on phones; the two strips measure different things (final-stop delay and the daily share within 5 minutes). Both cover the last 30 calendar days, so collection gaps stay visible, and the station strip hatches collected days without countable arrivals.

Layout:

- At 560 pixels and narrower, the Overview Day by day chart is drawn narrower so all bars fit without sideways scrolling. Crossing that width re-renders the Overview. The dot field scales to its container: it picks a dot spacing of 2–4 pixels that makes it about 90 pixels tall.
- At 901 pixels and wider, the Trains and Stations table headers stay visible while scrolling; narrower screens scroll tables horizontally.
- The station arrival chart scrolls sideways on phones so individual ticks stay selectable.

## Stations and journeys

`js/stations.js` implements station rankings, English/Korean search, figures, date stepping, arrival ticks, weekday/hour grids, and the stopping-train table. `js/journey.js` implements searchable keyboard-accessible station/group selectors, swap, departure blocks, window/type filters, reliability sorting, and destination-delay dot plots. Station names link from train stop tables and the first station named in each notable item. Navigation and control state remain in the URL; controls replace history, while moving to another station or train pushes it. Focus is restored after a control updates the page.

The journey view discloses missing journey source files. A single-type station can use its whole-station statistics. Station detail derives absent summaries and per-type grids from the actual arrival tuples, but only when the available history covers the selected window. No type-specific percentage is guessed from a station’s type labels. The display infers a clock wrap for rows without an arrival day offset, as in the handover samples; collected exports provide explicit offsets.

Journey requests only advertised source files and preserves the group-member order and partial-coverage notice. An advertised file that unexpectedly fails to load still shows the retry state. The site loads only the shards for the requested destinations.

## Checks

- In the local preview, check every view at 360, 768, 1,280, and 1,440 pixels: windows and type filters, search, sorting, pagination, station date stepping, journey selection, swap, and time blocks, URL restore and Back, and the missing-detail, empty, error, and sharded-data states. Wide charts and tables scroll inside their own containers.
- In the export through 6 October 2026, the Overview loads 323,045 bytes of JSON in 5 files for Yesterday and 403,498 bytes in 4 files for Past month, **over the 300 KB budget** in both cases; `data/windows/month.json` alone is 360,393 bytes.

## Open proposals

| Proposal | Status |
| --- | --- |
| Delay recovery, Delay fabric, and Arrival ranges charts from the [visual research](docs/research/visual-ideas-2026-10-08/research.json) | Recommended there; not adopted |
