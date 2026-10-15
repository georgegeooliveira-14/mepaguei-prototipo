import re,glob,os,json,shutil,sys
root=os.path.dirname(os.path.abspath(__file__))
PUB='pub' in sys.argv
# variante do teste de usabilidade: mesma base, sem o campo de aporte mensal na aposentadoria
SEM='semaporte' in sys.argv
OUT=f'{root}/dist'+('-pub' if PUB else '')+('-sem' if SEM else '')
order=['base.css']
css=''.join(open(f'{root}/src/{f}').read() for f in sorted(os.listdir(root+'/src')) if f.endswith('.css'))
jsfiles=['core.js']+sorted(f for f in os.listdir(root+'/src') if f.endswith('.js') and f!='core.js' and f!='boot.js')+['boot.js']
js='\n'.join(f'// ---- {f}\n'+open(f'{root}/src/{f}').read() for f in jsfiles if os.path.exists(f'{root}/src/{f}'))
js=f'window.PROTO_PUB={"true" if PUB else "false"};window.PROTO_SEM_APORTE={"true" if SEM else "false"};\n'+js
names=set(re.findall(r"ic\(\s*['\"]([a-z0-9-]+)['\"]",js))|set(re.findall(r"icon\s*:\s*['\"]([a-z0-9-]+)['\"]",js))|set(re.findall(r"data-ic=['\"]([a-z0-9-]+)['\"]",js))
names|=set(re.findall(r"/\*ic\*/['\"]([a-z0-9-]+)['\"]",js))
import os as _o
# ícones: node_modules quando existir; senão o espelho versionado em vendor-icons/
ICON_DIRS=[f'{root}/node_modules/lucide-static/icons', f'{root}/vendor-icons']
def icon_path(n):
    for d in ICON_DIRS:
        q=f'{d}/{n}.svg'
        if _o.path.exists(q): return q
    return None
names|={n for n in re.findall(r"['\"]([a-z][a-z0-9-]{1,30})['\"]",js) if icon_path(n)}
icons={}
missing=[]
for n in sorted(names):
    p=icon_path(n)
    if not p: missing.append(n); continue
    s=open(p).read()
    inner=re.search(r'<svg[^>]*>(.*)</svg>',s,re.S).group(1)
    inner=re.sub(r'\s+',' ',inner).strip()
    icons[n]=inner
if missing: print('MISSING ICONS',missing)
html=open(f'{root}/src/shell.html').read()
html=html.replace('/*CSS*/',css).replace('/*ICONS*/','const ICONS='+json.dumps(icons,ensure_ascii=False)+';').replace('/*JS*/',js)
if PUB:
    head=('<!doctype html>\n<meta charset="utf-8">\n'
          '<meta name="color-scheme" content="light">\n'
          '<meta name="supported-color-schemes" content="light">\n'
          '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">\n'
          '<meta name="mobile-web-app-capable" content="yes">\n'
          '<meta name="apple-mobile-web-app-capable" content="yes">\n'
          '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
          '<meta name="apple-mobile-web-app-title" content="Me Paguei">\n'
          '<meta name="theme-color" content="#040c23">\n'
          '<link rel="manifest" href="manifest.json">\n'
          '<link rel="apple-touch-icon" href="assets/app-icon.png">\n')
    html=head+html
    manifest={"name":"Me Paguei — Protótipo","short_name":"Me Paguei","start_url":".","scope":".",
              "display":"fullscreen","display_override":["fullscreen","standalone"],
              "orientation":"portrait","background_color":"#040c23","theme_color":"#040c23",
              "icons":[{"src":"assets/app-icon-192.png","sizes":"192x192","type":"image/png","purpose":"any"},
                       {"src":"assets/app-icon.png","sizes":"512x512","type":"image/png","purpose":"any"}]}
os.makedirs(OUT,exist_ok=True)
if PUB: open(f'{OUT}/manifest.json','w').write(json.dumps(manifest,ensure_ascii=False))
open(f'{OUT}/index.html','w').write(html)
os.makedirs(f'{OUT}/assets',exist_ok=True)
shutil.copytree(f'{root}/assets', f'{OUT}/assets', dirs_exist_ok=True)
print('built',('PUB ' if PUB else ''),len(html)//1024,'KB, icons',len(icons),'->',os.path.basename(OUT))
