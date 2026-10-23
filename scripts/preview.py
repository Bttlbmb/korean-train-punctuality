#!/usr/bin/env python3
"""Serve this site for local previews."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(root), **kwargs)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

print('Preview: http://127.0.0.1:%d/' % args.port, flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
