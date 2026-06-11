from PIL import Image, ImageOps
from pathlib import Path
import json

INPUT_DIR = Path("raw_animals")
OUTPUT_DIR = Path("assets/animals")
JSON_PATH = Path("data/animals.json")

SIZE = 512

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
JSON_PATH.parent.mkdir(parents=True, exist_ok=True)

animals = []

for img_path in sorted(INPUT_DIR.iterdir()):
    if img_path.suffix.lower() not in [".jpg", ".jpeg", ".png", ".webp"]:
        continue

    animal_id = img_path.stem.lower().replace(" ", "-").replace("_", "-")
    animal_name = animal_id.replace("-", " ").title()

    img = Image.open(img_path).convert("RGB")

    # Crop to square and resize to 512x512
    img = ImageOps.fit(img, (SIZE, SIZE), method=Image.Resampling.LANCZOS)

    output_filename = f"{animal_id}.webp"
    output_path = OUTPUT_DIR / output_filename

    img.save(output_path, "WEBP", quality=80)

    animals.append({
        "id": animal_id,
        "name": animal_name,
        "aliases": [animal_name.lower()],
        "image": f"assets/animals/{output_filename}"
    })

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(animals, f, indent=2)

print(f"Processed {len(animals)} animals.")
print(f"Saved images to {OUTPUT_DIR}")
print(f"Saved JSON to {JSON_PATH}")