import sys
from PIL import Image
import cv2
import numpy as np

input_path = sys.argv[1]
output_path = sys.argv[2]

print(f'Loading {input_path}...')
img = Image.open(input_path)
frames = []
try:
    while True:
        frames.append(np.array(img.convert('RGB')))
        img.seek(img.tell() + 1)
except EOFError:
    pass

print(f'Found {len(frames)} frames. Writing to {output_path}...')
height, width, _ = frames[0].shape
fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter(output_path, fourcc, 10.0, (width, height))

if not out.isOpened():
    print('Failed to open VideoWriter')
    sys.exit(1)

for frame in frames:
    out.write(cv2.cvtColor(frame, cv2.COLOR_RGB2BGR))

out.release()
print('Done!')
