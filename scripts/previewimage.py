from PIL import Image, ImageOps
from pathlib import Path

SIZE = 512

img_path = Path("raw_animals/zebra.jpg")  # change this

original = Image.open(img_path).convert("RGB")
processed = ImageOps.fit(original, (SIZE, SIZE), method=Image.Resampling.LANCZOS)

# Make original fit in 512x512 without cropping, just for comparison
original_preview = ImageOps.contain(original, (SIZE, SIZE))

canvas = Image.new("RGB", (SIZE * 2, SIZE), "white")
canvas.paste(original_preview, (0, 0))
canvas.paste(processed, (SIZE, 0))

canvas.save("preview.jpg")
canvas.show()