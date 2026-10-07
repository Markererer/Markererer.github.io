#!/usr/bin/env python3
"""
Scan images/me/ and generate media.json with all supported image/video files.
Run this whenever you add/remove media files.
"""

import json
from pathlib import Path

def main():
    media_dir = Path(__file__).parent / 'images' / 'me'
    if not media_dir.exists():
        print(f"Error: {media_dir} does not exist.")
        return
    
    # Supported extensions
    image_exts = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif'}
    video_exts = {'.mp4', '.webm', '.mov', '.avi', '.mkv'}
    
    media_list = []
    
    # Scan directory
    for file in sorted(media_dir.iterdir()):
        if file.is_file():
            ext = file.suffix.lower()
            if ext in image_exts or ext in video_exts:
                # Store relative path from root
                rel_path = f"images/me/{file.name}"
                media_list.append(rel_path)
    
    # Write media.json
    json_path = media_dir / 'media.json'
    with open(json_path, 'w') as f:
        json.dump(media_list, f, indent=2)
    
    print(f"✓ Generated {json_path}")
    print(f"  Found {len(media_list)} media files:")
    for m in media_list:
        print(f"    - {m}")

if __name__ == '__main__':
    main()
