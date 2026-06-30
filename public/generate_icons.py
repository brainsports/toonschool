import os
from PIL import Image, ImageDraw, ImageFont

def create_icon(size, output_path):
    # Pink background
    img = Image.new('RGB', (size, size), color='#ff2778')
    draw = ImageDraw.Draw(img)
    
    # Draw white circle in center
    padding = size * 0.15
    draw.ellipse([padding, padding, size-padding, size-padding], fill='#ffffff')
    
    # Try to load a bold font, fallback to default
    try:
        font = ImageFont.truetype("arialbd.ttf", int(size * 0.5))
    except:
        font = ImageFont.load_default()
    
    text = "T"
    try:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
    except AttributeError:
        tw, th = draw.textsize(text, font=font)
        
    x = (size - tw) / 2
    y = (size - th) / 2 - th * 0.1
    draw.text((x, y), text, fill='#ff2778', font=font)
    
    img.save(output_path)

os.makedirs('public/icons', exist_ok=True)
create_icon(192, 'public/icons/icon-192x192.png')
create_icon(512, 'public/icons/icon-512x512.png')
print("Icons generated successfully!")
