import json

json_data = """
[
  { "label": "0-17", "value": "0-17" },
  { "label": "18-25", "value": "18-25" },
  { "label": "26-35", "value": "26-35" },
  { "label": "36-45", "value": "36-45" },
  { "label": "46-55", "value": "46-55" },
  { "label": "56-65", "value": "56-65" },
  { "label": "70", "value": "70" }
]
"""

data = json.loads(json_data)

print(data)
