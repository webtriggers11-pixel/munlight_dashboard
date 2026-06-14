---
name: Munlight Blue Admin
colors:
  surface: '#fbf8ff'
  surface-dim: '#dad9e3'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f4f2fd'
  surface-container: '#eeedf7'
  surface-container-high: '#e8e7f1'
  surface-container-highest: '#e3e1ec'
  on-surface: '#1a1b22'
  on-surface-variant: '#47464a'
  inverse-surface: '#2f3038'
  inverse-on-surface: '#f1effa'
  outline: '#78767b'
  outline-variant: '#c8c5ca'
  surface-tint: '#5f5e60'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1d'
  on-primary-container: '#858386'
  inverse-primary: '#c8c6c8'
  secondary: '#5f5e61'
  on-secondary: '#ffffff'
  secondary-container: '#e4e1e5'
  on-secondary-container: '#656467'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1f1a1a'
  on-tertiary-container: '#8a8282'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e1e4'
  primary-fixed-dim: '#c8c6c8'
  on-primary-fixed: '#1c1b1d'
  on-primary-fixed-variant: '#474649'
  secondary-fixed: '#e4e1e5'
  secondary-fixed-dim: '#c8c6c9'
  on-secondary-fixed: '#1b1b1e'
  on-secondary-fixed-variant: '#47464a'
  tertiary-fixed: '#ebe0df'
  tertiary-fixed-dim: '#cec4c4'
  on-tertiary-fixed: '#1f1a1a'
  on-tertiary-fixed-variant: '#4c4545'
  background: '#fbf8ff'
  on-background: '#1a1b22'
  surface-variant: '#e3e1ec'
typography:
  h1:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-base:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
  mono:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  container-padding: 2rem
  section-gap: 1.5rem
  element-gap: 0.75rem
  table-cell-py: 0.5rem
  sidebar-width: 240px
---

## Brand & Style

This design system is engineered for internal high-utility environments where clarity and speed are paramount. The aesthetic is rooted in **Modern Corporate Minimalism**, specifically following the Shadcn UI / Zinc aesthetic. It prioritizes functionality over flourish, utilizing a monochromatic foundation to allow data-heavy interfaces to remain legible and calm.

The target audience consists of internal staff and administrators who require a "heads-down" workspace. The UI evokes a sense of reliability, precision, and systematic order. Key visual markers include:
- **High-density information displays** without visual clutter.
- **Subtle tonal shifts** to define hierarchy rather than heavy shadows or vibrant colors.
- **Systematic clarity**, where every pixel serves a functional purpose in the user's workflow.

## Colors

The color palette is built on the **Zinc** scale, providing a neutral, sophisticated backdrop that minimizes eye strain during long work sessions.

- **Primary & Neutrals:** Uses a range from Zinc-50 (White/Off-white) to Zinc-950 (Deep Black). Surface colors are strictly neutral to maintain a professional, "tool-like" feel.
- **Semantic Accents:** Color is reserved strictly for state and status. Green indicates successful operations, Amber warns of potential issues, Red signals destructive actions or errors, and Blue handles informational callouts.
- **Dark Mode:** Both modes utilize the same semantic logic. In dark mode, surfaces move to Zinc-950 and Zinc-900, while text scales toward the lighter end of the Zinc spectrum to maintain WCAG AAA contrast levels for body text.

## Typography

**Inter** is the sole typeface for the interface, chosen for its exceptional legibility in dense data environments.

- **Scale:** The system uses a tight typographic scale. 14px is the standard body size for optimal information density, while 13px is used for secondary data and labels.
- **Weights:** Regular (400) for body text and Semibold (600) for headers. Medium (500) is reserved for buttons and navigation items to provide a subtle lift without the bulk of bold text.
- **Mono Fallback:** For tabular numbers, IDs, and code snippets, use a monospaced font (JetBrains Mono) to ensure vertical alignment and easy scanning of numerical data.

## Layout & Spacing

The layout follows a **Fixed-Fluid hybrid model** designed for large-format desktop screens.

- **Sidebar:** A collapsible 240px sidebar stays fixed to the left. It transitions to an icon-only rail (64px) or hides completely on smaller viewports.
- **Grid:** A standard 12-column grid is used for dashboard widgets. Gutters are kept tight at 16px to maintain high information density.
- **Density:** This system adopts a "Compact" density by default. Vertical padding in tables and lists is minimized to maximize the number of rows visible above the fold.
- **Breakpoints:**
  - Desktop (1280px+): Full sidebar, multi-column widgets.
  - Tablet (768px - 1279px): Collapsed sidebar, 2-column or 1-column widgets.
  - Mobile (<767px): Hidden sidebar (drawer), single-column stacked layout.

## Elevation & Depth

This design system eschews heavy shadows in favor of **Tonal Layering and Low-Contrast Outlines**.

- **Surfaces:** The background uses a slightly off-white (Zinc-50) or deep-black (Zinc-950) base. Cards and containers use the pure white or Zinc-900 surface.
- **Borders:** All containers, inputs, and cards are defined by 1px borders (Zinc-200 in light, Zinc-800 in dark). This "boxed" approach creates clear separation without the visual weight of shadows.
- **Shadows:** A single "soft" shadow level is used exclusively for floating elements like dropdown menus, popovers, and modals.
- **Active State:** Selection and focus are indicated by a 2px offset ring or a high-contrast border change, never by an increase in elevation height.

## Shapes

The shape language is **Soft and Geometric**. 

- **Radius:** A consistent `0.25rem` (4px) radius is applied to buttons, inputs, and cards. This "Soft" setting keeps the UI looking modern and approachable while maintaining the professional structure of a grid-based system.
- **Badges:** Status chips and badges may use a "Pill" (full) radius to distinguish them from interactive buttons.
- **Inputs:** Text fields and selection boxes must maintain the standard 4px radius to ensure a cohesive form language.

## Components

- **Data Tables:** The core of the system. Use sticky headers, zebra striping (very subtle), and hover states. Font size is locked to `body-sm`. Cells should have horizontal padding but minimal vertical padding.
- **Buttons:**
  - *Primary:* Solid Zinc-900 (Light) or Zinc-50 (Dark).
  - *Secondary:* Outlined with Zinc-200.
  - *Ghost:* No border, background appears only on hover.
- **Forms:** Labels are placed above inputs using `label-sm`. Error states use the semantic Red for both the border and the helper text.
- **Status Chips:** Small, low-saturation backgrounds with high-saturation text (e.g., light green background with dark green text) for readability.
- **Charts:** Line and Area charts should use a stroke width of 2px. Donut charts should have a "thin" ring. Use the semantic color palette for data points, defaulting to Zinc-500 for neutral data.
- **Sidebar:** Navigation items use a 12px horizontal padding. The active state is indicated by a subtle background fill (Zinc-100/800) and a Medium font weight.