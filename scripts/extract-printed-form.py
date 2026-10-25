"""Extract this Microsoft Forms print PDF as data, including vector radio state.

This development script is specific to the inspected print layout, not a general
PDF importer and not code shipped in the extension.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
import pdfplumber

parser=argparse.ArgumentParser()
parser.add_argument('pdf')
parser.add_argument('--output',default='tmp/pdfs/new-source')
args=parser.parse_args()
source=Path(args.pdf);out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
records=[];current=None;mode=None;last_line=None;selections=[]
with pdfplumber.open(source) as pdf:
    for page_number,page in enumerate(pdf.pages,1):
        words=[w for w in page.extract_words(x_tolerance=2,y_tolerance=2) if w['x0']>=115 and w['x1']<=735 and 25<=w['top']<566 and w['height']>=10]
        lines=[]
        for word in sorted(words,key=lambda w:(w['top'],w['x0'])):
            if not lines or abs(word['top']-lines[-1]['top'])>2:
                lines.append({'top':word['top'],'words':[word]})
            else: lines[-1]['words'].append(word)
        for line in lines:
            line['words'].sort(key=lambda w:w['x0'])
            line['text']=' '.join(w['text'] for w in line['words'])
            line['x0']=line['words'][0]['x0']
        rings=[]
        for curve in page.curves:
            width=curve['x1']-curve['x0'];height=curve['bottom']-curve['top'];center=(curve['x0']+curve['x1'])/2
            if not (curve.get('fill') and 13.5<width<15.6 and 13.5<height<15.6 and abs(center-164.25)<2 and 25<curve['top']<556):continue
            color=curve.get('non_stroking_color') or []
            selected=len(color)==3 and color[0]<0.1 and color[1]>0.3 and color[2]>0.3
            y=(curve['top']+curve['bottom'])/2
            if any(abs(y-r['y'])<2 for r in rings):continue
            rings.append({'y':y,'selected':selected})
        # Radio circles are vertically centered beside labels, including wrapped labels.
        # Start the option before the first text line, rather than at circle center.
        events=[{'kind':'line','y':line['top'],**line} for line in lines]+[{'kind':'ring','y':r['y']-24,'center':r['y'],'selected':r['selected']} for r in rings]
        for event in sorted(events,key=lambda e:e['y']):
            if event['kind']=='ring':
                if current is None:raise ValueError(f'Option before question on page {page_number}')
                current['options'].append(''); current['selected'].append(event['selected']);current['optionLocations'].append({'page':page_number,'y':event['center']})
                mode='option';last_line=None
                continue
            text=event['text']
            match=re.match(r'^(\d{1,3})\.\s+(.+)',text)
            if match and event['x0']<155:
                number=int(match[1])
                if current:records.append(current)
                current={'number':number,'question':match[2],'options':[],'selected':[],'page':page_number,'top':event['top'],'optionLocations':[]}
                mode='question';last_line=event['top'];continue
            if current is None:continue
            if mode=='question':current['question']+=' '+text
            elif mode=='option':
                if last_line is not None and event['top']-last_line>25:continue
                current['options'][-1]+=(' ' if current['options'][-1] else '')+text
            last_line=event['top']
    if current:records.append(current)
    page_count=len(pdf.pages)

(out/'raw-records.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
for record in records:
    record['question']=record['question'].split('*')[0].strip()
    record['answer']=[value for value,selected in zip(record['options'],record['selected']) if selected]
    if len(record['options'])!=4 or len(record['answer'])!=1 or not all(record['options']):raise ValueError(f"Incomplete question {record['number']}: {len(record['options'])} options, {len(record['answer'])} selected")
assert [r['number'] for r in records]==list(range(1,201)),'Expected exactly question numbers 1..200'
(out/'extracted.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
(out/'extracted.txt').write_text('\n\n'.join(f"{r['number']}. {r['question']}\n"+'\n'.join(f"{'✓' if selected else ' '} {option}" for option,selected in zip(r['options'],r['selected'])) for r in records),encoding='utf-8')
(out/'source.json').write_text(json.dumps({'document':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'pages':page_count,'answers':len(records),'method':'Direct PDF text extraction and teal selected-radio vector geometry; no OCR needed.'},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'pages':page_count,'answers':len(records),'allFourOptions':True,'oneSelectionPerQuestion':True},ensure_ascii=False))
