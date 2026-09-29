#!/usr/bin/env python3
"""Rebuild revision 6 hero roster Markdown and JSON from the four kit files."""
import json
from pathlib import Path
O=Path(__file__).resolve().parent
melkor=[
 {'id':'melkor_worldbreaker','faction':'Melkor','hero':'Melkor - Worldbreaker','compensates':'A tiny sanctuary cannot maintain broad industry or replace a large army.','field_power':{'name':'Worldbreak','effect':'Damage one defended obstacle or clustered position after a visible wind-up; cannot destroy a healthy hero or capital in one use.','cost':'4 readiness; ordinary local attack commitment','range':'One visible local encounter position','duration':'One attack after a one-phase warning','counter':'Disperse, use layered barriers, interrupt the approach or attack another objective.'},'support_power':{'name':'Call of the Dark','effect':'Activate one discovered, living Balrog or Dragon with an existing map ID. It walks or flies from its real location; no new entity, hatching or resurrection is created.','cost':'3 readiness + one weekly hero commitment + 20P + 20M + 10E; reserve full supply and great-creature points; normal movement operations thereafter','range':'One discovered candidate with a known traversable route; no teleportation','duration':'One call; arrival follows actual travel time','counter':'Scout its departure, block or intercept the route, or kill the finite candidate before deployment.'},'passive':{'name':'Unspent Might','effect':'Maximum readiness is 12 and a recovery commitment restores 6, enabling more personal intervention.','limit':'One hero commitment per week; sanctuary supply 12 and great-creature capacity 2 remain fixed. It grants no new creature production or extra map presence.'},'retained_weakness':'Small economy, limited simultaneous coverage and a finite, nonrenewable pool of living Balrogs and Dragons.'},
 {'id':'melkor_dark_architect','faction':'Melkor','hero':'Melkor - Dark Architect','compensates':'Expensive creature industry matures slowly and needs coordination across vulnerable sites.','field_power':{'name':'Iron Edict','effect':'Coordinate a synchronized plan for up to three owned great creatures on one connected front; no additional attacks, movement or foreign control.','cost':'3 readiness + one weekly hero commitment; units retain normal movement and supply requirements','range':'One connected front with surveyed routes','duration':'One weekly operation; plans resolve through ordinary tactical phases','counter':'Divide the front, block one route, interrupt preparation or threaten an uncovered city.'},'support_power':{'name':'Forge Will','effect':'Advance one fully paid, staffed production job by one turn; cannot finish in the turn it starts and cannot create duplicate outputs.','cost':'3 readiness + one weekly hero commitment + 10E; all original inputs, workers, capacity and facility remain required','range':'One reachable owned worksite in one connected region','duration':'One job at one weekly resolution; at most once per turn','counter':'Raid the facility, deny inputs, displace workers or destroy the job before completion.'},'passive':{'name':'Brood Discipline','effect':'After research, reduce future Dragon/Balrog base production time by 25%, rounded up; costs do not fall.','limit':'Unlock costs 60M + 40K + 30E and three research turns. Six ordinary queues maximum, full reservations and upkeep; never applies to hero recreation.'},'retained_weakness':'Lower personal combat capacity, slower economic setup and expensive, exposed production. Existing-creature calls remain available at the same cost; new Dragons and Balrogs require this doctrine.'}
]
parts=[('Valar','hero-kits-valar-v5.json'),('Peoples and communities','hero-kits-peoples-v5.json'),('Named Istari','hero-kits-named-istari-v6.json'),('Istari, Maiar and guardians','hero-kits-other-v5.json')]
rows=[]
for cat,f in parts:
 data=json.loads((O/f).read_text())
 for row in data: row['category']=cat
 rows+=data
for row in melkor: row['category']='Melkor doctrines'
rows+=melkor
# Normalize phase/commitment vocabulary without altering effects.
def clean(x):
 if isinstance(x,str):
  for a,b in [('encounter beats','tactical phases'),('encounter phase','tactical phase'),('encounter phases','tactical phases'),('weekly hero assignment','weekly hero commitment'),('Readiness','readiness'),('—','-'),('–','-'),('‑','-')]: x=x.replace(a,b)
  return x
 if isinstance(x,list): return [clean(v) for v in x]
 if isinstance(x,dict):return {k:clean(v) for k,v in x.items()}
 return x
