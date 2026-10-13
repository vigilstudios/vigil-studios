#!/usr/bin/env python3
"""Generate the initial Inter subset and its complete extended-character fallback.
Requires fonttools[woff]==4.66.1. Verifies advances and outline parity at all site weights.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
r=Path(__file__).resolve().parents[1]
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
font_dir = r / 'public/fonts/inter'
# English UI plus its punctuation/currency; all other original glyphs stay in
# the complete face below, loaded only when their characters are actually used.
unicodes = 'U+0000-007F,U+00A0,U+00A9,U+00AE,U+00B0,U+00B7,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD'
subset.main([str(font_dir / 'InterVariable.woff2'), '--output-file=' + str(font_dir / 'InterVariable-latin.woff2'), '--flavor=woff2', '--unicodes=' + unicodes, '--layout-features=ccmp,locl,mark,mkmk,kern,liga,calt,tnum'])
full=TTFont(r/'public/fonts/inter/InterVariable.woff2')
latin=TTFont(r/'public/fonts/inter/InterVariable-latin.woff2')
points=sorted(set(full.getBestCmap())-set(latin.getBestCmap()))
ranges=[]
for p in points:
 if ranges and ranges[-1][1]+1==p:ranges[-1][1]=p
 else:ranges.append([p,p])
u=', '.join(f'U+{a:04X}' if a==b else f'U+{a:04X}-{b:04X}' for a,b in ranges)
css='''/* Same Inter outlines for characters outside the initial Latin subset. The
 * disjoint unicode range prevents this full font from downloading for Latin text. */
@font-face {
  font-family: "VigilInterExtended";
  src: url("/fonts/inter/InterVariable.woff2") format("woff2");
  font-weight: 400 700;
  font-style: normal;
  font-display: swap;
  unicode-range: '''+u+''';
}
'''
(r/'public/fonts/inter/inter-extended.css').write_text(css)
print('Extended ranges:',len(ranges),'Latin glyphs:',len(latin.getGlyphOrder()))
# Verify original advances and outlines are unchanged at both weight/optical-size extremes.
from fontTools.varLib.instancer import instantiateVariableFont
for w in [400,500,600,700]:
 for opsz in [14,32]:
  original=instantiateVariableFont(full,{'wght':w,'opsz':opsz},inplace=False)
  subset=instantiateVariableFont(latin,{'wght':w,'opsz':opsz},inplace=False)
  for code,glyph in latin.getBestCmap().items():
   ref=full.getBestCmap()[code]
   assert original['hmtx'][ref]==subset['hmtx'][glyph],(code,w,opsz,'advance')
   a=original['glyf'][ref].getCoordinates(original['glyf'])[0]
   b=subset['glyf'][glyph].getCoordinates(subset['glyf'])[0]
   assert list(a)==list(b),(code,w,opsz,'outline')
print('All subset advances and outlines match the original across 400/500/600/700 and opsz 14/32')
