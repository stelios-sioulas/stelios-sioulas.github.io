from pathlib import Path
import base64, re

ROOT = Path('.')
IMAGE_B64 = '''REPLACE_ME'''

HEADER_CSS = r'''
/* Unified site-wide header/navigation */
.site-header{position:sticky!important;top:0!important;z-index:50!important;background:rgba(7,10,15,.95)!important;backdrop-filter:blur(12px);border-bottom:1px solid var(--line)!important}
.site-header .site-top{min-height:66px;display:flex;align-items:center;justify-content:space-between;gap:18px;width:min(1120px,calc(100% - 32px));margin:auto;padding:0}
.site-header .site-brand{font:700 19px Oswald,sans-serif!important;text-transform:uppercase;letter-spacing:.05em;display:inline-flex;align-items:center;gap:9px;white-space:nowrap;color:inherit!important}
.site-header .site-brand img{width:24px;height:24px;display:block;flex:0 0 auto}
.site-header .site-brand-stelios{color:#fff!important}.site-header .site-brand-sioulas{color:#2d6598!important}
.site-header .site-nav{display:flex!important;gap:18px!important;align-items:center!important;justify-content:flex-end!important;flex-wrap:wrap!important}
.site-header .site-nav a{font:600 12px Oswald,sans-serif!important;text-transform:uppercase!important;color:var(--muted)!important;letter-spacing:.05em!important;line-height:1!important;padding:0!important;background:none!important;border:0!important;border-radius:0!important}
.site-header .site-nav a:hover,.site-header .site-nav a.active{color:var(--accent2)!important}
.site-header .site-nav a.site-lang{border:1px solid var(--line)!important;padding:6px 9px!important;border-radius:999px!important;color:var(--accent2)!important}
@media(max-width:900px){.site-header .site-top{align-items:flex-start;padding:12px 0}.site-header .site-nav{gap:12px!important}}
@media(max-width:560px){.site-header .site-top{min-height:60px;align-items:center}.site-header .site-brand{font-size:17px!important}.site-header .site-nav{gap:10px!important}.site-header .site-nav a{font-size:11px!important}}
'''
MOBILE_HEADER_CSS = r'''
/* Unified mobile header/navigation typography */
.site-mobile-header{position:sticky!important;top:0!important;z-index:50!important;background:rgba(7,10,15,.95)!important;backdrop-filter:blur(12px);border-bottom:1px solid var(--line)!important}
.site-mobile-header .site-mobile-top{min-height:58px;display:flex;align-items:center;justify-content:space-between;gap:12px}
.site-mobile-header .site-mobile-brand{display:flex;align-items:center;gap:8px;font:700 18px Oswald,sans-serif!important;text-transform:uppercase;letter-spacing:.04em}
.site-mobile-header .site-mobile-brand img{width:24px;height:24px}.site-mobile-header .site-mobile-brand b{color:#fff}.site-mobile-header .site-mobile-brand span{color:#2d6598}
.site-mobile-header .site-mobile-actions{display:flex;align-items:center;gap:8px}.site-mobile-header .site-mobile-lang{border:1px solid var(--line);background:var(--panel);color:var(--accent2);border-radius:999px;padding:7px 10px;font:600 11px Oswald,sans-serif!important;letter-spacing:.06em}
.site-mobile-header .site-mobile-btn{border:1px solid var(--line);background:var(--panel);color:#fff;border-radius:10px;width:42px;height:42px;font-size:22px;display:grid;place-items:center}
.site-mobile-header .site-mobile-nav{display:none;padding:0 0 14px;grid-template-columns:repeat(2,1fr);gap:8px}.site-mobile-header .site-mobile-nav.open{display:grid}
.site-mobile-header .site-mobile-nav a{padding:10px 12px;border:1px solid var(--line);background:rgba(16,23,34,.82);border-radius:10px;color:var(--muted);font:600 13px Oswald,sans-serif!important;text-transform:uppercase;letter-spacing:.04em}
'''
LIVE_CSS = r'''
.live-highlights{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:28px 0 24px}.live-highlight{padding:18px;border:1px solid var(--line);background:linear-gradient(145deg,var(--panel2),var(--panel))}.live-highlight .meta{color:var(--accent2);font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px}.live-highlight h3{font-size:20px;margin:0 0 7px}.live-highlight p{margin:0;color:var(--muted);font-size:13px}@media(max-width:650px){.live-highlights{grid-template-columns:1fr}}
'''

