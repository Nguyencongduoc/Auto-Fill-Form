import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

path=Path("tmp/pdfs/candidates.json")
records=json.loads(path.read_text(encoding="utf-8"))
for rec in records:
    options=[]; conf=[]
    for i in range(4):
        option=json.loads(Path(f"tmp/pdfs/options/q{rec['number']:03d}-o{i+1}.png.json").read_text(encoding="utf-8"))
        options.append(option['text']);conf.append(option['confidence'])
    rec['options']=options
    rec['answer']=[options[i] for i in rec['selectedIndices']]
    rec['confidence']=min(conf[i] for i in rec['selectedIndices'])
Path('tmp/pdfs/refined.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding="utf-8")
Path('tmp/pdfs/selected-review.txt').write_text('\n'.join(f"{r['number']:03d}. {r['answer'][0]} [{r['confidence']}]" for r in records),encoding="utf-8")
font=ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf',24)
for start in range(0,len(records),20):
    canvas=Image.new('RGB',(1900,1250),'white');draw=ImageDraw.Draw(canvas)
    for offset,rec in enumerate(records[start:start+20]):
        col=offset//10;row=offset%10;x=col*950;y=row*125
        draw.text((x+5,y+7),str(rec['number']),font=font,fill='#14765d')
        crop=Image.open(f"tmp/pdfs/options/q{rec['number']:03d}-o{rec['selectedIndices'][0]+1}.png")
        crop=crop.crop((0,0,crop.width,min(crop.height,150)))
        crop=crop.resize((875,round(crop.height*875/crop.width)),Image.Resampling.LANCZOS)
        canvas.paste(crop,(x+65,y))
        draw.line((x,y+120,x+940,y+120),fill='#dddddd')
    canvas.save(f'tmp/pdfs/review-{start//20+1:02d}.png')
print('Created 10 contact sheets; selected answers:')
print(Path('tmp/pdfs/selected-review.txt').read_text(encoding='utf-8'))
