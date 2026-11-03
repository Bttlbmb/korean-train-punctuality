# Korean Train Punctuality

How punctual are South Korea’s trains? This static site shows reported arrival delays for Korail trains at <https://bttlbmb.github.io/korean-train-punctuality/>.

The front page shows yesterday and the past 30 days. Each dot for yesterday is a train; selecting one opens its page, with a row for every stop and one dot for each recorded day.

## Data and credits

The delays are reported by Korail and collected by a separate private scraper. They are not official statistics, and a figure that cannot be computed is shown as a dash. The train list and station positions come from Mikołaj Kuranowski’s GTFS (CC BY 4.0). The map outline is from Natural Earth (public domain).

## Working on the site

The site is plain HTML, CSS, and ES modules, with no build step. `data/` holds the files that the exporter in the private backend repository writes; do not edit it by hand. [BUILD_NOTES.md](BUILD_NOTES.md) covers the preview, publishing, and decisions, and [AGENTS.md](AGENTS.md) the working rules.
