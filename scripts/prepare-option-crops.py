import json
from pathlib import Path
from PIL import Image

records = json.loads(Path("tmp/pdfs/candidates.json").read_text(encoding="utf-8"))
directory = Path("tmp/pdfs/options")
directory.mkdir(parents=True, exist_ok=True)
index=[]
for rec in records:
    image=Image.open(Path("tmp/pdfs/screens")/rec['source'])
    for i,ring in enumerate(rec['rings']):
        top=max(0,int(ring['y']-29))
        bottom=min(image.height,int(rec['rings'][i+1]['y']-32) if i+1<len(rec['rings']) else int(rec['bottom']-15))
        crop=image.crop((143,top,image.width,bottom))
        canvas=Image.new("RGB",(crop.width+40,crop.height+40),"white")
        canvas.paste(crop,(20,20))
        name=f"q{rec['number']:03d}-o{i+1}.png"
        canvas.save(directory/name)
        index.append({"file":name,"number":rec['number'],"option":i,"selected":ring['selected']})
(directory/'index.json').write_text(json.dumps(index,ensure_ascii=False,indent=2),encoding="utf-8")
print(f"Prepared {len(index)} isolated option crops")
