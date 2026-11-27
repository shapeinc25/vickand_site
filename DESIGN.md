---
name: Vickand
description: The incumbent visual system for Vickand apps, games and UX design services.
colors:
  primary-button: "#4b64c0"
  primary-token: "#5572da"
  accent-light: "#3d529d"
  accent-pressed-light: "#2e3e76"
  accent-subtle-light: "#e4e8f9"
  secondary-pressed-light: "#cfd8f5"
  accent-dark: "#8599e4"
  accent-hover-dark: "#aab8ec"
  accent-pressed-dark: "#6983de"
  accent-subtle-dark: "#1f294e"
  surface-light: "#e5e2df"
  surface-raised-light: "#ffffff"
  text-light: "#2c2929"
  text-secondary-light: "#5a5454"
  border-light: "#d3cfcf"
  surface-raised-dark: "#3f3b3b"
  auxiliary-light: "#f3f2f2"
  auxiliary-hover-light: "#e6e5e5"
  input-hover-light: "#797171"
  input-hover-dark: "#bab5b5"
  brand-orange: "#ff5c00"
  brand-yellow: "#e9e037"
  brand-green: "#2ecf49"
  brand-blue: "#2f9de1"
  brand-purple: "#7a47d3"
  error-light: "#a5282a"
  error-dark: "#e85053"
  success-light: "#166f3d"
  success-fill-light: "#1b8a4b"
  success-dark: "#3aa969"
  success-fill-dark: "#1f9d55"
  form-error-light: "#ab2800"
  form-error-dark: "#ffb095"
  process-purple: "#8a5dd8"
  process-green: "#8bd740"
  process-yellow: "#f4ef9b"
  process-blue: "#48a9e5"
typography:
  display:
    fontFamily: '"Changa One", "Arial Black", sans-serif'
    fontSize: "clamp(40px, 7vw, 64px)"
    fontWeight: 400
    lineHeight: 1.125
    letterSpacing: "-0.64px"
  headline:
    fontFamily: '"Changa One", "Arial Black", sans-serif'
    fontSize: "48px"
    fontWeight: 400
    lineHeight: "56px"
    letterSpacing: "-0.24px"
  product-title:
    fontFamily: '"Changa One", "Arial Black", sans-serif'
    fontSize: "28px"
    fontWeight: 400
    lineHeight: "normal"
  body:
    fontFamily: '"Zilla Slab", Georgia, serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "28px"
  label:
    fontFamily: '"Zilla Slab", Georgia, serif'
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "28px"
  label-small:
    fontFamily: '"Zilla Slab", Georgia, serif'
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
  process-title:
    fontFamily: '"Changa One", "Arial Black", sans-serif'
    fontSize: "22px"
    fontWeight: 400
    lineHeight: "30px"
  field-label:
    fontFamily: '"Zilla Slab", Georgia, serif'
    fontSize: "12px"
    fontWeight: 600
    lineHeight: "16px"
  reading-body:
    fontFamily: '"Zilla Slab", Georgia, serif'
    fontSize: "20px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  md: "8px"
  lg: "12px"
  xl: "16px"
  2xl: "24px"
  full: "999px"
spacing:
  1: "4px"
  2: "8px"
  3: "12px"
  4: "16px"
  5: "20px"
  6: "24px"
  8: "32px"
  10: "40px"
  12: "48px"
  16: "64px"
components:
  button-primary:
    backgroundColor: "{colors.primary-button}"
    textColor: "{colors.surface-raised-light}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-raised-light}"
    textColor: "{colors.text-light}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.accent-light}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-auxiliary:
    backgroundColor: "{colors.auxiliary-light}"
    textColor: "{colors.text-light}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-label:
    backgroundColor: "transparent"
    textColor: "{colors.text-light}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.surface-raised-light}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  page-toggle-light:
    backgroundColor: "{colors.text-light}"
    textColor: "{colors.surface-raised-light}"
    rounded: "{rounded.full}"
    padding: "3px 20px 3px 5px"
    height: "74px"
    width: "248px"
  page-toggle-dark:
    backgroundColor: "{colors.surface-raised-light}"
    textColor: "{colors.text-light}"
    rounded: "{rounded.full}"
    padding: "3px 5px 3px 25px"
    height: "74px"
    width: "248px"
  process-card:
    textColor: "{colors.surface-raised-light}"
    rounded: "{rounded.lg}"
    padding: "24px"
  soon-chip:
    textColor: "{colors.text-light}"
    rounded: "{rounded.full}"
    padding: "2px 9px"
---

# Design System: Vickand

## Overview

**Creative North Star: "The Playful Product Studio"**

Vickand pairs playful, oversized display lettering with warm slab-serif copy. The Apps & Games path uses a light stone canvas; the UX & Design path uses a charcoal canvas. The shared palette, circular brand mark, pill navigation and framed product screens connect both paths.

The supplied HTML and handoff assets are the visual authority. This record extracts that incumbent system; its descriptive language is a documentation shorthand, not a new identity proposal. Owner-provided product screens, comparison artwork, logos and self-hosted fonts remain the imagery source.

**Key Characteristics:**

