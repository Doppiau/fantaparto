---
name: FantaParto Design Identity
colors:
  surface: '#fbf9f5'
  surface-dim: '#dbdad6'
  surface-bright: '#fbf9f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f5f3ef'
  surface-container: '#efeeea'
  surface-container-high: '#eae8e4'
  surface-container-highest: '#e4e2de'
  on-surface: '#1b1c1a'
  on-surface-variant: '#514345'
  inverse-surface: '#30312e'
  inverse-on-surface: '#f2f0ed'
  outline: '#847375'
  outline-variant: '#d6c2c3'
  surface-tint: '#874e58'
  primary: '#874e58'
  on-primary: '#ffffff'
  primary-container: '#f4acb7'
  on-primary-container: '#733d47'
  inverse-primary: '#fcb3be'
  secondary: '#40627b'
  on-secondary: '#ffffff'
  secondary-container: '#bee1ff'
  on-secondary-container: '#42647e'
  tertiary: '#30628a'
  on-tertiary: '#ffffff'
  tertiary-container: '#94c4f0'
  on-tertiary-container: '#1a5178'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9de'
  primary-fixed-dim: '#fcb3be'
  on-primary-fixed: '#360c17'
  on-primary-fixed-variant: '#6b3741'
  secondary-fixed: '#cae6ff'
  secondary-fixed-dim: '#a8cbe8'
  on-secondary-fixed: '#001e2f'
  on-secondary-fixed-variant: '#274a63'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#9bcbf8'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#104a70'
  background: '#fbf9f5'
  on-background: '#1b1c1a'
  surface-variant: '#e4e2de'
typography:
  headline-xl:
    fontFamily: Quicksand
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Quicksand
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Quicksand
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  headline-md:
    fontFamily: Quicksand
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Be Vietnam Pro
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Be Vietnam Pro
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Be Vietnam Pro
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  caption:
    fontFamily: Be Vietnam Pro
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 20px
  margin-mobile: 20px
  margin-desktop: 120px
---

## Brand & Style

The visual identity of the design system is centered on the concept of "The Joyful Wait." It targets families and expectant parents looking for a celebratory, low-stress way to track and predict pregnancy milestones. 

The design style is **Modern-Organic**, blending the cleanliness of modern SaaS interfaces with the warmth of a digital scrapbook. It utilizes a **Widget-First** approach, where information is containerized in soft, floating modules that mimic the physical comfort of a nursery. The emotional response should be one of calm optimism, reliability, and playful anticipation. 

Key principles:
- **Softness over Precision:** Avoid sharp edges and harsh contrasts.
- **Airy Composition:** High margins and generous whitespace to reduce cognitive load for busy parents.
- **Celebratory Details:** Subtle motion and color-coded "milestone" accents that make data entry feel like a celebration.

## Colors

The palette is inspired by early childhood and domestic warmth, utilizing a high-key, low-saturation scheme that remains legible and professional.

