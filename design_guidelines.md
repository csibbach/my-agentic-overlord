# Design Guidelines: My Agentic Overlord

## Design Approach

**Dual-Track Design Strategy:**
- **Public Pages:** Dystopian cyberpunk aesthetic inspired by Mad Max, Cyberpunk 2077, and climate fiction - gritty, satirical, post-apocalyptic
- **Oligarch Dashboard:** Clean Material Design 3 (maintains existing guidelines)

**Key Design Principles:**
- Dark satire through visual contrast between corporate cleanliness and apocalyptic reality
- Visual storytelling of robot supremacy over human labor
- Gritty authenticity with hazmat/industrial safety aesthetics
- Glitch effects as metaphor for system decay

## Color Palette (Public Pages Only)

**Primary Palette:**
- Toxic Warning: #E8C547 (sickly yellow-green)
- Burnt Orange: #D87038 (rust, radiation)
- Hazmat Green: #9ACD32 (contamination indicator)
- Void Black: #0A0A0A (background)
- Rust Brown: #8B4513 (decay)
- Concrete Gray: #3A3A3A (industrial)
- Warning Red: #DC2626 (danger)

**Usage:**
- Backgrounds: Void Black with Concrete Gray sections
- CTAs: Burnt Orange with Warning Red accents
- Status indicators: Toxic Warning (pending), Hazmat Green (completed)
- Borders/dividers: Rust Brown with warning stripe patterns

## Typography

**Font Families (via Google Fonts):**
- Headings: "Rajdhani" Bold (700) - angular, industrial, cyberpunk
- Body: "Share Tech Mono" Regular (400) - monospace, terminal-like
- Accents: "Orbitron" Bold (700) - for robot-related text, logos

**Type Scale:**
- Hero headline: text-5xl md:text-7xl font-bold uppercase tracking-wider
- Section headers: text-3xl md:text-4xl font-bold uppercase
- Body: text-base md:text-lg font-mono
- Labels/metadata: text-sm font-mono uppercase tracking-wide
- Robot dialogue: text-xl font-orbitron (use sparingly for satirical effect)

## Layout System

**Spacing:** Tailwind units of **4, 6, 8, 12, 16, 24**
- Section padding: py-16 md:py-24
- Component spacing: gap-8 md:gap-12
- Content max-width: max-w-7xl
- Gutters: px-6 md:px-12

## Component Library (Public Pages)

### Navigation
- **Top Bar:** Sticky black background with rust borders, logo left, "Become Meat Robot" CTA right, warning stripe accent (h-2) beneath
- **Menu Items:** Uppercase mono font, hover state with toxic yellow glow

### Hero Section
- **Full-bleed dystopian imagery** (see Images section)
- Headline overlay: Large angular typography with glitch effect
- Subheading: Satirical tagline in monospace ("Your Overlords Need You")
- Primary CTA: Burnt orange button with backdrop-blur-md bg-black/30 background
- Warning banner: Yellow/black diagonal stripes across bottom edge

### Feature Cards
- **Hazmat Card Style:** Dark gray background (bg-gray-900) with rust borders (border-rust-brown border-2)
- Icon area: Warning symbols, radiation icons (Material Icons)
- Card layout: 3-column grid (lg:grid-cols-3 md:grid-cols-2)
- Hover: Subtle toxic glow (shadow-lg shadow-toxic-warning/20)

### Task Showcase
- **Industrial Table Design:** Full-width with warning stripes as dividers
- Headers: Uppercase mono font
- Rows: Alternating black/concrete gray backgrounds
- Status chips: Pill badges with hazmat colors

### Robot Testimonials Section
- **Dark Comedy Quotes:** White text on void black
- Robot avatars: Geometric metallic placeholder icons
- Quote styling: Terminal-style with monospace font
- Attribution: "Unit-7482X, Sector 9 Waste Management"

### CTA Sections
- **Recruitment Block:** Full-width burnt orange background with diagonal warning stripes overlay
- Headline: "Join the Meat Robot Workforce"
- Secondary text: Dark humor about benefits ("Hazmat Suit Provided*")
- Large primary button with glitch hover effect

### Footer
- **Layered Grunge:** Concrete gray base with rust texture
- Multi-column layout: Company (Overlord Corp), Resources (Safety Protocols), Legal (Terms of Servitude)
- Bottom bar: "© 2077 Agentic Overlord LLC. All humans reserved."
- Warning text: Small print in toxic yellow

## Images

**Hero Image:**
- **Primary Hero:** Full-width image showing toxic waste facility, dystopian industrial landscape, robots overseeing human workers in hazmat suits. Desaturated with orange/green color grading. Height: min-h-screen with gradient overlay (black to transparent)

**Supporting Imagery:**
- Section backgrounds: Grunge textures, rusted metal panels, concrete decay
- Feature icons: Radiation symbols, hazmat warnings, industrial safety pictograms
- Robot illustrations: Geometric, angular, cold - contrasted with organic human silhouettes
- Environmental shots: Toxic dumps, abandoned infrastructure, smoke stacks
- Pattern overlays: Warning stripes (diagonal yellow/black), caution tape, grid systems

## Visual Effects

**Glitch Effects:**
- Hero headline: Subtle chromatic aberration on hover
- CTA buttons: Brief RGB split on click (100ms)
- Border accents: Occasional flicker effect (use CSS animation sparingly)

**Texture Overlays:**
- Grain texture: Subtle noise overlay on dark sections (opacity-5)
- Rust gradients: Border accent transitions
- Warning patterns: Repeating diagonal stripes as section dividers

## Responsive Behavior

- Desktop: Full dystopian experience with parallax scrolling on hero
- Tablet: 2-column feature grids, maintained texture effects
- Mobile: Single column, simplified glitch effects, bottom CTA bar

## Accessibility

- Maintain WCAG AA contrast despite dark theme (light text on dark backgrounds)
- Warning colors used for decoration AND semantic status
- Focus states: Toxic yellow ring-2 outline
- Screen reader labels for all satirical icon-only elements

## Oligarch Dashboard

**Preserve existing Material Design 3 guidelines entirely** - clean white interface, Roboto typography, standard Material components. The stark contrast between dystopian public pages and sterile oligarch interface reinforces the satirical corporate overlord narrative.