- Two deliberate light and dark visitor paths.
- Changa One headlines paired with Zilla Slab reading and controls.
- Authored phone framing, colorful diagram motion and playable details.
- Centered information groups with responsive, fully readable static alternatives.

## Colors

Warm neutral surfaces carry a vivid five-color brand spectrum, with indigo actions and distinct semantic feedback colors. The frontmatter names are documentation aliases for exact source values, not new CSS variables.

### Primary

- **Indigo action:** `primary-button` is the current rendered primary fill. `primary-token` records the underlying shared primitive; it is not the final button fill.
- **Light indigo accent:** `accent-light`, `accent-pressed-light`, `accent-subtle-light` and `secondary-pressed-light` support outlined and ghost actions, focus, and selection.
- **Dark periwinkle accent:** `accent-dark`, `accent-hover-dark`, `accent-pressed-dark` and `accent-subtle-dark` support the same roles against charcoal.

### Secondary

- **Brand spectrum:** `brand-orange`, `brand-yellow`, `brand-green`, `brand-blue` and `brand-purple` belong to the supplied brand mark, mini games and authored diagrams. The brand conic gradient is source-defined; do not approximate it with unrelated gradients.
- **Process spectrum:** `process-purple`, `process-green`, `process-yellow` and `process-blue` are the implemented process-card strokes, distinct from the five brand primitives.
- **Feedback:** paired light/dark error and success tokens describe form states. The final production status messages use `form-error-light` and `form-error-dark`.

### Neutral

- **Light stone:** `surface-light` is the Apps & Games canvas; `surface-raised-light` is white for controls and raised surfaces.
- **Charcoal and ash:** `text-light` becomes the dark canvas; `surface-raised-dark` creates the dark raised layer. White becomes primary dark text; `border-light` becomes secondary dark text.
- **Supporting gray:** `text-secondary-light`, `border-light`, auxiliary fills and input-hover tones keep reading hierarchy and interactive edges visible.

**The Source Order Rule.** Read the complete active cascade before changing a token or component; later production and reference overrides are part of the design authority.

## Typography

**Display Font:** Changa One with Arial Black and sans-serif fallbacks.

**Body Font:** Zilla Slab with Georgia and serif fallbacks. Body, field labels and action labels share this family.

**Character:** Rounded, emphatic display forms provide the playful voice; the slab serif keeps descriptive and operational copy calm and legible. Latin and Cyrillic subsets are self-hosted with `font-display: swap`; retain the source assets and their language coverage.

### Hierarchy

- **Display:** frontmatter `display` maps to the UX hero's dominant line. Its companion lead uses the smaller source clamp and a separate scale transition.
- **Headline:** `headline` maps to repeated section headings; product titles and process titles have their own smaller roles.
- **Body:** `body` is the repeated marketing paragraph treatment. Base body line height is 1.5; repeated section paragraphs use the explicit role above.
- **Label:** default buttons use `label`; compact controls use `label-small`; form labels use `field-label`.
- **Reading:** legal/support articles use `reading-body`, a 72ch maximum line width and a smaller phone treatment. Their headings are content-specific and must not inherit a marketing hero's fixed composition.

English, Russian and Ukrainian have authored responsive overrides. Russian and Ukrainian hero lines reduce their display size and wrap; preserve these overrides instead of shrinking every locale to the shortest label.

**The Readable Motion Rule.** Pause and reduced-motion states must retain every passage in a content-sized static layout. Motion must never be required to read or act.

## Layout

The shared container is centered with a source maximum width (1200px) and a default horizontal gutter (16px). Most section rhythm comes from the frontmatter four-pixel spacing scale. Individual authored sections have their own wider or narrower constraints; do not force all artwork into one universal grid.

Product detail groups are centered within an 850px maximum width. Their three phone canvases use the source artwork ratio (280/518), with the middle phone raised. The authored horizontal correction centers the visible phone bodies rather than their transparent image canvases. Center illustrations by their visible content, not just their image box.

The UX process uses a connected four-card row on wide screens and a narrower responsive arrangement; services and comparisons retain their custom authored compositions. The coming-soon block uses two columns above 900px and a centered single column below it. Important existing breakpoint boundaries include 1184px for the UX tablet story, 1100px for phone-gallery controls, 1024px for compact form typography, 900px for coming-soon stacking, 760px for narrow controls/reading and 520px for compact header/dialog treatment. These are component boundaries, not a new global device taxonomy.

Reading pages use a 1120px outer maximum, a 240px table-of-contents column and a 48px gap on wide screens. At 760px and below, the contents become a wrapping row above the article, with a smaller reading size. Localized labels, footer links and comparison explanations wrap within the viewport. Mobile actions have a minimum height of 44px and grow with their text.

## Elevation & Depth

Depth is a hybrid of neutral surface layering, thin strokes, device frames, controlled translucent chips and shadows for floating menus/dialogs. Most marketing sections sit directly on the canvas. Process cards use a colored stroke and fading tint; their animation scale is not a general-purpose card elevation pattern.

### Shadow Vocabulary

