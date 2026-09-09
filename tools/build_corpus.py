#!/usr/bin/env python3
import json, re, sys
from pathlib import Path
try:
    import fitz  # PyMuPDF
except ImportError:
    raise SystemExit('PyMuPDF is required: pip install pymupdf')

ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / 'docs'
DATA = ROOT / 'data'
DATA.mkdir(exist_ok=True)

CBA_PDF = DOCS / 'afscme-city-chicago-cba-2022-2027.pdf'
PR_PDF = DOCS / 'city-chicago-personnel-rules-2025-08-01.pdf'


def clean_lines(text: str):
    lines = [ln.rstrip() for ln in text.replace('\u00ad','').splitlines()]
    # Remove isolated printed page numbers at the end of most pages.
    while lines and not lines[-1].strip():
        lines.pop()
    if lines and re.fullmatch(r'\s*\d+\s*', lines[-1]):
        lines.pop()
    # Some source pages put the printed page number as the first extracted line.
    if len(lines) > 1 and re.fullmatch(r'\s*\d+\s*', lines[0]) and lines[1].strip():
        lines.pop(0)
    return lines


def norm_heading(s: str):
    s = re.sub(r'\s+', ' ', s.strip())
    return s


def add_record(records, record):
    if not record:
        return
    text = '\n'.join(record.pop('_lines', [])).strip()
    if not text and record.get('kind') not in {'article','rule','agreement'}:
        return
    record['text'] = text
    record['pages'] = sorted(set(record.get('pages', [])))
    if record['pages']:
        record['pdf_page_start'] = record['pages'][0]
        record['pdf_page_end'] = record['pages'][-1]
    records.append(record)


