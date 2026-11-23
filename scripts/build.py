#!/usr/bin/env python3
"""Build static episode JSON from RSS; fallback to bundled snapshot on network failure."""
import json, os, re, urllib.request, xml.etree.ElementTree as ET
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RSS='https://feeds.ivoox.com/feed_fg_f11530283_filtro_1.xml'
NS={'itunes':'http://www.itunes.com/dtds/podcast-1.0.dtd'}
# Etiquetas editoriales: se basan en el TEMA del título, no en palabras
# incidentales de las descripciones (que suelen mencionar otras disciplinas).
# Un episodio puede pertenecer a varias categorías.
TOPIC_RULES = {
    'Cómic': [r'daredevil',r'plan editorial',r'panini',r'c[oó]mic',r'vi[ñn]etas',r'frank miller',r'neon club.*(nice house|powerbomb|arrowsmith|supergirl|superman|beta ray bill|death or glory|strange adventures|batman: caballero blanco|sheriff de babilonia|tortugas ninja|parker de darwyn|murder falcon|hay algo matando ni[ñn]os)',r'kosmik comics',r'batman y spawn',r'geoff',r'dcu',r'dc studios',r'marvel y dc'],
    'Videojuegos': [r'videojueg',r'clair obscur',r'expedition 33',r'final fantasy',r'cyberpunk edgerunners',r'goty',r'monkey island',r'chocobo',r'gamer'],
    'Series': [r'severance',r'andor',r'arcane',r'ahsoka',r'mandalorian',r'last of us',r'peripheral',r'anillos de poder',r'casa del drag[oó]n',r'she.hulk',r'sandman',r'pacificador',r'caballero luna',r'the boys t3',r'obi wan',r'series'],
    'Cine': [r'evil dead',r'conan el b[aá]rbaro',r'shaun of the dead',r'zombies party',r'el protegido',r'the substance',r'la sustancia',r'matanza de texas',r'hereditary',r'armageddon',r'la princesa mononoke',r'american history x',r'guardianes de la galaxia',r'as bestas',r'gran lebowski',r'todo a la vez',r'seven$',r'el quinto elemento',r'doctor strange',r'el resplandor',r'predator',r'wakanda forever',r'cine',r'pel[ií]culas',r'oscars',r' nop$'],
}
def categories(title):
    title=title.casefold()
    tags=[name for name,patterns in TOPIC_RULES.items() if any(re.search(p,title) for p in patterns)]
    return tags or ['Otros']

def build(raw):
    root=ET.fromstring(raw);channel=root.find('channel'); out=[]
    for item in channel.findall('item'):
        title=(item.findtext('title') or '').strip(); desc=(item.findtext('description') or '').strip()
        link=(item.findtext('link') or '').strip(); guid=item.findtext('guid') or link
        if not link.startswith('https://www.ivoox.com/'):continue
        season=item.findtext('itunes:season',namespaces=NS)
        if not season:
            m=re.match(r'\s*(\d+)\s*[xX]\s*\d+',title);season=m.group(1) if m else None
        try:season=int(season) if season else None
        except ValueError:season=None
        try:date=parsedate_to_datetime(item.findtext('pubDate')).astimezone(timezone.utc).isoformat()
        except (TypeError,ValueError):date=''
        cover=item.find('itunes:image',NS)
        image=cover.get('href','') if cover is not None else ''
        if not image:image=channel.find('itunes:image',NS).get('href','')
        duration=item.findtext('itunes:duration',default='',namespaces=NS)
        out.append({'id':guid,'title':title,'description':desc,'date':date,'season':season,'duration':duration,'image':image,'categories':categories(title),'category':categories(title)[0],'ivoox':link})
    out.sort(key=lambda e:e['date'],reverse=True)
    return out

def main():
    snapshot=(ROOT/'data/catalogo-inicial.xml').read_bytes()
    raw=snapshot;source='instantánea incluida'
    if os.getenv('HDP_FETCH_RSS')=='1':
        try:
            req=urllib.request.Request(RSS,headers={'User-Agent':'HdP-Website/1.0 (+https://github.com/)'})
            with urllib.request.urlopen(req,timeout=25) as response:raw=response.read()
            if not build(raw):raise ValueError('RSS sin episodios')
            source='RSS en directo'
        except Exception as exc:print(f'RSS no disponible; usando instantánea: {exc}')
    episodes=build(raw)
    if not episodes:raise RuntimeError('El RSS no contiene episodios válidos')
    # Preserve older episodes if a shorter live RSS only exposes recent items.
    previous=ROOT/'episodes.json'
    if previous.exists():
        try:
            old=json.loads(previous.read_text(encoding='utf-8')).get('episodes',[])
            merged={e['id']:e for e in old if e.get('id')}
            merged.update({e['id']:e for e in episodes})
            episodes=sorted(merged.values(),key=lambda e:e.get('date',''),reverse=True)
        except (ValueError,KeyError,TypeError) as exc:print('Catálogo anterior no válido:',exc)
    (ROOT/'episodes.json').write_text(json.dumps({'updated':datetime.now(timezone.utc).isoformat(),'source':source,'episodes':episodes},ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    # Local file previews cannot fetch JSON. Bundle the same fresh data in JS.
    payload={'episodes':json.loads((ROOT/'episodes.json').read_text(encoding='utf-8')),'config':json.loads((ROOT/'config.json').read_text(encoding='utf-8'))}
    (ROOT/'data/catalogo-local.js').write_text('window.HDP_LOCAL_DATA='+json.dumps(payload,ensure_ascii=False,separators=(',',':')).replace('<','\u003c').replace('>','\u003e')+';\n',encoding='utf-8')
    print(f'Generados {len(episodes)} episodios desde {source}; temporadas: {sorted(set(e["season"] for e in episodes if e["season"] is not None))}')
if __name__=='__main__':main()
