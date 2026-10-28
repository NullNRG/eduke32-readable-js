#!/usr/bin/env python3
"""Persist a long build's log and process outcome independently of chat turns."""
import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import subprocess
import sys

def put(path, document):
    path.parent.mkdir(parents=True,exist_ok=True)
    stage=path.with_suffix(path.suffix+'.partial')
    stage.write_text(json.dumps(document,indent=2),encoding='utf-8')
    os.replace(stage,path)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--log',type=Path,required=True)
    parser.add_argument('--state',type=Path,required=True)
    parser.add_argument('command',nargs=argparse.REMAINDER)
    args=parser.parse_args()
    command=args.command
    if command and command[0]=='--':command=command[1:]
    if not command:parser.error('a command is required')
    args.log.parent.mkdir(parents=True,exist_ok=True)
    status={'format':'source-first-persistent-job/1','pid':os.getpid(),
        'started_utc':datetime.now(timezone.utc).isoformat(),'cwd':str(Path.cwd()),
        'command':command,'status':'running','exit_code':None,'log':str(args.log)}
    put(args.state,status)
    try:
        with args.log.open('w',encoding='utf-8') as stream:
            result=subprocess.run(command,stdout=stream,stderr=subprocess.STDOUT)
        code=result.returncode
        status.update(status='completed' if code==0 else 'failed',exit_code=code)
    except Exception as error:
        code=1
        status.update(status='launch-failed',exit_code=code,error=str(error))
    status['finished_utc']=datetime.now(timezone.utc).isoformat()
    put(args.state,status)
    return code

if __name__=='__main__':sys.exit(main())