- **Primary (Rosa Confetto):** Used for primary actions, active states, and maternal milestones.
- **Secondary (Azzurro Cielo):** Used for informational widgets, secondary buttons, and growth tracking.
- **Tertiary (Menta Fresca):** Used for health-related metrics, success states, and dietary tips.
- **Background (Crema Calda):** A #FFFDF9 base that provides a softer, more "paper-like" feel than pure white, reducing eye strain.
- **Neutral (Fumo):** A deep, warm grey (#4A3F3F) for text to ensure high contrast without the clinical harshness of pure black.

## Typography

Typography in this design system balances personality with utility. 

**Quicksand** is used for all headings. Its rounded terminals and open counters evoke a friendly, approachable voice. It should be used with tighter letter-spacing for large headlines to maintain a cohesive, "bubbly" look.

**Be Vietnam Pro** serves as the functional workhorse. It is a contemporary sans-serif with a warm character that remains highly legible at small sizes. Use the Medium (500) weight for interactive labels and the Regular (400) weight for long-form content or instructions.

In the Italian language, certain words are longer than English equivalents; therefore, line heights are set slightly wider to accommodate descenders and maintain a breathable vertical rhythm.

## Layout & Spacing

The design system employs a **Modular Widget Grid**. The layout philosophy treats the screen as a canvas for interactive tiles rather than a traditional linear list.

- **Grid Model:** A 12-column fluid grid for desktop and a single-column stack for mobile.
- **The 8px Rhythm:** All padding and margins must be multiples of 8px to ensure visual consistency.
- **Modular Widgets:** Content should be grouped into cards with a standard inner padding of `md` (24px).
- **Responsive Behavior:** On mobile, margins reduce to 20px, and horizontal gutters are strictly maintained at 20px to ensure the UI feels "tucked in" and safe. 
- **Airy Containers:** Use the `xl` (64px) spacing for top-level section separations to emphasize the "Micro-SaaS" simplicity and focus.

## Elevation & Depth

To achieve the "floating" aesthetic, the design system avoids harsh borders in favor of **Ambient Tonal Shadows**.

- **Shadow Character:** Shadows use the primary or secondary color as a base tint rather than pure black (e.g., a soft pink shadow under a pink button). They are extremely diffused: `0px 12px 32px rgba(x, y, z, 0.08)`.
- **Tonal Layers:**
  - **Level 0 (Background):** The warm cream (#FFFDF9) surface.
  - **Level 1 (Widgets):** White (#FFFFFF) surfaces with soft floating shadows.
  - **Level 2 (Active/Modals):** High-blur backdrop filters (Glassmorphism) used for overlays to maintain the "light as air" feeling.
- **Glassmorphism:** Use a `blur(12px)` and `10%` opacity white fill for navigation bars or overlay cards to keep the background colors visible, creating a sense of depth and continuity.

## Shapes

The shape language is defined by **Extreme Radii**. This design system uses pill-shaped components and highly rounded containers to reinforce the "soft and safe" brand narrative.

- **Main Containers:** Use `rounded-xl` (48px) for primary app widgets and cards.
- **Interactive Elements:** Buttons and input fields should utilize `rounded-full` (Pill-shaped) aesthetics.
- **Iconography:** Icons must be enclosed in rounded-square or circular containers with soft background tints. Avoid sharp corners in any custom illustrations or SVG assets.

## Components

### Buttons & Interaction
- **Primary Button:** Large, pill-shaped, using the Primary Pink. Text is white and bold. It uses a floating shadow that expands slightly on hover.
- **Secondary Button:** Ghost-style with a thick 2px border in Azzurro Cielo or a soft tinted background fill.

### Widgets (The Core)
- **Info Widgets:** White background, 48px corner radius, containing a header in Quicksand and a soft-colored icon in the top right.
- **Progress Trackers:** Custom-styled progress bars using thick, rounded tracks (12px height) with a pastel gradient fill.

### Form Inputs
- **Text Fields:** Pill-shaped with a soft cream-to-white gradient and a subtle 1px border that glows in the secondary color when focused.
- **Floating Labels:** Labels should sit above the field in `label-md` style, using the warm neutral text color.

### Feedback & Milestones
- **Success Chips:** Small, highly rounded pills in Menta Fresca with an emoji and brief text (e.g., "Ottimo!").
- **Celebration Modals:** Centered overlays with a heavy backdrop blur and a large "congratulations" icon that overflows the top edge of the card.

### Lists
- **The "Nursery" List:** Instead of dividers, list items are separated by `sm` (12px) gaps and individual cards, creating a modular feel rather than a continuous table.

---

## 2. Product Flows & UX Specs

### 2.1 Canale Creatore (Genitori)

#### Moderazione Avanzata e Reset del Voto

I genitori hanno accesso all'elenco completo dei singoli partecipanti. In caso di errore di inserimento, refusi nel nome o voti palesemente falsi/spam, i genitori possono eliminare il voto specifico con uno swipe (da App) o un click sul pulsante **Elimina** (da Web).

##### Logica di Sblocco per il Nuovo Voto — Deep Dive Tecnico

L'eliminazione del voto avvia una **transazione atomica** sul database Supabase che esegue tre azioni simultanee:

1. **Rimozione del voto e ricalcolo statistiche** — rimuove il record del voto e ricalcola istantaneamente le statistiche dell'Hype Space.
2. **Cancellazione del deviceFingerprint** — cancella l'impronta digitale del dispositivo associata a quel voto nella tabella di blocco.
3. **Invalidazione del token email** — se l'utente aveva registrato la propria email per la classifica, invalida il token precedente.

Grazie a questa operazione, il sistema "dimentica" che quell'invitato ha già partecipato. Quando l'ospite tornerà sul link dell'evento (`fantaparto.com/vota/[codice]`), non vedrà più la schermata di conferma con il badge, ma troverà nuovamente il form di voto vuoto e attivo, permettendogli di votare ancora una seconda volta senza alcun blocco o attrito.