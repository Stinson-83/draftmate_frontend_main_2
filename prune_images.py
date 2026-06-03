#!/usr/bin/env python3
import json
import subprocess
import sys

# Nodes to check in the Kind cluster
NODES = ["kind-control-plane", "kind-worker", "kind-worker2"]

# Image names to target
TARGET_IMAGES = [
    "docker.io/preetkakdiya/draftmate-frontend",
    "docker.io/preetkakdiya/draftmate-backend",
    "preetkakdiya/draftmate-frontend",
    "preetkakdiya/draftmate-backend"
]

def run_command(cmd):
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    return result.stdout, result.stderr, result.returncode

def prune_node_images(node):
    print(f"\n=======================================================")
    print(f"Pruning node: {node}")
    print(f"=======================================================")
    
    # Get crictl images in JSON format
    stdout, stderr, code = run_command(["sudo", "docker", "exec", node, "crictl", "images", "-o", "json"])
    if code != 0:
        print(f"Error listing images on {node}: {stderr.strip()}")
        return

    try:
        data = json.loads(stdout)
    except Exception as e:
        print(f"Failed to parse JSON from {node}: {e}")
        return

    images = data.get("images", [])
    if not images:
        print("No images found in containerd runtime.")
        return
    
    # Group images by base repo name (frontend / backend)
    # Map: category -> list of (numeric_tag, repo_tag, image_id)
    grouped = {
        "frontend": [],
        "backend": []
    }
    
    for img in images:
        repo_tags = img.get("repoTags", [])
        image_id = img.get("id")
        if not repo_tags or not image_id:
            continue
        
        for repo_tag in repo_tags:
            if ":" not in repo_tag:
                continue
            repo, tag = repo_tag.split(":", 1)
            
            # Match repository name
            is_frontend = "draftmate-frontend" in repo
            is_backend = "draftmate-backend" in repo
            
            if is_frontend or is_backend:
                category = "frontend" if is_frontend else "backend"
                try:
                    num_tag = int(tag)
                    grouped[category].append((num_tag, repo_tag, image_id))
                except ValueError:
                    # Non-numeric tag (like 'latest' or '<none>'), ignore
                    pass

    # For each category, sort by tag descending, keep top 3, delete the rest
    for category, items in grouped.items():
        if not items:
            continue
        
        # Sort items by numeric tag in descending order (highest run number first)
        items.sort(key=lambda x: x[0], reverse=True)
        
        print(f"\nFound {category} versions on node {node}:")
        for num_tag, repo_tag, image_id in items:
            print(f"  - {repo_tag} (ID: {image_id[:12]})")
        
        if len(items) <= 1:
            print(f"  Only {len(items)} versions found. No pruning needed for {category}.")
            continue
            
        keep = items[:1]
        to_prune = items[1:]
        
        print(f"  Keeping last 1 version:")
        for num_tag, repo_tag, image_id in keep:
            print(f"    * {repo_tag}")
            
        print(f"  Pruning older versions:")
        for num_tag, repo_tag, image_id in to_prune:
            print(f"    x {repo_tag}")
            # Run crictl rmi with a 60 second timeout to prevent context deadline exceeded on large images
            rmi_stdout, rmi_stderr, rmi_code = run_command([
                "sudo", "docker", "exec", node, 
                "crictl", "--timeout", "60s", "rmi", repo_tag
            ])
            if rmi_code != 0:
                print(f"      Failed to remove {repo_tag}: {rmi_stderr.strip()}")
            else:
                print(f"      Successfully removed {repo_tag}")

    # Additionally run crictl rmi --prune to remove any other untagged/unused images
    print(f"\nRunning crictl rmi --prune on {node} to clean all other unused images...")
    prune_stdout, prune_stderr, prune_code = run_command([
        "sudo", "docker", "exec", node,
        "crictl", "--timeout", "60s", "rmi", "--prune"
    ])
    if prune_code != 0:
        print(f"  Failed to prune unused images on {node}: {prune_stderr.strip()}")
    else:
        print(f"  Successfully pruned unused images on {node}")

if __name__ == "__main__":
    for node in NODES:
        try:
            prune_node_images(node)
        except Exception as e:
            print(f"Error processing node {node}: {e}", file=sys.stderr)

