#!/usr/bin/env python3
import json, re, unicodedata, argparse, os

STOPWORDS=set('a an and are as at be been being but by can could did do does for from had has have how i if in is it me my of on or our so that the their them then there this to was we were what when where which who why will with would you your received want know tell please about'.split())
ALIASES={
    'grieve':['grievance'],'grieved':['grievance'],'grieving':['grievance'],
    'warning':['discipline'],'reprimand':['discipline'],'writeup':['discipline'],
    'fired':['discharge','discipline'],'fire':['discharge','discipline'],'terminated':['discharge','discipline'],'termination':['discharge','discipline'],
    'investigated':['investigation'],'questioned':['interrogation','investigation'],
    'underpaid':['wages','pay'],'paycheck':['wages','pay'],
    'shift':['schedule'],'schedulechange':['schedule'],
    'accommodate':['accommodation'],'disabled':['accommodation','disability'],
    'call':['called'], 'comp':['compensatory']
}

def normalize(value):
    s=(value or '').lower()
    s=unicodedata.normalize('NFKD',s)
    s=''.join(c for c in s if not unicodedata.combining(c))
    s=s.replace('’',"'").replace('‘',"'").replace('–','-').replace('—','-')
    s=re.sub(r"[^a-z0-9'()\-\s.]",' ',s)
    return re.sub(r'\s+',' ',s).strip()

def query_terms(query):
    raw=[t for t in normalize(query).split() if len(t)>1 and t not in STOPWORDS]
    out=[]
    for term in raw:
        out.append(term)
        out.extend(ALIASES.get(term,[]))
    return list(dict.fromkeys(out))

def rule_matches(rule, nq):
    words=set(nq.split())
    if rule.get('all_terms') and not all(normalize(t) in words for t in rule['all_terms']):
        return False
    if rule.get('any_terms') and not any(normalize(t) in words for t in rule['any_terms']):
        # phrase matching is allowed to satisfy a rule even when token morphology differs
        if not rule.get('any_phrases'):
            return False
    if rule.get('any_phrases') and not any(normalize(p) in nq for p in rule['any_phrases']):
        # If any_terms exists and matched, allow the rule; otherwise fail.
        if not (rule.get('any_terms') and any(normalize(t) in words for t in rule['any_terms'])):
            return False
    return True

def score_record(record, query, source='cba', hints=None):
    phrase=normalize(query)
    terms=query_terms(query)
    if not terms: return 0
    heading=normalize(' '.join(str(record.get(k,'')) for k in ['heading','article_title','section_title','rule_title'] if record.get(k)))
    text=normalize(record.get('text',''))
    score=20 if source=='cba' else 0
    if phrase in heading: score += 50
    if phrase in text: score += 25
    all_found=True
    for term in terms:
        h=term in heading
        t=term in text
        if h: score += 14
        if t:
            score += 4
            score += min(4,text.count(term))
        if not h and not t: all_found=False
    if all_found: score += 15
    if record.get('complex_layout') and hints:
        score -= hints.get('complex_layout_penalty',0)
    if hints:
        for rule in hints.get('rules',[]):
            if rule.get('record_id') == record.get('id') and rule.get('source',source)==source and rule_matches(rule,phrase):
                score += rule.get('boost',0)
    return score

def search(cba, personnel, hints, query, limit=20, include_personnel=True):
    hits=[]
    for record in cba['records']:
        score=score_record(record,query,'cba',hints)
        if score>8: hits.append({'record':record,'source':'cba','score':score})
    if include_personnel:
        for record in personnel['records']:
            score=score_record(record,query,'personnel',hints)
            if score>8: hits.append({'record':record,'source':'personnel','score':score})
    hits.sort(key=lambda x:(-x['score'], 0 if x['source']=='cba' else 1, x['record'].get('pdf_page_start',9999)))
    return hits[:limit]

