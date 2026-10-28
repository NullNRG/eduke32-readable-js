"""No historical output, partial rebuild, or disappearing symbol can claim the goal."""
import json, sys
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
sys.path.insert(0,str(ROOT/'tools'))
from source_first_autonomous import summarize,plan,read_link,family
old=read_link(ROOT/'factory-output/source-first/globally-linked/global-recovery.json')
assert len(old['remaining'])==5065
same=summarize(old,old,156)
assert same['verified_net_recovery_lower_bound'] is None and not same['ninety_percent_goal_met']
assert same['target_additional_recoveries']==4559 and same['target_maximum_remaining']==506
missing=old.copy();missing['remaining']=old['remaining'][:506];missing['total_blocked_definitions']=506
partial=missing.copy();partial['completed_source_units']=155
assert summarize(partial,old,156,set(),True)['verified_net_recovery_lower_bound'] is None
# Disappeared definitions count as ZERO without corresponding verified exports.
assert summarize(missing,old,156,set(),True)['verified_net_recovery_lower_bound']==0
old_names={(r['source'],r['name']) for r in old['remaining']}
recover={key for key in old_names if key not in {(r['source'],r['name']) for r in missing['remaining']}}
r=summarize(missing,old,156,recover,True)
assert r['verified_net_recovery_lower_bound']>0 and r['verified_net_recovery_lower_bound']<4559
assert plan(old,156)['priority_units']
assert family('unlinked identifiers: a,b')=='linkage'
assert family('CXXOperatorCallExpr')=='cpp-operators'
print('PASS: historical/stale, partial inventory, missing definition, goal gate, blocker families and priorities')
