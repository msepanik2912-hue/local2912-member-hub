#!/usr/bin/env python3
import json, re, sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
ROOT = REPO / 'public'
DATA = ROOT / 'data'

cba = json.loads((DATA / 'cba_corpus.json').read_text(encoding='utf-8'))
pr = json.loads((DATA / 'personnel_corpus.json').read_text(encoding='utf-8'))

errors = []

def one(records, predicate, label):
    matches = [r for r in records if predicate(r)]
    if not matches:
        errors.append(f'Missing expected record: {label}')
        return None
    return matches[0]

def require_text(record, phrase, label):
    hay = re.sub(r'\s+', ' ', record.get('text','')).lower() if record else ''
    needle = re.sub(r'\s+', ' ', phrase).lower()
    if needle not in hay:
        errors.append(f'Missing expected text for {label}: {phrase}')

art20 = one(cba['records'], lambda r: r.get('kind') == 'article' and r.get('article') == '20', 'CBA Article 20')
require_text(art20, 'right to ask for a Union representative', 'CBA Article 20 representation right')
require_text(art20, 'sole and exclusive means for review', 'CBA Article 20 discipline review')

prob = one(cba['records'], lambda r: str(r.get('section','')).startswith('12.10'), 'CBA Section 12.10')
require_text(prob, 'twelve (12) months', 'CBA probation period')

griev = one(cba['records'], lambda r: str(r.get('section','')).startswith('21.1') and r.get('pdf_page_start') == 100, 'CBA Section 21.1(a)')
require_text(griev, 'within 15 calendar days', 'CBA Step I deadline')
require_text(griev, 'within 10 calendar days', 'CBA Step II/III deadlines')
require_text(griev, 'within 30 calendar days', 'CBA arbitration-request deadline')

principles = one(pr['records'], lambda r: r.get('heading') == 'GOALS AND PRINCIPLES OF THE PERSONNEL RULES', 'Personnel Rules goals/principles')
require_text(principles, 'applicable CBA governs', 'Personnel Rules CBA precedence')

pr_xvi = one(pr['records'], lambda r: r.get('rule') == 'XVI' and r.get('section') == '11', 'Personnel Rule XVI Section 11')
require_text(pr_xvi, 'not eligible to file a grievance under this Rule', 'represented grievance exclusion')

pr_ix = one(pr['records'], lambda r: r.get('rule') == 'IX' and r.get('section') == '1', 'Personnel Rule IX Section 1')
require_text(pr_ix, 'six (6) months', 'general Personnel Rules probation period')

for rel in [
    'index.html','css/styles.css','js/app.js','js/config.js','sw.js','manifest.webmanifest',
    'docs/afscme-city-chicago-cba-2022-2027.pdf','docs/city-chicago-personnel-rules-2025-08-01.pdf',
    'data/cba_corpus.json','data/personnel_corpus.json','data/source_manifest.json','data/retrieval_hints.json',
    'tests/member_questions.json',
    'data/stewards.json','data/announcements.json',
    'google_admin_backend/Code.gs','google_admin_backend/GOOGLE_ADMIN_SETUP.md',
    'data/supplements_corpus.json','data/source_archive.json',
    'google_document_admin/Code.gs','google_document_admin/DocumentAdmin.html','google_document_admin/ADMIN_SETUP.md',
    'google_document_public_feed/Code.gs','google_document_public_feed/PUBLIC_FEED_SETUP.md',
    'STAGE7_IMPLEMENTATION.md','STAGE8_IMPLEMENTATION.md','STAGE9_PLAN.md'
]:
    if not (ROOT / rel).exists() and not (REPO / rel).exists(): errors.append(f'Missing project file: {rel}')


# Stage 5 retrieval regression gate
sys.path.insert(0, str(REPO / 'tools'))
try:
    from evaluate_retrieval import evaluate
    retrieval_summary, _ = evaluate(str(ROOT), use_hints=True)
    if retrieval_summary['top3_pct'] < 100.0:
        errors.append(f"Stage 5 retrieval top-3 gate failed: {retrieval_summary['top3_pct']}%")
    if retrieval_summary['top1_pct'] < 90.0:
        errors.append(f"Stage 5 retrieval top-1 quality below 90%: {retrieval_summary['top1_pct']}%")
except Exception as exc:
    errors.append(f"Could not run Stage 5 retrieval regression: {exc}")