rows=clean(rows)
assert len(rows)==55 and len({r['id'] for r in rows})==55
assert len({r['faction'] for r in rows})==54
required={'name','effect','cost','range','duration','counter'}
for r in rows:
 for k in ['field_power','support_power']: assert set(r[k])==required,(r['id'],k)
 assert set(r['passive'])=={'name','effect','limit'}
 for key in ['compensates','retained_weakness']: assert r[key]
manifest={'revision':6,'status':'proposed; not playtested','faction_count':54,'starting_profile_count':55,'defaults':{'readiness':6,'recovery_per_hero_commitment':3,'worldbreaker_readiness':12,'worldbreaker_recovery':6,'active_heroes_per_faction':1,'melkor_doctrine_locked':True,'same_effect_stacking':'strongest effect only','hard_disable_reapplication_grace':'two tactical phases','production_acceleration':'no completion in the turn a job starts; no resource or entity duplication','exclusive_creatures':'All Balrogs and Dragon forms obey only Melkor; allied movement, rally and transport powers cannot issue or revise their orders. Worldbreaker calls existing living IDs, Dark Architect may also produce new ones'},'profiles':rows}
(O/'hero-balance-roster.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
intro='''# Hero powers and faction balance - revision 6

**55 starting profiles across 54 factions.** Each entry has two defining powers, one passive, the shortcoming it helps and the weakness it retains. These are proposed starting kits, not evidence of achieved balance. Full progression trees and detailed combat statistics are later tuning work.

**Ten Istari choices:** Gandalf, Saruman, Radagast and the two Blue Wizards are five named factions alongside the five generic orders. Each has one fixed hero and one active/pending hero slot. Named identities are unique within a campaign; a generic order cannot recruit one as an extra hero. The two Blue Wizards are separate choices, with invented gameplay roles. All named Wizards use recipe A plus their faction component and the ordinary paid recreation rule. These new kits have offensive signatures; revision 5's other fifty profiles remain unchanged pending a separate combat redesign. New attack-equivalent figures are provisional tuning measures, not a complete combat-stat system.

**Shared rules:** local powers require the hero's field-encounter commitment; regional support uses the weekly hero commitment instead of travel, combat or recovery. Normal readiness is 6 and recovery restores 3; Worldbreaker uses 12/6. A second large spell is not a second strategic assignment. Some named field powers, such as Iron Edict, explicitly operate at regional scale and consume that assignment.

Paid jobs still need their resources, people, queues and source access. Production acceleration cannot complete a job in the turn it starts. Identical effects do not stack: use the strongest. Hard disables give the target two tactical phases of protection from another disable after ending. No power deletes a healthy hero/capital, produces extra hero slots or bypasses the exclusive Melkor allegiance of Dragons/Balrogs. Allied movement, rally and transport powers cannot issue or revise their orders; only Melkor does. Physical harm and obstruction remain valid counters.

**Ordinary interface information stays universal.** Known costs, prerequisites, inventory, repair needs and observed report times are visible to everyone. Intelligence perks reveal additional world evidence or preserve information; they never require hiding basic controls or known facts from other factions.

**Reading order:** Valar; Elven clans, kingdoms and other peoples; named Istari; generic Istari, other Maiar and guardians; Melkor's two doctrines. Faction production and hero recipes remain in `docs/design/silmarillion-game-report.md`. The machine-readable companion is `hero-balance-roster.json`.
'''
chunks=[intro]
for cat in ['Valar','Peoples and communities','Named Istari','Istari, Maiar and guardians','Melkor doctrines']:
 chunks.append('## '+cat+'\n')
 for r in [x for x in rows if x['category']==cat]:
  chunks.append('### '+r['hero']+'\n\n**Faction:** '+r['faction']+'\n\n**Helps with:** '+r['compensates']+'\n\n**Remaining weakness:** '+r['retained_weakness']+'\n')
  for kind,key in [('Field power','field_power'),('Support power','support_power')]:
   q=r[key]
   chunks.append('**'+kind+' - '+q['name']+':** '+q['effect']+'\n\n- **Cost:** '+q['cost']+'\n- **Reach / duration:** '+q['range']+'; '+q['duration']+'\n- **Counter:** '+q['counter']+'\n')
  a=r['passive'];chunks.append('**Passive - '+a['name']+':** '+a['effect']+' **Limit:** '+a['limit']+'\n')
out_md=O/'docs'/'design'/'hero-balance-roster.md'
out_md.parent.mkdir(parents=True,exist_ok=True)
out_md.write_text('\n'.join(chunks))
print('Validated 55 hero profiles,110 powers,55 passives; wrote Markdown + JSON.')
