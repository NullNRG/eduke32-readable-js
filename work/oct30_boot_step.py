import sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/"tools"))
from recover_browser_component import main,component_lock
if __name__=="__main__":
 with component_lock():main()