def evaluate(base, use_hints=True):
    cba=json.load(open(os.path.join(base,'data','cba_corpus.json'),encoding='utf-8'))
    personnel=json.load(open(os.path.join(base,'data','personnel_corpus.json'),encoding='utf-8'))
    hints=json.load(open(os.path.join(base,'data','retrieval_hints.json'),encoding='utf-8')) if use_hints else {'rules':[],'complex_layout_penalty':0}
    testbase = base if os.path.exists(os.path.join(base,'tests','member_questions.json')) else os.path.dirname(base)
    questions=json.load(open(os.path.join(testbase,'tests','member_questions.json'),encoding='utf-8'))['items']
    rows=[]; top1=top3=top5=0; topic={}
    for item in questions:
        hits=search(cba,personnel,hints,item['question'],10,True)
        ids=[h['record']['id'] for h in hits]
        expected=item['expected_primary_ids']
        rank=next((i+1 for i,rid in enumerate(ids) if rid in expected),None)
        if rank==1: top1+=1
        if rank and rank<=3: top3+=1
        if rank and rank<=5: top5+=1
        t=topic.setdefault(item['topic'],{'n':0,'top1':0,'top3':0,'misses':[]})
        t['n']+=1
        if rank==1:t['top1']+=1
        if rank and rank<=3:t['top3']+=1
        if not rank or rank>3:t['misses'].append(item['id'])
        rows.append({'id':item['id'],'topic':item['topic'],'question':item['question'],'expected':expected,'rank':rank,
                     'top_results':[{'id':h['record']['id'],'source':h['source'],'heading':h['record'].get('heading'),'score':h['score']} for h in hits[:5]]})
    n=len(rows)
    summary={'questions':n,'top1':top1,'top1_pct':round(top1/n*100,1),'top3':top3,'top3_pct':round(top3/n*100,1),'top5':top5,'top5_pct':round(top5/n*100,1),'topics':topic}
    return summary,rows

def main():
    ap=argparse.ArgumentParser(); ap.add_argument('--base',default=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); ap.add_argument('--label',default='tuned'); ap.add_argument('--no-hints',action='store_true'); args=ap.parse_args()
    summary,rows=evaluate(args.base,not args.no_hints)
    outdir=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'reports');os.makedirs(outdir,exist_ok=True)
    json.dump({'label':args.label,'summary':summary,'results':rows},open(os.path.join(outdir,f'{args.label}_retrieval.json'),'w',encoding='utf-8'),indent=2)
    md=[f'# Retrieval Evaluation — {args.label}\n',f"Questions: **{summary['questions']}**  ",f"Top-1 correct: **{summary['top1']} ({summary['top1_pct']}%)**  ",f"Top-3 correct: **{summary['top3']} ({summary['top3_pct']}%)**  ",f"Top-5 correct: **{summary['top5']} ({summary['top5_pct']}%)**\n",'## Topic performance\n','| Topic | N | Top-1 | Top-3 | Misses outside top 3 |\n|---|---:|---:|---:|---|']
    for name,t in summary['topics'].items(): md.append(f"| {name} | {t['n']} | {t['top1']}/{t['n']} | {t['top3']}/{t['n']} | {', '.join(t['misses']) or '—'} |")
    md.append('\n## Questions missing the expected source in the top 3\n')
    misses=[r for r in rows if not r['rank'] or r['rank']>3]
    if not misses: md.append('None.')
    for r in misses:
        md.append(f"### {r['id']} — {r['question']}\n"); md.append(f"Expected: `{', '.join(r['expected'])}`; rank: {r['rank'] or 'not in top 10'}\n")
        for h in r['top_results'][:5]: md.append(f"- `{h['id']}` ({h['source']}) — {h['heading']} (score {h['score']})")
        md.append('')
    open(os.path.join(outdir,f'{args.label}_retrieval.md'),'w',encoding='utf-8').write('\n'.join(md)+'\n')
    print(json.dumps(summary,indent=2))
if __name__=='__main__': main()
