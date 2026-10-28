import ctypes,json,sys,tempfile,threading,time
from pathlib import Path
sys.path.insert(0,'tools')
from verify_recovery_suite import atomic_json
api=ctypes.WinDLL('kernel32',use_last_error=True)
api.CreateFileW.argtypes=[ctypes.c_wchar_p,ctypes.c_uint32,ctypes.c_uint32,ctypes.c_void_p,ctypes.c_uint32,ctypes.c_uint32,ctypes.c_void_p];api.CreateFileW.restype=ctypes.c_void_p
api.CloseHandle.argtypes=[ctypes.c_void_p]
with tempfile.TemporaryDirectory() as folder:
 path=Path(folder)/'report.json';atomic_json(path,{'before':True})
 handle=api.CreateFileW(str(path),0x80000000,1,None,3,0,None)
 assert handle not in (None,ctypes.c_void_p(-1).value),ctypes.get_last_error()
 failures=[]
 def publish():
  try:atomic_json(path,{'after':True})
  except Exception as e:failures.append(str(e))
 thread=threading.Thread(target=publish);thread.start();time.sleep(.2)
 assert json.loads(path.read_text())=={'before':True}
 api.CloseHandle(handle);thread.join(8)
 assert not thread.is_alive() and not failures and json.loads(path.read_text())=={'after':True},failures
 report={'passed':True,'actual_windows_delete_sharing_lock':True,'prior_json_valid_while_locked':True,'new_json_published_after_unlock':True,'gameplay_verified':False}
 Path('reports/oct28-windows-report-lock.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report))
