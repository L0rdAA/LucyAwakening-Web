from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
class Page(HTMLParser):
 def __init__(self,p):
  super().__init__(); self.ids=[]; self.links=[]; self.frames=[]; self.h1=0; self.feed(p.read_text(encoding='utf-8-sig'))
 def handle_starttag(self,t,a):
  a=dict(a)
  if 'id' in a:self.ids.append(a['id'])
  if t=='a':self.links.append(a.get('href',''))
  if t=='iframe':self.frames.append(a)
  if t=='h1':self.h1+=1
pages={p.name:Page(p) for p in Path('.').glob('*.html')}
for name in ('index.html','guide.html','about.html'):
 p=pages[name]; assert p.h1==1 and len(p.ids)==len(set(p.ids))
 for link in p.links:
  u=urlsplit(link)
  if u.scheme or u.netloc:continue
  target=u.path or name
  assert Path(target).exists(), (name,link)
  if u.fragment: assert unquote(u.fragment) in pages[target].ids,(name,link)
f=pages['index.html'].frames
assert len(f)==1 and f[0]['src']=='game.html' and f[0]['title']=="Lucy's Awakening game" and f[0]['allow']=='autoplay; fullscreen' and 'allowfullscreen' in f[0]
assert 'ca-pub-8837335120706633' in Path('index.html').read_text(encoding='utf-8-sig')
print('PASS: headings, local links, anchors, iframe and verification ID')
