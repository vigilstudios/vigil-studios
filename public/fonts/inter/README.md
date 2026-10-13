# Inter 4.1

Original variable font from the official Inter distribution:
https://rsms.me/inter/font-files/InterVariable.woff2?v=4.1

Upstream: https://github.com/rsms/inter/tree/v4.1

Licensed under the SIL Open Font License 1.1; see `OFL.txt`.
Bundled locally so production builds do not depend on Google's Inter URL format.

`InterVariable-latin.woff2` is a 49 KB initial-load subset for the English UI and
its punctuation/currency, keeping
both original variable axes, hinting, normal shaping/kerning and tabular digits.
`inter-extended.css` maps every remaining original code point to the complete
font. Its disjoint Unicode ranges avoid downloading the complete font when the
initial subset covers the text, while preserving every original character.

Regenerate with Python and `fonttools[woff]==4.66.1` installed:

```sh
python scripts/subset-site-font.py
```

The script verifies every retained glyph's advances and outlines against the
original at weights 400/500/600/700 and optical sizes 14/32.
