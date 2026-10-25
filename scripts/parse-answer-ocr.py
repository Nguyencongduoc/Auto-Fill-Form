"""Create auditable answer candidates from screenshot OCR and radio geometry."""
import json
import re
from pathlib import Path
from PIL import Image

directory = Path("tmp/pdfs/screens")
index = json.loads((directory/"index.json").read_text(encoding="utf-8"))

def circles(image, selected):
    rgb = image.convert("RGB")
    pix = rgb.load()
    dark = set()
    for y in range(rgb.height):
        for x in range(88, 142):
            r,g,b = pix[x,y]
            if max(r,g,b) < 195:
                dark.add((x,y))
    components = []
    while dark:
        seed = dark.pop()
        todo=[seed]; points=[seed]
        while todo:
            x,y=todo.pop()
            for dx,dy in ((-1,0),(1,0),(0,-1),(0,1),(-1,-1),(1,1),(-1,1),(1,-1)):
                p=(x+dx,y+dy)
                if p in dark:
                    dark.remove(p);todo.append(p);points.append(p)
        x0=min(p[0] for p in points);x1=max(p[0] for p in points)
        y0=min(p[1] for p in points);y1=max(p[1] for p in points)
        if 26<=x1-x0<=45 and 26<=y1-y0<=45 and abs((x0+x1)/2-114.5)<5 and x0>88 and x1<141:
            components.append((y0+y1)/2)
    ys=[]
    for y in sorted(components+selected):
        if not ys or y-ys[-1]>15:
            ys.append(y)
    return [{"y":y,"selected":any(abs(s-y)<15 for s in selected)} for y in ys]

records=[]; diagnostics=[]
for item in index:
    data=json.loads((directory/(item['file']+".json")).read_text(encoding="utf-8"))
    lines=[line for block in data['blocks'] or [] for para in block['paragraphs'] for line in para['lines']]
    lines.sort(key=lambda line:(line['bbox']['y0'],line['bbox']['x0']))
    titles=[]
    for line in lines:
        match=re.match(r"^\s*(\d{1,3})[.)]\s*(.+)",line['text'].strip())
        if match and line['bbox']['x0']<90 and 1<=int(match[1])<=200:
            titles.append({"number":int(match[1]),"y":line['bbox']['y0']})
    rings=circles(Image.open(directory/item['file']), data['selectedY'])
    for ti,title in enumerate(titles):
        end=titles[ti+1]['y'] if ti+1<len(titles) else 99999
        options=[r for r in rings if title['y']<r['y']<end]
        if not options or not any(r['selected'] for r in options):
            continue
        title_lines=[line['text'].strip() for line in lines if title['y']<=line['bbox']['y0']<options[0]['y']-23]
        question=re.sub(r"^\d{1,3}[.)]\s*",""," ".join(title_lines))
        question=question.split('*')[0].strip()
        if '?' in question:question=question[:question.rfind('?')+1]
        else: question=re.sub(r'\s+[\[\]{}|][^\s]*\s*$','',question).strip()
        values=[];confs=[]
        for oi,option in enumerate(options):
            option_end=options[oi+1]['y']-24 if oi+1<len(options) else end
            words=[word for line in lines if option['y']-24<=line['bbox']['y0']<option_end for word in line['words'] if word['bbox']['x0']>=143]
            values.append(' '.join(w['text'] for w in words).strip())
            confs.append(round(sum(w['confidence'] for w in words)/len(words),1) if words else 0)
        selected_indices=[i for i,r in enumerate(options) if r['selected']]
        record={"number":title['number'],"question":question,"options":values,"answer":[values[i] for i in selected_indices],"selectedIndices":selected_indices,"confidence":min(confs[i] for i in selected_indices),"source":item['file'],"page":item['page'],"top":title['y'],"bottom":min(end,Image.open(directory/item['file']).height),"rings":options}
        records.append(record)
    diagnostics.append({"file":item['file'],"titles":[t['number'] for t in titles],"rings":len(rings),"selected":len(data['selectedY'])})

best={}
for rec in records:
    score=(len(rec['options'])==4,len(rec['answer'])==1,rec['confidence'],len(rec['question']))
    prev=best.get(rec['number'])
    if not prev or score>(len(prev['options'])==4,len(prev['answer'])==1,prev['confidence'],len(prev['question'])):
        best[rec['number']]=rec
chosen=[best[k] for k in sorted(best)]
Path('tmp/pdfs/candidates.json').write_text(json.dumps(chosen,ensure_ascii=False,indent=2),encoding="utf-8")
Path('tmp/pdfs/ocr-diagnostics.json').write_text(json.dumps(diagnostics,ensure_ascii=False,indent=2),encoding="utf-8")
Path('tmp/pdfs/review.txt').write_text('\n\n'.join(f"{r['number']}. {r['question']}\n"+'\n'.join(f" {'✓' if i in r['selectedIndices'] else ' '} {i+1}. {o}" for i,o in enumerate(r['options']))+f"\n    [p{r['page']}, {r['source']}, confidence {r['confidence']}]" for r in chosen),encoding="utf-8")
print(json.dumps({"candidates":len(chosen),"missing":[i for i in range(1,201) if i not in best],"notFour":[(r['number'],len(r['options'])) for r in chosen if len(r['options'])!=4],"notOneAnswer":[r['number'] for r in chosen if len(r['answer'])!=1],"lowConfidence":[(r['number'],r['confidence']) for r in chosen if r['confidence']<90]},ensure_ascii=False))
