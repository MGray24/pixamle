import json
import random
from pathlib import Path

JSON_PATH = Path("data/animals.json")

random.seed(12345)

with open(JSON_PATH, "r", encoding="utf-8") as f:
    animals = json.load(f)

random.shuffle(animals)

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(animals, f, indent=2)

print(f"Shuffled {len(animals)} animals.")