def add_style(path, css):
    s=path.read_text(encoding='utf-8')
    if css.strip() not in s:
        s=s.replace('</head>', '<style>'+css+'</style>\n</head>', 1)
    path.write_text(s,encoding='utf-8')

def replace_header(s, header):
    return re.sub(r'<header\b.*?</header>', header, s, count=1, flags=re.S|re.I)

def desktop_header(lang, current=None):
    if lang == 'el':
        brand='index-el.html'; about='index-el.html#about'; projects='projects-el.html'; teaching='teaching-el.html'; disc='index-el.html#discography'; live='index-el.html#live'; media='index-el.html#media'; contact='index-el.html#contact'; other='projects.html'; code='EN'
    else:
        brand='index.html'; about='index.html#about'; projects='projects.html'; teaching='teaching.html'; disc='index.html#discography'; live='index.html#live'; media='index.html#media'; contact='index.html#contact'; other='projects-el.html'; code='GR'
    labels=['About','Projects','Teaching','Discography','Live','Media','Contact']
    links=[about,projects,teaching,disc,live,media,contact]
    keys=['about','projects','teaching','discography','live','media','contact']
    nav=''.join(f'<a href="{u}"{" class=\"active\"" if current==k else ""}>{lab}</a>' for u,k,lab in zip(links,keys,labels))
    nav += f'<a class="site-lang" href="{other}" lang="{"en" if lang=="el" else "el"}">{code}</a>'
    return f'<header class="site-header"><div class="site-top"><a class="site-brand" href="{brand}"><img src="assets/favicon-s.svg?v=2" alt=""><span class="site-brand-stelios">Stelios</span> <span class="site-brand-sioulas">Sioulas</span></a><nav class="site-nav">{nav}</nav></div></header>'

def mobile_header(lang):
    if lang=='el':
        brand='mobile-el.html'; langhref='mobile.html'; code='EN'; links=[('index-el.html#about','About'),('projects-el.html','Projects'),('teaching-el.html','Teaching'),('index-el.html#discography','Discography'),('index-el.html#live','Live'),('index-el.html#media','Media'),('index-el.html#contact','Contact')]
    else:
        brand='mobile.html'; langhref='mobile-el.html'; code='EL'; links=[('#about','About'),('#projects','Projects'),('#teaching','Teaching'),('#discography','Discography'),('#live','Live'),('#media','Media'),('#contact','Contact')]
    nav=''.join(f'<a href="{u}">{t}</a>' for u,t in links)
    return f'<header class="site-mobile-header"><div class="wrap site-mobile-top"><a class="site-mobile-brand" href="{brand}"><img src="assets/favicon-s.svg?v=2" alt=""><b>Stelios</b> <span>Sioulas</span></a><div class="site-mobile-actions"><a class="site-mobile-lang" href="{langhref}" lang="{"en" if lang=="el" else "el"}">{code}</a><button class="site-mobile-btn" id="menuBtn" aria-label="Open menu" aria-expanded="false">☰</button></div></div><nav class="wrap site-mobile-nav" id="mobileNav">{nav}</nav></header>'

