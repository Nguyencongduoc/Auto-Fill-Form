"""Extract screenshot images and selected radio positions for local OCR/review."""
import argparse
import json
from pathlib import Path
from collections import Counter
from pypdf import PdfReader
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument("pdf")
parser.add_argument("--output", default="tmp/pdfs/screens")
args = parser.parse_args()
out = Path(args.output)
out.mkdir(parents=True, exist_ok=True)
reader = PdfReader(args.pdf)
records = []
for page_number, page in enumerate(reader.pages, 1):
    for image_number, source in enumerate(page.images, 1):
        image = source.image.convert("RGB")
        if image.width < 1000 or image.height < 700:
            continue
        sx, sy = image.width / 1920, image.height / 1080
        left, top, right, bottom = (round(380*sx), round(200*sy), round(1470*sx), round(1016*sy))
        pixels = image.load()
        candidates = []
        for y in range(top, bottom):
            count = 0
            for x in range(round(440*sx), round(475*sx)):
                r, g, b = pixels[x, y]
                if r < 95 and g > 75 and b > 65 and g > r * 1.35 and b > r * 1.25:
                    count += 1
            if count >= 5*sx:
                candidates.append(y)
        groups = []
        for y in candidates:
            if not groups or y - groups[-1][-1] > 3*sy:
                groups.append([y])
            else:
                groups[-1].append(y)
        selected = [round((min(g)+max(g))/2-top, 2) for g in groups if max(g)-min(g) >= 10*sy]
        name = f"p{page_number:02d}-s{image_number}.png"
        image.crop((left, top, right, bottom)).resize((round((right-left)*1.5), round((bottom-top)*1.5)), Image.Resampling.LANCZOS).save(out/name)
        records.append({"file": name, "page": page_number, "image": image_number, "size": image.size, "crop": [left,top,right,bottom], "scale": 1.5, "selectedY": [round(y*1.5,2) for y in selected]})
(out/"index.json").write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"pages":len(reader.pages), "screens":len(records), "sizes":dict(Counter(str(r['size']) for r in records)), "selected":sum(len(r['selectedY']) for r in records)},ensure_ascii=False))
