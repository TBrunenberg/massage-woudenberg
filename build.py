"""Bouwt de site: content/ + templates/ -> dist/.  Gebruik: python build.py"""
import os, re, glob, shutil, datetime, yaml, markdown
from jinja2 import Environment, FileSystemLoader, StrictUndefined
from markupsafe import Markup, escape

ROOT = os.path.dirname(os.path.abspath(__file__))
DIST = os.path.join(ROOT, 'dist')
MASSAGES = ['anti-stress-massage', 'ontspanningsmassage', 'sportmassage', 'voetreflexmassage',
            'hotstone-massage', 'cupping-massage', 'magnesium-massage']
MAANDEN = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus',
           'september', 'oktober', 'november', 'december']

def load(p):
    with open(os.path.join(ROOT, 'content', p), encoding='utf-8') as f:
        return yaml.safe_load(f) or {}

def tekst(v):
    """Platte tekst uit het beheerscherm: geen HTML laten insluipen."""
    if isinstance(v, Markup) or v is None: return '' if v is None else v
    return str(v).replace('<', '&lt;').replace('>', '&gt;')

def bedrag(v):
    v = str(v).strip().replace('€', '').replace('.', ',').strip()
    if ',' not in v: v += ',00'
    heel, cent = v.split(',', 1)
    return heel, (cent + '00')[:2]

def img(path):
    """Paden uit het beheerscherm normaliseren naar assets/img/..."""
    if not path: return ''
    return str(path).lstrip('/')

def nieuws_laden():
    items = []
    for f in glob.glob(os.path.join(ROOT, 'content', 'nieuws', '*.md')):
        raw = open(f, encoding='utf-8').read()
        m = re.match(r'^---\s*\n(.*?)\n---\s*\n?(.*)$', raw, re.S)
        meta, body = (yaml.safe_load(m.group(1)) or {}, m.group(2)) if m else ({}, raw)
        if meta.get('concept'): continue
        d = meta.get('datum')
        if isinstance(d, str): d = datetime.date.fromisoformat(d[:10])
        if isinstance(d, datetime.datetime): d = d.date()
        slug = os.path.splitext(os.path.basename(f))[0]
        items.append(dict(
            titel=meta.get('titel', ''), slotwoord=meta.get('slotwoord', ''),
            samenvatting=meta.get('samenvatting', ''), datum=d,
            datum_tekst=f'{d.day} {MAANDEN[d.month-1]} {d.year}' if d else '',
            afbeelding=img(meta.get('afbeelding')), afbeelding_tekst=meta.get('afbeelding_tekst', ''),
            html=Markup(markdown.markdown(str(body).replace('<', '&lt;'))), url=f'nieuws-{slug}.html'))
    items.sort(key=lambda n: n['datum'] or datetime.date.min, reverse=True)
    return items

def main():
    env = Environment(loader=FileSystemLoader(os.path.join(ROOT, 'templates')),
                      undefined=StrictUndefined, finalize=tekst, keep_trailing_newline=True)
    env.filters['heel'] = lambda v: bedrag(v)[0]
    env.filters['cent'] = lambda v: bedrag(v)[1]
    env.filters['e'] = lambda v: escape(v)
    t = load('tarieven.yml')
    for k in ('prijs_30', 'prijs_60'): t[k] = '%s,%s' % bedrag(t[k])
    for r in t.get('rittenkaarten') or []: r['prijs'] = '%s,%s' % bedrag(r['prijs'])
    massages = []
    for s in MASSAGES:
        m = load(f'massages/{s}.yml'); m['slug'] = s
        for k in ('kaart_labels', 'labels', 'teksten', 'voordelen'): m[k] = m.get(k) or []
        m['let_op'] = m.get('let_op') or ''
        massages.append(m)
    p = load('praktijk.yml')
    nr = re.sub(r'\D', '', str(p['telefoon']))
    p['telefoon_link'] = '+31' + nr[1:] if nr.startswith('0') else '+' + nr
    p['route_link'] = 'https://www.google.com/maps/search/?api=1&query=' + '+'.join(f"{p['straat']} {p['postcode_plaats']}".split())
    for k, v in p.items(): p[k] = '' if v is None else str(v)
    ctx = dict(p=p, t=t, h=load('home.yml'),
               reviews=load('reviews.yml').get('reviews') or [], massages=massages, nieuws=nieuws_laden())

    shutil.rmtree(DIST, ignore_errors=True)
    shutil.copytree(os.path.join(ROOT, 'assets'), os.path.join(DIST, 'assets'))
    shutil.copytree(os.path.join(ROOT, 'admin'), os.path.join(DIST, 'admin'))
    for f in sorted(glob.glob(os.path.join(ROOT, 'templates', '*.html'))):
        name = os.path.basename(f)
        c = dict(ctx)
        if name[:-5] in MASSAGES: c['m'] = massages[MASSAGES.index(name[:-5])]
        out = env.get_template(name).render(**c)
        open(os.path.join(DIST, name), 'w', encoding='utf-8', newline='').write(out)
    if ctx['nieuws']:
        open(os.path.join(DIST, 'nieuws.html'), 'w', encoding='utf-8').write(env.get_template('_nieuws/nieuws.html').render(**ctx))
        for n in ctx['nieuws']:
            open(os.path.join(DIST, n['url']), 'w', encoding='utf-8').write(env.get_template('_nieuws/bericht.html').render(n=n, **ctx))
    demo()
    print('Gebouwd:', len(os.listdir(DIST)), 'items in dist/')

def demo():
    """Proefversie van het beheerscherm: echte inhoud, zonder inloggen, niets wordt opgeslagen."""
    import json
    cfg = yaml.safe_load(open(os.path.join(ROOT, 'admin', 'config.yml'), encoding='utf-8'))
    cfg['backend'] = {'name': 'test-repo'}
    cfg['load_config_file'] = False
    cfg.pop('site_url', None); cfg.pop('display_url', None)
    files = {}
    for f in glob.glob(os.path.join(ROOT, 'content', '**', '*.*'), recursive=True):
        parts = os.path.relpath(f, ROOT).replace(os.sep, '/').split('/')
        node = files
        for p in parts[:-1]: node = node.setdefault(p, {})
        node[parts[-1]] = {'content': open(f, encoding='utf-8').read()}
    html = f"""<!doctype html>
<html lang="nl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Proefversie beheer</title>
<style>#demo-balk{{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:#5b5e2a;color:#fff;font:14px/1.4 system-ui,sans-serif;padding:8px 16px;text-align:center}}</style>
</head><body>
<div id="demo-balk">Proefversie: kijk en probeer gerust, maar niets wordt opgeslagen of gepubliceerd.</div>
<script>window.CMS_MANUAL_INIT = true; window.repoFiles = {json.dumps(files, ensure_ascii=False)};</script>
<script src="https://unpkg.com/decap-cms@3.17.3/dist/decap-cms.js"></script>
<script>CMS.init({{config: {json.dumps(cfg, ensure_ascii=False)}}});</script>
</body></html>"""
    os.makedirs(os.path.join(DIST, 'admin', 'demo'), exist_ok=True)
    open(os.path.join(DIST, 'admin', 'demo', 'index.html'), 'w', encoding='utf-8').write(html)

if __name__ == '__main__':
    main()
