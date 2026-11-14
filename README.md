# Korean Train Stats

How punctual are South Korea’s trains? This static site shows reported arrival delays for Korail trains at <https://koreantrainstats.com/>.

The front page shows yesterday and the past 30 days. Each dot for yesterday is a train; selecting one opens its page, with a row for every stop and one dot for each recorded day. The all-trains page lists every train with its share of stops within 5 minutes, and filters by train type and station. A station page, such as `station/daejeon/`, shows the station on the map, its most and least punctual trains, and a table of every train that calls there. The all-stations page lists every station with its trains and punctuality, and the front page’s header links to it.

The build supplies English and Korean versions. Korean pages use `/ko/`, and the language switch keeps the current page and train-list filters.

## Data and credits

The delays are reported by Korail and collected by a separate private scraper. They are not official statistics, and a figure that cannot be computed is shown as a dash. The compilation and figures are licensed under CC BY 4.0; Korail’s rights in its underlying data are unaffected. The train list and station positions come from Mikołaj Kuranowski’s GTFS (CC BY 4.0). The map outline is from Natural Earth (public domain).

## Working on the site

The site is plain HTML, CSS, and ES modules. `scripts/build.mjs` writes the train and day pages as HTML with those same modules, and GitHub Actions runs it before publishing. `data/` holds the files that the exporter in the private backend repository writes; do not edit it by hand. [BUILD_NOTES.md](BUILD_NOTES.md) covers the preview, publishing, and decisions, and [AGENTS.md](AGENTS.md) the working rules.