- **Menu:** the header menu uses the source soft shadow (`0 12px 32px rgba(0, 0, 0, 0.18)`).
- **Support dialog:** the always-light card uses the deeper source shadow (`0 24px 64px rgba(44, 41, 41, 0.35)`) above a charcoal translucent, blurred scrim.
- **Outlined controls:** the secondary button uses a one-pixel exterior shadow stroke; fields use an inset one-pixel stroke that thickens for focus/error. These shadows draw boundaries rather than ambient lift.
- **Soon badge:** a translucent gradient, inset highlight and small shadow distinguish the unavailable-store chip. Retain its local light/dark variants.

## Shapes

Rounded rectangles carry the shared radius scale. Compact fields and small controls use the smaller corners; normal buttons and menu panels use the next step; large buttons use the larger step; device wrappers and the support dialog use the broadest rounded rectangle. The brand navigation and unavailable-store chip are fully pill-shaped. The support dialog has a separate compact-phone radius (20px).

The circular multicolor mark, framed phones, diagram chips and playful game objects are established signatures. Preserve their supplied silhouettes and clipping; do not replace the phone framing with generic cards or stretch screen imagery away from its authored crop.

## Components

### Buttons

Existing primary, secondary, ghost, auxiliary and text-label skins share centered icon/label alignment, regular Zilla Slab text and size variables. Their default shape, padding and typography are in the frontmatter; small and large sizes are implemented in `21-icons.css`. Production sets the action icon/label gap (4px), removes legacy icon margins and allows translated labels to wrap on mobile.

The final production stylesheet sets primary buttons and the UX request submit to the frontmatter `primary-button` fill with white text. Earlier hover/pressed custom-property changes do not override that final literal background; do not document those earlier variables as visibly changing this fill. Secondary, ghost, auxiliary and label skins retain their source hover/pressed state mappings. Buttons retain a two-pixel component focus ring, with three-pixel offset; general page controls have the final production focus treatment.

### Inputs / Fields

Fields use the shared raised surface, muted placeholder, inset stroke and compact rounded corners. The standard height and padding are in the frontmatter; small and large sizes remain source variants. Hover changes the stroke tone; focus-within increases the inset stroke to two pixels in the local accent; error uses the local error tone. UX request fields inherit their page's raised surface. Support stays explicitly light even when opened from the dark path.

### Cards / Containers

The UX process card is a tinted, colored-outline container with a compact illustration above its heading and copy. Preserve the four source stage colors and the connected sequence. The support card is a focused dialog, not a marketing tile. Product presentation uses real framed screens and centered descriptive/action groups rather than a new generic card system.

### Navigation

The centered brand pill is a theme-aware path switch. Its exact dimensions and padding are in the frontmatter. Its light state puts the mark first with a 10px gap; its dark state puts the label first with a 5px gap. These explicit reference dimensions override the default action icon/label spacing preference. The separate menu uses the source square icon control, raised rounded panel, active/hover accent fill and language links. Keep keyboard focus and the expanded-state behavior.

### Chips

The unavailable-store chip is a small translucent pill anchored to the source store badge. It communicates release state rather than acting as an enabled store link. Preserve localized copy and the disabled badge's visual treatment.

### Signature motion and media

Keep the Apps & Games particle morph, authored phone display and mini games, and the UX tangled-flow diagram, process, service and comparison sequence. Motion tokens establish common timings, but the authored sequences also have their own local timings; keep those local values unless the sequence is deliberately changed. The late mock-image transition is an active override. Paused and reduced-motion versions use static, fully readable arrangements; they must not reserve obsolete animated-stage height or cover comparison notes. No-JavaScript reading has its own static fallback.

## Do's and Don'ts

### Do:

- **Do** reuse matching handoff assets, existing button skins and shared layouts.
- **Do** center the combined action icon and label horizontally and vertically, with a 4 logical-pixel gap. Center information-board and card illustrations deliberately.
- **Do** preserve the explicitly authored brand-navigation geometry, including its theme-specific mark order and gaps.
- **Do** verify English, Russian and Ukrainian at desktop and narrow phone widths, including 320px.
- **Do** preserve visible keyboard focus, readable contrast and full text in paused, reduced-motion and no-JavaScript reading layouts.

### Don't:

- **Don't** replace the supplied light/dark identity, fonts or artwork with a new visual concept.
- **Don't** force translated labels into fixed-height or non-wrapping action controls.
- **Don't** infer a rendered component's color from its earliest token declaration.
- **Don't** use decorative motion, clipping or diagram overlays to conceal copy or comparison explanations.

<!-- Extraction provenance: supplied .reference/reference.html; src/styles/reference.css in import order, then src/styles/reference-late.css, imported by apps.js, ux.js and legal.js. reference.css imports production.css last; reference-late.css still follows the entire reference.css bundle. Primary evidence: base/02-tokens.css, base/20-component-tokens.css, apps/21-icons.css, apps/11-reduced-motion.css, apps/12-section-2-apps-games-figma-1-329.css, ux/22-block-2.css, ux/23-block-3.css, base/29-block-9.css and production.css. Extracted from current source, 2026-11-27. The sidecar's synthesized tonal ramps are panel previews, not source tokens. -->
