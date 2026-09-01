#!/usr/bin/env python3
"""Redact regions of a screenshot irreversibly and strip metadata.

Boxes are fractions of width/height (x0,y0,x1,y1) so they survive rescaling.
Solid fill only. Blur and pixelation are recoverable and are never used here.
"""
import sys, json, pathlib
from PIL import Image, ImageDraw

def redact(src: pathlib.Path, boxes, dst: pathlib.Path, fill=None):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    d = ImageDraw.Draw(im)
    for b in boxes:
        x0, y0, x1, y1 = (b["box"] if isinstance(b, dict) else b)
        colour = (b.get("fill") if isinstance(b, dict) else None) or fill or (17, 17, 17)
        if isinstance(colour, str):
            colour = tuple(int(colour.lstrip("#")[i:i+2], 16) for i in (0, 2, 4))
        d.rectangle([x0*w, y0*h, x1*w, y1*h], fill=colour)
    # a fresh image carries no EXIF, ICC or text chunks from the original
    out = Image.new("RGB", im.size)
    out.putdata(list(im.getdata()))
    out.save(dst, "PNG", optimize=True)
    return out.size

if __name__ == "__main__":
    src = pathlib.Path(sys.argv[1])
    spec = json.loads(sys.argv[2])
    dst = pathlib.Path(sys.argv[3])
    print(f"  {dst.name}  {redact(src, spec, dst)}  metadata stripped")
