from pathlib import Path
p=Path('work/verify_original_xxhash_browser.py');s=p.read_text().replace('oct27-xxhash-verified/source','oct27-xxhash-cpp-record/source');p.write_text(s)