# Stage 6 architecture gate: member-owned ChatGPT handoff, no API billing/key.
app_js = (ROOT / 'js/app.js').read_text(encoding='utf-8')
config_js = (ROOT / 'js/config.js').read_text(encoding='utf-8')
index_html = (ROOT / 'index.html').read_text(encoding='utf-8')
combined = app_js + '\n' + config_js + '\n' + index_html
for forbidden in ['api.openai.com', 'OPENAI_API_KEY', 'ask2912Url']:
    if forbidden in combined:
        errors.append(f'Stage 6 no-API gate failed; found forbidden integration marker: {forbidden}')
for required in ['copy-chatgpt-prompt', 'chatgpt-prompt', 'https://chatgpt.com/']:
    if required not in combined:
        errors.append(f'Stage 6 handoff component missing: {required}')


# Stage 7 live-public-data gate
for required in ['liveDataBaseUrl', 'stewardFeedUrl', 'announcementsFeedUrl']:
    if required not in config_js:
        errors.append(f'Stage 7 configuration component missing: {required}')
for required in ['steward-directory-form', 'calendar-data-status', 'board-data-status', 'home-announcements']:
    if required not in index_html:
        errors.append(f'Stage 7 interface component missing: {required}')
backend = (REPO / 'google_admin_backend/Code.gs').read_text(encoding='utf-8')
if 'function doPost' in backend:
    errors.append('Stage 7 public data endpoint must remain read-only; doPost was found.')
for required in ["case 'board'", "case 'stewards'", "case 'resources'", "case 'announcements'", "case 'events'"]:
    if required not in backend:
        errors.append(f'Stage 7 Google feed missing: {required}')

# Stage 8 no-code document versioning / public-read separation gate
for required in ['documentDataBaseUrl', 'supplementsCorpus', 'sourceArchive']:
    if required not in config_js:
        errors.append(f'Stage 8 document configuration component missing: {required}')
for required in ['source-version-list', 'document-source-mode', 'active-supplement-summary']:
    if required not in index_html:
        errors.append(f'Stage 8 source-version interface component missing: {required}')
for required in ['loadDocumentSource("cbaCorpus"', 'loadDocumentSource("personnelCorpus"', 'loadDocumentSource("supplementsCorpus"', 'source === "supplement"']:
    if required not in app_js:
        errors.append(f'Stage 8 live/versioned source logic missing: {required}')

admin_code = (REPO / 'google_document_admin/Code.gs').read_text(encoding='utf-8')
admin_html = (REPO / 'google_document_admin/DocumentAdmin.html').read_text(encoding='utf-8')
public_doc_feed = (REPO / 'google_document_public_feed/Code.gs').read_text(encoding='utf-8')
for required in ['saveDocument', 'activateDocument', 'archiveDocument', 'publishSnapshots_', 'compareDocument']:
    if required not in admin_code:
        errors.append(f'Stage 8 restricted document admin function missing: {required}')
for required in ['pdfjsLib', 'Analyze PDF', 'Save as draft', 'supplement']:
    if required not in admin_html:
        errors.append(f'Stage 8 document admin UI component missing: {required}')
if 'function doPost' in public_doc_feed:
    errors.append('Stage 8 public document feed must remain read-only; doPost was found.')
for forbidden in ['saveDocument', 'activateDocument', 'archiveDocument', 'setSharing']:
    if forbidden in public_doc_feed:
        errors.append(f'Stage 8 public document feed contains forbidden write/admin marker: {forbidden}')
for required in ["'cbaCorpus'", "'personnelCorpus'", "'supplementsCorpus'", "'sourceManifest'", "'sourceArchive'"]:
    if required not in public_doc_feed:
        errors.append(f'Stage 8 public document feed missing: {required}')

# Catch duplicate HTML ids because they can break screen-reader labels/focus and dynamic source version updates.
ids = re.findall(r'\bid=["\']([^"\']+)["\']', index_html)
duplicates = sorted({x for x in ids if ids.count(x) > 1})
if duplicates:
    errors.append(f'Duplicate HTML ids found: {duplicates}')

if errors:
    print('BUILD VALIDATION FAILED')
    for error in errors: print('-', error)
    raise SystemExit(1)

print('BUILD VALIDATION PASSED')
print(f"CBA records: {len(cba['records'])}")
print(f"Personnel Rules records: {len(pr['records'])}")
print('Critical source-precedence, probation, discipline/representation, and grievance text checks passed.')
print('Stage 6 no-API/member-owned ChatGPT handoff checks passed.')
print('Stage 7 live public-data/read-only integration checks passed.')
print('Stage 8 no-code document versioning and separate read-only public source-feed checks passed.')
print(f"Stage 5 retrieval regression: top-1 {retrieval_summary['top1_pct']}%, top-3 {retrieval_summary['top3_pct']}%.")
