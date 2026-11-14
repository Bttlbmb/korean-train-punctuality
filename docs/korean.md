# Korean language

The Korean site lives under `/ko/`, with an equivalent for every English front, train, train-list, station, all-stations, all-journeys, day, and month page. Header language links keep the current page; the train-list switch also keeps filters and sorting. Run `python3 scripts/preview.py` and open <http://127.0.0.1:8765/ko/>. The normal publishing build generates both languages.

## Glossary

Railway labels follow the references below. Statistical labels describe this site's own measures; they are editorial choices, not official Korail metric names.

| Meaning | Korean | Usage |
| --- | --- | --- |
| Station name | 역명 | Use the source `station_ko` value. |
| Departure and arrival | 출발 · 도착 | Timetable events; the origin has no arrival delay. |
| Scheduled time | 예정 시각 | Avoid 예상 시각, which suggests a forecast. |
| Stop and final stop | 정차역 · 종착역 | Station rows and the final-arrival chart. |
| Arrival delay | 도착 지연 | Delay relative to scheduled arrival. |
| Share of countable arrivals at most 5 minutes late | 5분 이내 도착 비율 | Count arrival records across stops and dates, not unique stations or trains. Include early arrivals and exactly 5 minutes; exclude origins and missing values. |
| Median delay among arrivals more than 5 minutes late | 5분 넘게 늦은 도착의 지연 시간 중앙값 | Full delay, not just the part exceeding 5 minutes; 5분 초과 지연 시간 reads as only the excess. Rounded to whole minutes. Never 평균. |
| Complete collection dates in a window | 수집 완료 N일 | Show the date range; complete collection dates can have calendar gaps. |
| No run record | 운행 기록 없음 | Does not establish that a train did not operate. |
| Uncollected date, unavailable lookup, missing final value | 미수집 · 조회 불가 · 종착역 도착 자료 없음 | Preserve these distinct states. |
| Timetable change | 시간표 변경 | A changed schedule, not proof of a delay. |
| Where a train started or ends | 이 역에서 출발 · 이 역이 종착역 | Station pages. 출발 is the departing event, so a count of trains that start at the station reads 그중 N편은 이 역에서 출발, not 출발 N편. |
| First and last station filters, all-trains page | 출발역 · 종착역 | They match a train’s first and last station only; 도착역 would suggest any arrival stop. |
| A journey between two stations (all-journeys page) | 구간 · 출발역 · 도착역 | 전체 구간 is the page; the From and To dropdowns are 출발역 and 도착역 because any station may be chosen. 운행 구간 on the all-trains page means a train’s own route, so 구간 alone is the journey. Card notes say 도착역 도착 기록 중, never 두 번째 역. Unreviewed by a native reader. |
| Typical scheduled time between two stations | 예정 소요 시간 | The median over the trains that serve the journey, from the timetable, not observed. 대표 was dropped because it reads as official. Shown as hours and minutes from 60 minutes (1시간 35분), unlike delays, which switch at 100. |
| Final destination column | 방면 | Station-board wording and the English “Toward”; it shows the train’s last stop. 행선지 is the more exact term and an open option. Sort labels end in 순 (열차 번호 순, 방면 순, 이름 순). |
| Trains stopping at a station | 정차 열차 · 열차 N편 정차 | Count distinct trains by train number. Table sort and column labels use 정차 열차; the type column is 정차 열차 종류. Where a loop train calls twice (Hongseong) the table counts stops: 전체 정차 N회 중 N회. |
| Back arrow after another page of the site | 이전 페이지로 | The arrow goes back one step; its label when it leads to the front page is 처음으로. |
| Short record on a train page | 기록이 N일뿐이어서 열차·역 목록에는 비율을 표시하지 않습니다 | A train with fewer than 10 recorded days keeps its figures; this line says why the lists show a dash. |
| Counters | 편 (trains) · 건 (arrival records) · 곳 (stations) · 개 (journeys) | 열차 429편, 도착 기록 10,261건, 역 272곳, 구간 176개. In a table cell under a column named 열차 the count is bare (203편), as on the station table; the lists and phone lines keep 열차. |
| Basis of a count | 도착 기록이 N일 이상인 열차 | A station page ranks trains with 20 or more days of reported arrivals at that station and shows a dash under 10. Never 운행 기록, which suggests days the train ran. |

Use compact noun labels and neutral 합니다 sentences. Dates and weekdays use Korean formatting, with times in Korea time. Keep the brand Korean Train Stats. Service groups retain the existing classification: KTX, ITX-새마을, ITX-마음, ITX-청춘, 무궁화호, 기타. These groups can combine services; translation must not infer a specific train variant.

The percentage's definition stays in the footer. Avoid 정시율 on its own: readers could interpret it as a train-based measure. The footer says the share differs from the 정시율 that Korail publishes without naming Korail's definition, which sources give inconsistently (UIC's 15 minutes 59 seconds, or 5 minutes for KTX and 10 for other trains) and which has not been verified against a Korail source. Write 이내 for every limit that includes 5 minutes, never 이하. State the final-stop denominator as “도착 기록 30일 중 24일,” excluding days without a reported final arrival.

## Routes and data

Korean pages use the same data and chart calculations as English. Metadata, accessible labels, missing-data states, and legends are localized. Every indexable pair has its own canonical URL and reciprocal `hreflang` annotations. The built sitemap lists both languages. A missing `/ko/` address receives Korean wording from the shared GitHub Pages fallback.

Station filter values remain the established English URL values while labels use Korean. Station names come from the exporter’s archive-wide `name_ko` field, supplemented by `station_ko` in the current train files. The build rejects an unresolved name. Korean month figures pool archived day records and preserve the exporter’s bucket counts and ranking order.

## References

- [Korail train times](https://www.korail.com/korail/com/ticket/recv/trainTime.do) supplies 역명, 도착, and 출발.
- [Ministry of Land, Infrastructure and Transport description of Korail's train-location service](https://www.korea.kr/multi/visualNewsView.do?newsId=148940224) supplies 정차역 and distinguishes expected arrival information from the schedule.
- [Microsoft Korean localization guide](https://learn.microsoft.com/en-us/globalization/reference/microsoft-style-guides) provides a language-specific style reference.
- [Microsoft message-formatting guidance](https://learn.microsoft.com/en-us/globalization/internationalization/message-formatting) supports translating complete messages with context and locale-aware formatting.
- [Backend definitions](../../backend/BUILD_NOTES.md#definitions-and-decisions) own the statistical meaning.

## Review

Two independent AI agents reviewed the draft separately: one checked Korean naturalness and researched railway terminology; the other checked meaning against the exporter and independently recalculated KTX 21's figures. Their corrections clarified the median label, final-stop denominator, departure-time exception, collection-date gaps, and empty state. The sample has 101 of 120 countable arrivals within 5 minutes, 24 of 30 reported final arrivals within 5 minutes, and a 7-minute median late-arrival delay.

Independent language and accuracy reviews also covered the train list, day pages, and month archive. They clarified ranking eligibility, the largest-delay measure, and the distinction between calculated arrival times and observations. On 12 November 2026 four independent AI agents reviewed the station and all-stations pages (Korail terminology, naturalness, consistency with the other pages, and a script over all 272 Korean pages); they found no grammar or particle errors and led to the 출발, 도착 기록 and 순 wording above. A native Korean reader has not yet tested comprehension in the rendered site.
