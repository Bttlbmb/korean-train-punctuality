"""Prepare compact, provenance-labeled inputs for the exploratory charts."""
import collections
import csv
import datetime
import json
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[3]
BACKEND = ROOT.parent / 'backend'
OUT = Path(__file__).resolve().parent
conn = sqlite3.connect(
    f"file:{BACKEND / 'database/korail_history.sqlite3'}?mode=ro&immutable=1", uri=True
)
conn.row_factory = sqlite3.Row
translations = {r['korean']: r['english'] for r in csv.DictReader((BACKEND / 'stations_en.csv').open())}
translations['울산(통도사)'] = translations['울산']
def minute(clock, day, operating):
    if clock is None:
        return None
    calendar_day = datetime.datetime.strptime(day, '%Y%m%d').date() if '-' not in day else datetime.date.fromisoformat(day)
    offset = (calendar_day - datetime.date.fromisoformat(operating)).days
    hour, minutes = map(int, clock.split(':'))
    return 1440 * offset + hour * 60 + minutes

trains = collections.OrderedDict()
for row in conn.execute('SELECT * FROM arrivals ORDER BY run_id, stop_ordinal'):
    row = dict(row)
    key = str(row['run_id'])
    train = trains.setdefault(key, {'number': row['train_number'], 'type': row['train_type'], 'stops': []})
    scheduled = minute(row['scheduled_arrival_time'], row['scheduled_arrival_date'], row['operating_date'])
    delay = row['reported_arrival_delay_minutes'] if row['delay_status'] == 'reported_by_korail' else None
    train['stops'].append({
        'name': translations.get(row['station'], row['station']),
        'ko': row['station'], 'ordinal': row['stop_ordinal'],
        'scheduled': scheduled, 'delay': delay,
        'observed': scheduled + delay if scheduled is not None and delay is not None else None,
        'departure': minute(row['scheduled_departure_time'], row['scheduled_departure_date'], row['operating_date']),
    })
trains = list(trains.values())
day = dict(conn.execute('SELECT * FROM collection_days').fetchone())
operating_date = (datetime.date(1970, 1, 1) + datetime.timedelta(days=day['run_day'])).isoformat()
reported = sum(s['delay'] is not None for t in trains for s in t['stops'])

def read(name):
    return json.loads((ROOT / 'data' / name).read_text())

station_list = read('stations/list-month.json')
sample_journeys = read('journeys/seoul.json')
journeys = sample_journeys['destinations']['busan']
selected_numbers = [1, 3, 5, 7, 11, 9, 13, 117]
selected_journeys = [r for n in selected_numbers for r in journeys if r['number'] == n]
station_rows = sorted(station_list['stations'], key=lambda r: r['per_day'], reverse=True)[:16]
bundle = {
    'real': {
        'source': 'database/korail_history.sqlite3 · arrivals view',
        'date': operating_date, 'complete': day['completed_at'] is not None,
        'found': len(trains), 'candidates': day['expected_count'], 'reported': reported,
        'trains': trains,
        'mareyNumbers': [1, 3, 5, 7, 9, 11, 13, 15, 17],
        'ridgeStations': ['Gwangmyeong', 'Cheonan-Asan', 'Daejeon', 'Dongdaegu', 'Ulsan', 'Busan'],
    },
    'sample': {
        'source': 'data · explicitly simulated dashboard sample',
        'from': station_list['from'], 'to': station_list['to'],
        'dates': station_list['dates'],
        'stations': [{k: r[k] for k in ['id', 'name', 'per_day', 'share_punctual', 'daily_share_punctual']} for r in station_rows],
        'journeys': [{k: r[k] for k in ['number', 'type', 'departure', 'arrival', 'delays']} for r in selected_journeys],
    },
}
assert reported == conn.execute("SELECT count(*) FROM arrivals WHERE delay_status='reported_by_korail' AND reported_arrival_delay_minutes IS NOT NULL").fetchone()[0]
assert not bundle['real']['complete']
assert all(len(r['daily_share_punctual']) == len(bundle['sample']['dates']) for r in station_rows)
assert all(len(r['delays']) == len(sample_journeys['dates']) for r in selected_journeys)
(OUT / 'data.json').write_text(json.dumps(bundle, ensure_ascii=False, separators=(',', ':')))
print(f"Collected: {operating_date}, {len(trains)}/{day['expected_count']} candidates, {reported} reported arrivals, incomplete day.")
print(f"Sample: {len(station_rows)} stations × {len(station_list['dates'])} dates; {len(selected_journeys)} Seoul–Busan services.")