def parse_cba():
    doc = fitz.open(CBA_PDF)
    records = []
    index = []
    current = None
    current_article = None
    current_article_title = None
    current_section = None
    current_section_title = None
    seq = 0

    def start(kind, heading, pdf_page, article=None, article_title=None, section=None, section_title=None):
        nonlocal current, seq
        add_record(records, current)
        seq += 1
        current = {
            'id': f'cba-{seq:03d}',
            'source': 'cba',
            'kind': kind,
            'heading': norm_heading(heading),
            'article': article,
            'article_title': article_title,
            'section': section,
            'section_title': section_title,
            'pages': [pdf_page],
            '_lines': []
        }
        return current

    for pno in range(6, len(doc)):  # PDF page 7 onward; body starts here.
        pdf_page = pno + 1
        lines = clean_lines(doc[pno].get_text('text'))

        # Appendix / schedules / side letters: one accessible text record per PDF page.
        if pdf_page >= 128:
            add_record(records, current)
            current = None
            seq += 1
            heading = None
            for ln in lines[:12]:
                st = norm_heading(ln)
                if re.match(r'(?i)^(appendix|schedule|side\s+letter|side\s+lezter)', st):
                    heading = st
                    break
            if not heading:
                if 128 <= pdf_page <= 147:
                    heading = f'Appendix A — PDF page {pdf_page}'
                elif 148 <= pdf_page <= 181:
                    heading = f'Schedules / bargaining unit tables — PDF page {pdf_page}'
                else:
                    heading = f'Side letters — PDF page {pdf_page}'
            records.append({
                'id': f'cba-{seq:03d}', 'source':'cba', 'kind':'supplement',
                'heading': heading, 'article': None, 'article_title': None,
                'section': None, 'section_title': None, 'pages':[pdf_page],
                'pdf_page_start': pdf_page, 'pdf_page_end': pdf_page,
                'text':'\n'.join(lines).strip(),
                'complex_layout': bool(148 <= pdf_page <= 181)
            })
            continue

        i = 0
        while i < len(lines):
            raw = lines[i]
            line = norm_heading(raw)
            if not line:
                if current:
                    current['_lines'].append('')
                i += 1
                continue

            if line == 'AGREEMENT' and pdf_page == 7:
                current_article = None; current_article_title = None
                current_section = None; current_section_title = None
                start('agreement', 'AGREEMENT', pdf_page)
                index.append({'type':'agreement','label':'Agreement','record_id':current['id'],'pdf_page':pdf_page})
                i += 1
                continue

            am = re.match(r'^ARTICLE\s+(\d+)\s*[-–—]+\s*(.+)$', line, re.I)
            if am:
                current_article = am.group(1)
                current_article_title = am.group(2).strip()
                current_section = None; current_section_title = None
                start('article', line, pdf_page, current_article, current_article_title)
                index.append({'type':'article','article':current_article,'title':current_article_title,'label':f'Article {current_article} — {current_article_title}','record_id':current['id'],'pdf_page':pdf_page})
                i += 1
                continue

            # Capture section headings only when the text after "Section" begins with a
            # plausible numeric identifier. This avoids turning ordinary sentences such as
            # "Section to fill..." into false headings.
            sm = re.match(r'^Section\s+(.+)$', line, re.I)
            if sm:
                remainder = sm.group(1).strip()
                m2 = re.match(
                    r'^[-–— ]*(\d+(?:\.\d+)?(?:\s*[-–—]?\s*(?:[A-Za-z]\d?\)?|\([A-Za-z]\)))?)\s*(?:[-–—:]\s*|\s+)(.*)$',
                    remainder
                )
                if m2:
                    ident = re.sub(r'\s+', '', m2.group(1))
                    title = m2.group(2).strip()
                    current_section = ident
                    current_section_title = title
                    start('section', line, pdf_page, current_article, current_article_title, current_section, current_section_title)
                    index.append({'type':'section','article':current_article,'section':current_section,'title':title,'label':line,'record_id':current['id'],'pdf_page':pdf_page})
                    i += 1
                    continue

            if current is not None:
                if pdf_page not in current['pages']:
                    current['pages'].append(pdf_page)
                current['_lines'].append(raw.strip())
            i += 1

    add_record(records, current)
    # Strip near-empty records and add display metadata.
    records = [r for r in records if r.get('text') or r['kind'] in {'agreement','article'}]
    return {
        'metadata': {
            'title': 'Collective Bargaining Agreement between the City of Chicago and AFSCME Council 31',
            'short_title': 'AFSCME–City of Chicago CBA',
            'term': 'July 1, 2022–June 30, 2027',
            'ratified_effective': 'April 24, 2023',
            'authority': 'primary',
            'pdf': 'docs/afscme-city-chicago-cba-2022-2027.pdf',
            'page_count': len(doc),
            'notes': 'Primary source for represented employees. Search results reproduce text extracted from the supplied official PDF; the PDF remains the official visual source.'
        },
        'index': index,
        'records': records,
    }


