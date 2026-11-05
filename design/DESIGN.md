---
name: EventGraph Engine
colors:
  surface: '#121316'
  surface-dim: '#121316'
  surface-bright: '#38393c'
  surface-container-lowest: '#0d0e11'
  surface-container-low: '#1b1b1f'
  surface-container: '#1f1f23'
  surface-container-high: '#292a2d'
  surface-container-highest: '#343538'
  on-surface: '#e3e2e6'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#e3e2e6'
  inverse-on-surface: '#2f3033'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#c0c1ff'
  on-secondary: '#1000a9'
  secondary-container: '#3131c0'
  on-secondary-container: '#b0b2ff'
  tertiary: '#ffb95f'
  on-tertiary: '#472a00'
  tertiary-container: '#e29100'
  on-tertiary-container: '#523200'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#e1e0ff'
  secondary-fixed-dim: '#c0c1ff'
  on-secondary-fixed: '#07006c'
  on-secondary-fixed-variant: '#2f2ebe'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#121316'
  on-background: '#e3e2e6'
  surface-variant: '#343538'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-code-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-code-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  badge-caps:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.06em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  margin: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
---

## Brand & Style

This design system channels the refined, high-density aesthetic of modern developer platforms like Supabase, Linear, and schema design suites. It blends **Dark Minimalism** with technical, precision-crafted **Developer Ergonomics**. 

The target audience includes students, developer-minded campus organizers, and technical administrators who value speed, dense information architecture, tactile micro-interactions, and keyboard-first workflows. The interface conveys structural integrity, low latency, and uncompromising focus. Background dot grids, hairline boundaries, and monospace metadata anchor the visual vocabulary, transforming student event planning, registration tables, and user role switching into an intuitive yet powerful experience.

## Colors

The palette relies on a deeply saturated, layered scale of dark neutrals that provide rich contrast without harsh eye strain.

- **Background Base (`#0C0D0E`)**: Canvas void layer, often textured with an understated radial dot pattern (`rgba(255, 255, 255, 0.05)` spaced at 16px).
- **Surface Elevation 1 (`#141518`)**: Card, table, and panel backgrounds.
- **Surface Elevation 2 (`#1E2024`)**: Hover states, popovers, segmented controls, and modal sheets.
- **Borders & Separators (`#282A30`)**: Hairline dividers defining data models, cell limits, and node edges.
- **Primary Emerald (`#10B981`)**: Denotes live status, open event capacity, confirm states, and operational health.
- **Secondary Indigo (`#6366F1`)**: Utilized for identity switching, foreign key indicators, active tabs, and primary action flows.
- **Tertiary Amber (`#F59E0B`)**: Reserved for limited seat warnings, draft events, and pending attendance badges.
- **Text & Contrast Tiers**: High-contrast white (`#F9FAFB`) for primary titles and identifiers, mid-tone muted slate (`#9CA3AF`) for labels and schema types, and deep slate (`#4B5563`) for placeholder content and inactive glyphs.

## Typography

The typographic system creates an interplay between clean neo-grotesque readability (`Inter`) and monospace data density (`JetBrains Mono`). 

Use `Inter` for layout-level hierarchy, dialogue heads, descriptive metadata, and core UI controls. Its optical kerning and tight negative tracking (`-0.01em` to `-0.02em`) at scale preserve the crisp modern software feel.

Use `JetBrains Mono` for entity keys (UUIDs, timestamps, slugs), status tags, parameter counts, schema representations (e.g., `timestamptz`, `int4`), and keyboard shortcuts. It reinforces the precision developer identity.

## Layout & Spacing

The layout philosophy follows a high-density utility pattern:
- **Canvas View**: Supports an interactive infinite canvas (using an orthogonal background dot grid spaced at `16px`) for visual schema/relation graphs, complemented by structured multi-pane views (left rail navigation, central data grid, contextual drawer).
- **Rhythm**: Built on a strict 4px base increment. Data tables and entity rows adopt compact padding (`space-xs` and `space-sm`) to maximize visible real estate.
- **Breakpoints & Adaptation**:
  - **Desktop (1024px+)**: Tri-pane layout (240px static sidebar, responsive fluid main canvas/table, and optional 380px inspector slide-out).
  - **Tablet (768px - 1023px)**: Sidebar collapses to an icon bar (56px); secondary panels become floating sheets.
  - **Mobile (< 768px)**: Stacks into unified vertical workflows with bottom-sheet modals for entity creation, filters, and switching user profiles.

## Elevation & Depth

Visual separation relies on **tonal stepping** and **low-contrast micro-outlines** rather than heavy blurred drop shadows.

- **Layer 0 (Canvas Void)**: `#0C0D0E`, matte, zero shadow.
- **Layer 1 (Card & Module Surfaces)**: `#141518` bounded by a 1px solid border of `#282A30`.
- **Layer 2 (Popovers, Flyouts, Menus)**: `#1E2024` with `0 8px 24px -4px rgba(0, 0, 0, 0.65)` and a subtle highlighted border (`#3F424D`).
- **Accent Glows**: Used selectively for keyboard focus states and connected node paths. Glow lines utilize `0 0 12px rgba(16, 185, 129, 0.25)` or `0 0 12px rgba(99, 102, 241, 0.25)`.
- **Backdrop Filters**: Translucent navbars and modal masks utilize `backdrop-filter: blur(8px)` with `rgba(12, 13, 14, 0.75)`.

## Shapes

The design uses a restrained, sharp-to-soft curvature profile (`roundedness: 1`).
- Inputs, buttons, segmented bars, and data rows maintain a crisp `0.25rem` (4px) radius.
- Cards, modal containers, and floating schema entities utilize `0.5rem` (8px).
- Badges and status pills strictly retain `0.25rem` (never full pills) to uphold the utilitarian, structural software posture.

## Components

### Buttons
- **Primary Action**: Solid emerald (`#10B981`) text in `#0C0D0E`, or solid indigo (`#6366F1`) with white text. Height: 32px (sm) / 36px (md). Font: Inter medium (13px/14px).
- **Secondary / Ghost**: `#1E2024` background with `#282A30` border. Text `#F9FAFB`. Hover shifts background to `#25282E`.
- **Key Caps / Shortcut Hints**: Embedded within buttons using `JetBrains Mono` on `#141518`, 1px border `#3F424D`, 2px padding, 10px font size (e.g., `⌘K`, `D then X`).

### Data Cards & Entity Containers
- Replicates database table blocks: A header row displaying icon, title, and three-dot context trigger, separated by a 1px horizontal rule (`#282A30`).
- Field rows feature key/property indicators (e.g., diamond icons, key icons) on the left and monospace column types (`uuid`, `timestamptz`, `int4`) on the right in muted gray (`#6B7280`).

### Chips & Badges
- Compact rectangular chips with 4px border-radius.
- Composed of a faint background (`rgba(primary, 0.1)`), contrasting text, and an optional 6px circular status dot.

### Inputs & Selectors
- Background: `#0C0D0E`; border: 1px `#282A30`. 
- Focus state: border turns `#10B981` or `#6366F1` with zero browser-native outline. Placeholder text in `#4B5563`.
- Input fields support embedded inline prefixes (e.g., entity icons, search glyphs, monospace slug prefixes).

### User Switcher Control
- Quick-toggle dropdown displaying the active role (`uuid`, avatar dot, label `student | admin | organizer`).
- Displays a pill badge showing active permissions, allowing instant identity impersonation for test-driving event registration flows.