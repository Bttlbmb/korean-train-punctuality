# Writing guide

This guide covers Markdown documentation in this repository. Public site text, such as interface labels and the sentences on the front page and train pages, follows the data and wording rules in `AGENTS.md` instead. Apply the guide to text you write or edit; leave untouched passages as they are.

## Principles

- Write for a capable reader who is new to the project. Use plain words and full sentences, including articles.
- Give each sentence one idea. Prefer the active voice and a concrete subject: “The exporter excludes incomplete dates from statistics,” not “Incomplete dates are excluded from statistics.”
- Cut words that add nothing. Link to the guide that owns a rule instead of restating it.
- Spell out relationships instead of using slashes: “train and station pages” or “a train or station,” not “train/station.” Paths, URLs, and fixed names keep their slashes.
- Define a term in plain words where a guide first uses it. Explain a formula in words as well as symbols.
- Spell out an abbreviation at first use, with the short form in parentheses, unless it is common, such as URL, HTML, or CSV.
- Say plainly what is unknown or unverified, and why. Rules do not hedge: they state what to do.
- Write in the third person. Attribute decisions to their source: “The owner retired the rule against modifying the scraper.”

## Registers

- **Rules and specifications** (`AGENTS.md` and “Interface” in `BUILD_NOTES.md`): short instructions or statements in the present tense. “Show a dash when a figure cannot be computed,” not “A dash should be shown.”
- **Guides and README** (`README.md` and `BUILD_NOTES.md`): plain explanation. Lead with what the reader needs to know or do, then give the reason.

Use bulleted lists for steps and parallel items, and prose for reasoning. Use tables for comparisons. Reserve bold for the one fact a reader must not miss.

## Conventions

| Topic | Convention |
| --- | --- |
| Spelling | American: behavior, color, analyze, labeled |
| Lists in a sentence | Comma before the final “and” or “or”: “Overview, Trains, and Stations” |
| Dates | “8 October 2026” in prose, or “8 October” when the year is clear; ISO dates such as 2026-10-08 in filenames, code, data, URLs, and sortable tables |
| Times | 24-hour clock in Korea time: 01:00, 23:55 |
| Numbers | Numerals for counts, measurements, and data, with thousands separators: 3 windows, 1,065 candidates, 94.3% |
| Ranges | En dash without spaces: 5–10 minutes, 7–30 September |
| Sizes | Exact bytes with thousands separators for limits and measurements, such as 500,000 bytes; MiB and GiB for approximate file and memory sizes |
| Dashes | Spaced em dash — sparingly — for an aside |
| Quotation marks | Curly quotes in prose; backticks for paths, commands, identifiers, and URL parameters |
| Headings | Sentence case: “Export after the daily batch” |
| Interface names | The site’s on-screen capitalization: Stops within 5 min, Past month, Typical delay when late |
