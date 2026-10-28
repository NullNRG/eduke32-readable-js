from pathlib import Path
p=Path('work/package_current_continuation.py');s=p.read_text().replace("'freeze_current_manifest_inventory.py'):","'freeze_current_manifest_inventory.py','update_current_status.py','report_current_frontier.py'):")
p.write_text(s)
