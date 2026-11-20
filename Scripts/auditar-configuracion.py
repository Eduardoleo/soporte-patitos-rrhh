"""Inventario estático local. No contacta endpoints ni imprime valores de secretos."""
from pathlib import Path
import json
import os
import re

root = Path(__file__).resolve().parents[1]
excluded = {'.git', '.vs', '.local', 'node_modules', 'bin', 'obj', 'build', 'dist', '__pycache__'}
extensions = {'.cs', '.js', '.jsx', '.json', '.config', '.pubxml', '.yml', '.yaml', '.sql', '.txt', '.html'}
endpoint = re.compile(r'https?://[a-zA-Z0-9._:-]+')
secret = re.compile(r'''(?i)["']?(?:password|pwd|secret|api[_-]?key)["']?\s*[:=]\s*["']([^"']+)["']''')
records = []
for directory, folders, files in os.walk(root):
    folders[:] = [folder for folder in folders if folder not in excluded]
    for name in files:
        path = Path(directory) / name
        if path.suffix.lower() not in extensions or name.endswith('.local.json') or name == 'package-lock.json':
            continue
        for number, line in enumerate(path.read_text(encoding='utf-8-sig', errors='replace').splitlines(), 1):
            for match in endpoint.finditer(line):
                records.append({'file': path.relative_to(root).as_posix(), 'line': number, 'kind': 'url', 'host': match.group()})
            if secret.search(line):
                records.append({'file': path.relative_to(root).as_posix(), 'line': number, 'kind': 'possible_literal_secret', 'value': '[REDACTED]'})
            if re.search(r'(?i)(?:password|pwd)\s*=(?![=\s])[^;"\s]+', line):
                records.append({'file': path.relative_to(root).as_posix(), 'line': number, 'kind': 'possible_connection_password', 'value': '[REDACTED]'})
output = root / '.local' / 'configuration-audit.json'
output.parent.mkdir(exist_ok=True)
output.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding='utf-8')
print(json.dumps({'records': len(records), 'possible_secrets': sum(r['kind'] != 'url' for r in records), 'report': '.local/configuration-audit.json'}))