TRIBUTE_EN='''<section><div class="wrap"><h2>Tribute Projects</h2><div class="list"><a class="project" href="https://uptheprisoners.gr/" target="_blank" rel="noopener"><div><div class="meta">Iron Maiden tribute</div><h3>The Prisoners</h3><p>Drums · active live project.</p></div><div class="arrow">↗</div></a><a class="project" href="https://www.facebook.com/groups/49489087578/" target="_blank" rel="noopener"><div><div class="meta">Metallica tribute</div><h3>The Puppets</h3><p>Drums.</p></div><div class="arrow">↗</div></a><a class="project" href="https://eightballclub.gr/event/showbiz-live-a-tribute-to-muse-2/" target="_blank" rel="noopener"><div><div class="meta">MUSE tribute</div><h3>Showbiz</h3><p>Drums · MUSE tribute project.</p></div><div class="arrow">↗</div></a></div></div></section>'''
TRIBUTE_EL=TRIBUTE_EN.replace('Tribute Projects','Tribute Projects').replace('Drums · active live project.','Drums · ενεργό live project.').replace('Drums · MUSE tribute project.','Drums · MUSE tribute project.')
LIVE_EN='''<div class="live-highlights"><div class="live-highlight"><div class="meta">Festival · Bulgaria</div><h3>John Jeff Touch</h3><p>Festival appearance in Bulgaria with John Jeff Touch.</p></div><div class="live-highlight"><div class="meta">Selected live work</div><h3>Festivals & live events</h3><p>Festival, outdoor and live-event appearances across Stelios's career.</p></div></div>'''
LIVE_EL='''<div class="live-highlights"><div class="live-highlight"><div class="meta">Festival · Βουλγαρία</div><h3>John Jeff Touch</h3><p>Εμφάνιση σε festival στη Βουλγαρία με τους John Jeff Touch.</p></div><div class="live-highlight"><div class="meta">Επιλεγμένες εμφανίσεις</div><h3>Festivals & live events</h3><p>Εμφανίσεις σε festivals, υπαίθρια live και άλλες μουσικές διοργανώσεις.</p></div></div>'''

img=base64.b64decode(IMAGE_B64)
Path('assets/bg-about-stelios.webp').write_bytes(img)

for fn,lang,current in [('index.html','en',None),('index-el.html','el',None),('projects.html','en','projects'),('projects-el.html','el','projects'),('teaching.html','en','teaching'),('teaching-el.html','el','teaching')]:
    p=Path(fn); s=replace_header(p.read_text(encoding='utf-8'),desktop_header(lang,current)); p.write_text(s,encoding='utf-8'); add_style(p,HEADER_CSS)
    s=p.read_text(encoding='utf-8').replace('assets/bg-about.webp?v=crowd-blur','assets/bg-about-stelios.webp').replace('assets/bg-about.webp','assets/bg-about-stelios.webp')
    if fn.startswith('index'):
        if 'class="live-highlights"' not in s and '<h2>Live</h2>' in s:
            s=s.replace('<h2>Live</h2>','<h2>Live</h2>\n      '+(LIVE_EN if lang=='en' else LIVE_EL),1)
        p.write_text(s,encoding='utf-8'); add_style(p,LIVE_CSS)
    if fn=='projects.html' and 'Tribute Projects' not in s:
        marker='<section><div class="wrap"><h2>Other projects & collaborations</h2>'
        s=s.replace(marker,TRIBUTE_EN+'\n'+marker,1)
        s=re.sub(r'<a class="project" href="https://www\.facebook\.com/groups/49489087578/".*?</a>','',s,count=1,flags=re.S)
    if fn=='projects-el.html' and 'Tribute Projects' not in s:
        marker='<section><div class="wrap"><h2>Άλλα projects & συνεργασίες</h2>'
        s=s.replace(marker,TRIBUTE_EL+'\n'+marker,1)
        s=re.sub(r'<a class="project" href="https://www\.facebook\.com/groups/49489087578/".*?</a>','',s,count=1,flags=re.S)
    p.write_text(s,encoding='utf-8')

for fn,lang in [('mobile.html','en'),('mobile-el.html','el')]:
    p=Path(fn); s=replace_header(p.read_text(encoding='utf-8'),mobile_header(lang)); p.write_text(s,encoding='utf-8'); add_style(p,MOBILE_HEADER_CSS)
    s=p.read_text(encoding='utf-8').replace('assets/bg-about.webp?v=crowd-blur','assets/bg-about-stelios.webp').replace('assets/bg-about.webp','assets/bg-about-stelios.webp'); p.write_text(s,encoding='utf-8')
PY