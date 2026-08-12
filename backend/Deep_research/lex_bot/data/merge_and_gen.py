import json
import os

data_dir = os.path.join(os.getcwd(), 'lex_bot', 'data')
batch1_path = os.path.join(data_dir, 'ipc_batch_1.json')
batch2_path = os.path.join(data_dir, 'ipc_batch_2.json')
ipc_output_path = os.path.join(data_dir, 'ipc_sections.json')
bns_output_path = os.path.join(data_dir, 'bns_sections.json')

# 1. Merge IPC Data
merged_ipc = {}

def load_batch(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {}

merged_ipc.update(load_batch(batch1_path))
merged_ipc.update(load_batch(batch2_path))

# Sort IPC
sorted_ipc_keys = sorted(merged_ipc.keys(), key=lambda x: int(''.join(filter(str.isdigit, x))) if any(c.isdigit() for c in x) else 0)
final_ipc = {k: merged_ipc[k] for k in sorted_ipc_keys}

# Write IPC
with open(ipc_output_path, 'w', encoding='utf-8') as f:
    json.dump(final_ipc, f, indent=4)
print(f"✅ Created ipc_sections.json with {len(final_ipc)} sections")

# 2. Auto-generate BNS Data from IPC Mappings
existing_bns = {}
if os.path.exists(bns_output_path):
    with open(bns_output_path, 'r', encoding='utf-8') as f:
        existing_bns = json.load(f)

print(f"Existing BNS sections: {len(existing_bns)}")

generated_bns = existing_bns.copy()
new_count = 0

for ipc_sec, data in final_ipc.items():
    bns_equiv = data.get('bns_equivalent')
    
    # Skip if no equivalent or if it's "NA"
    if not bns_equiv or bns_equiv in ["NA", "None"]:
        continue
        
    # Handle multiple sections like "103(1)" or "103, 105" - just take primary for now
    bns_sec = bns_equiv.split(',')[0].strip().split('(')[0]
    
    if bns_sec not in generated_bns:
        generated_bns[bns_sec] = {
            "title": data.get('title'),
            "description": data.get('description'), # Assuming text is largely similar for MVP
            "offense": data.get('offense'),
            "punishment": data.get('punishment'),
            "ipc_equivalent": ipc_sec
        }
        new_count += 1

# Sort BNS
sorted_bns_keys = sorted(generated_bns.keys(), key=lambda x: int(''.join(filter(str.isdigit, x))) if any(c.isdigit() for c in x) else 0)
final_bns = {k: generated_bns[k] for k in sorted_bns_keys}

# Write BNS
with open(bns_output_path, 'w', encoding='utf-8') as f:
    json.dump(final_bns, f, indent=4)

print(f"✅ Created bns_sections.json with {len(final_bns)} sections (Added {new_count} new from IPC mappings)")

# Cleanup
# if os.path.exists(batch1_path): os.remove(batch1_path)
# if os.path.exists(batch2_path): os.remove(batch2_path)