def parse_personnel():
    doc = fitz.open(PR_PDF)
    records = []
    index = []
    current = None
    current_rule = None
    current_rule_title = None
    current_section = None
    current_section_title = None
    seq = 0

    def start(kind, heading, pdf_page, rule=None, rule_title=None, section=None, section_title=None):
        nonlocal current, seq
        add_record(records, current)
        seq += 1
        current = {
            'id': f'pr-{seq:03d}', 'source':'personnel', 'kind':kind,
            'heading':norm_heading(heading), 'rule':rule, 'rule_title':rule_title,
            'section':section, 'section_title':section_title,
            'pages':[pdf_page], '_lines':[]
        }
        return current

    for pno in range(12, len(doc)):  # PDF p13, printed p1
        pdf_page = pno + 1
        lines = clean_lines(doc[pno].get_text('text'))
        # Image-only / near-image-only page: create an explicit accessibility record.
        if not '\n'.join(lines).strip():
            add_record(records, current); current=None; seq += 1
            records.append({
                'id':f'pr-{seq:03d}','source':'personnel','kind':'image-page',
                'heading':f'Image-based source page — PDF page {pdf_page}',
                'rule':current_rule,'rule_title':current_rule_title,
                'section':current_section,'section_title':current_section_title,
                'pages':[pdf_page],'pdf_page_start':pdf_page,'pdf_page_end':pdf_page,
                'text':'', 'accessibility_note':'This source page is image-based. Do not rely on the image as the only accessible presentation; a verified text alternative is required before public release.'
            })
            continue

        i=0
        while i < len(lines):
            raw=lines[i]; line=norm_heading(raw)
            if not line:
                if current: current['_lines'].append('')
                i += 1; continue

            if pdf_page == 13 and line == 'DISCLAIMER':
                current_rule=None; current_rule_title=None; current_section=None; current_section_title=None
                start('frontmatter','DISCLAIMER',pdf_page)
                index.append({'type':'frontmatter','label':'Disclaimer','record_id':current['id'],'pdf_page':pdf_page})
                i += 1; continue
            if line == 'GOALS AND PRINCIPLES OF THE PERSONNEL RULES':
                current_rule=None; current_rule_title=None; current_section=None; current_section_title=None
                start('frontmatter',line,pdf_page)
                index.append({'type':'frontmatter','label':line.title(),'record_id':current['id'],'pdf_page':pdf_page})
                i += 1; continue

            rm = re.match(r'^RULE\s+([IVXLCDM]+(?:A)?|\d+)\s*[-–—]?\s*(.*)$', line, re.I)
            if rm:
                current_rule=rm.group(1).upper()
                current_rule_title=rm.group(2).strip()
                current_section=None; current_section_title=None
                start('rule',line,pdf_page,current_rule,current_rule_title)
                index.append({'type':'rule','rule':current_rule,'title':current_rule_title,'label':line,'record_id':current['id'],'pdf_page':pdf_page})
                i += 1; continue

            sm = re.match(r'^Section\s+(\d+[A-Za-z]?)\s*[-–—]?\s*(.*)$', line, re.I)
            if sm:
                current_section=sm.group(1)
                current_section_title=sm.group(2).strip()
                start('section',line,pdf_page,current_rule,current_rule_title,current_section,current_section_title)
                index.append({'type':'section','rule':current_rule,'section':current_section,'title':current_section_title,'label':line,'record_id':current['id'],'pdf_page':pdf_page})
                i += 1; continue

            if current is None:
                start('page', f'Personnel Rules — PDF page {pdf_page}', pdf_page, current_rule, current_rule_title, current_section, current_section_title)
            if pdf_page not in current['pages']:
                current['pages'].append(pdf_page)
            current['_lines'].append(raw.strip())
            i += 1

    add_record(records,current)
    return {
        'metadata': {
            'title':'City of Chicago Personnel Rules',
            'short_title':'City Personnel Rules',
            'revised':'August 1, 2025',
            'authority':'supplemental',
            'pdf':'docs/city-chicago-personnel-rules-2025-08-01.pdf',
            'page_count':len(doc),
            'governance_note':'The Personnel Rules state that where they conflict with an applicable collective bargaining agreement, the CBA governs.',
            'represented_grievance_note':'Personnel Rule XVI states that an employee covered by a grievance procedure negotiated through collective bargaining is not eligible to file a grievance under Rule XVI.',
            'notes':'Supplemental City source. For Local 2912 represented employees, contract language must be checked first.'
        },
        'index':index,
        'records':records,
    }


def write(name, obj):
    path = DATA / name
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'wrote {path} ({path.stat().st_size:,} bytes)')

if __name__ == '__main__':
    if not CBA_PDF.exists() or not PR_PDF.exists():
        raise SystemExit('Expected PDFs not found in docs/.')
    cba = parse_cba()
    personnel = parse_personnel()
    write('cba_corpus.json', cba)
    write('personnel_corpus.json', personnel)
    write('source_manifest.json', {
        'sources':[cba['metadata'], personnel['metadata']],
        'precedence':[
            'AFSCME–City of Chicago CBA (primary for represented employees)',
            'City of Chicago Personnel Rules (supplemental; CBA governs conflicts)'
        ],
        'release_rule':'Do not publish AI-generated conclusions as authoritative. Contract search is source retrieval; Ask 2912 remains a later grounded-answer layer with steward referral.'
    })
    print('CBA records:', len(cba['records']), 'index entries:', len(cba['index']))
    print('Personnel records:', len(personnel['records']), 'index entries:', len(personnel['index']))
