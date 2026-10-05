"""ClassPulse live classroom demo. Python 3 standard library only."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import argparse, json, threading, os
from urllib.parse import unquote, urlsplit
ROOT = Path(__file__).resolve().parent
KEYS = {'classpulse_student_pulse','classpulse_intervention_state','classpulse_voice_messages','classpulse_support_requests','classpulse_teaching_visual','classpulse_session_ended'}
ARRAY_KEYS = {'classpulse_voice_messages','classpulse_support_requests'}
STATE_FILE = ROOT / 'demo-state.json'
LOCK = threading.Lock()
try:
    STATE = json.loads(STATE_FILE.read_text())
    if not isinstance(STATE, dict): STATE = {}
except (OSError, ValueError): STATE = {}
class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs): super().__init__(*args, directory=str(ROOT), **kwargs)
    def reply(self, data, status=200):
        payload=json.dumps(data).encode(); self.send_response(status)
        self.send_header('Content-Type','application/json'); self.send_header('Cache-Control','no-store')
        self.send_header('Content-Length',str(len(payload))); self.end_headers(); self.wfile.write(payload)
    def do_GET(self):
        if self.path == '/api/state':
            with LOCK: self.reply(STATE)
        elif Path(unquote(urlsplit(self.path).path)).name in ['demo-state.json','demo-state.tmp','server.py']:
            self.send_error(404)
        else: super().do_GET()
    def do_POST(self):
        if self.path != '/api/state': self.send_error(404); return
        # Same-origin writes only. No cross-origin classroom updates.
        origin=self.headers.get('Origin')
        if origin and origin not in ('http://'+self.headers.get('Host',''),'https://'+self.headers.get('Host','')):
            self.reply({'error':'Origin not allowed'},403); return
        try:
            length=int(self.headers.get('Content-Length','0'))
            if length <= 0 or length > 200_000: raise ValueError('Invalid size')
            data=json.loads(self.rfile.read(length)); key=data['key']; value=data['value']
            if key not in KEYS: raise ValueError('Unknown key')
            if key in ARRAY_KEYS and (not isinstance(value,list) or any(not isinstance(m,dict) or not isinstance(m.get('id'),str) for m in value)): raise ValueError('Invalid messages')
        except (ValueError, KeyError, TypeError): self.reply({'error':'Invalid request'},400); return
        with LOCK:
            if key in ARRAY_KEYS:
                previous={m['id']:m for m in STATE.get(key,[]) if isinstance(m,dict) and 'id' in m}
                for m in value: previous[m['id']]=m
                value=list(previous.values())
            STATE[key]=value
            tmp=STATE_FILE.with_suffix('.tmp');tmp.write_text(json.dumps(STATE));os.replace(tmp,STATE_FILE)
            self.reply({'ok':True,'value':value})
    def log_message(self, fmt, *args):
        if not self.path.startswith('/api/'): super().log_message(fmt,*args)
if __name__ == '__main__':
    parser=argparse.ArgumentParser(description='Run the single-class ClassPulse demo')
    parser.add_argument('--port',type=int,default=8000)
    parser.add_argument('--host',default='127.0.0.1',help='Use 0.0.0.0 for a trusted classroom Wi-Fi demo')
    args=parser.parse_args(); print(f'Open http://{args.host}:{args.port} (demo accounts only)',flush=True)
    ThreadingHTTPServer((args.host,args.port),Handler).serve_forever()
