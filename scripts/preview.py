#!/usr/bin/env python3
"""Build the site into _site/ and serve it for local previews. Restart it to pick up a change."""
import argparse
import subprocess
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8765)
args = parser.parse_args()
root = Path(__file__).resolve().parents[1]
subprocess.run(['node', str(root / 'scripts/build.mjs')], check=True)
site = root / '_site'

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(site), **kwargs)
    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)
        content = (site / '404.html').read_bytes()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

print('Preview: http://127.0.0.1:%d/' % args.port, flush=True)
ThreadingHTTPServer(('127.0.0.1', args.port), Handler).serve_forever()
