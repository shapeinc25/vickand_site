# Fonts

Self-hosted, loaded by `src/styles/base/fonts.css`.

| File | Family | Weight / style |
| --- | --- | --- |
| `zilla-slab-400.woff2`, `zilla-slab-400-ext.woff2` | Zilla Slab | 400 |
| `zilla-slab-500.woff2`, `zilla-slab-500-ext.woff2` | Zilla Slab | 500 |
| `zilla-slab-600.woff2`, `zilla-slab-600-ext.woff2` | Zilla Slab | 600 |
| `changa-one-400.woff2` | Changa One | 400 |
| `changa-one-400-italic.woff2` | Changa One | 400 italic |

Both families are released under the SIL Open Font License 1.1
(Zilla Slab — Mozilla / Typotheque, Changa One — Eduardo Tunni). When redistributing the files,
keep a copy of the license next to them: https://openfontlicense.org

The files are subsets made with fontTools (`pyftsubset … --layout-features='*' --no-hinting --flavor=woff2`),
split like Google Fonts: the plain file holds Latin (`U+0000-00FF`, punctuation, `€ ™ ↑ ↓ ≠` …, the exact
ranges are the `unicode-range` values in `src/styles/base/fonts.css`), `-ext` holds Latin Extended.
Changa One only ships the Latin part. To add another script (Cyrillic, for example), subset it from the
full font into its own file and add an `@font-face` with its `unicode-range`.

