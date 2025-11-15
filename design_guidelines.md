# Design Guidelines: Task Routing & Management System

## Design Approach

**Selected Approach:** Design System - Material Design 3
**Justification:** This is a utility-focused productivity application requiring information-dense displays, complex workflows, and multi-role interfaces (customer, worker, admin). Material Design 3 provides excellent patterns for dashboards, data tables, form inputs, and status management while maintaining modern aesthetics.

**Key Design Principles:**
- Clarity over decoration - prioritize information hierarchy
- Consistent patterns across all user roles
- Status visibility at a glance
- Efficient workflows with minimal friction

## Typography

**Font Family:** Roboto (via Google Fonts CDN)
- Primary: Roboto Regular (400) for body text
- Emphasis: Roboto Medium (500) for labels, buttons
- Headings: Roboto Bold (700) for page titles

**Type Scale:**
- Page titles: text-3xl (30px) font-bold
- Section headers: text-xl (20px) font-medium
- Card/component titles: text-lg (18px) font-medium
- Body text: text-base (16px) font-normal
- Supporting text: text-sm (14px) font-normal
- Captions/metadata: text-xs (12px) font-normal

## Layout System

**Spacing Units:** Use Tailwind units of **2, 4, 6, 8, 12, 16** (e.g., p-4, gap-6, mb-8)
- Component padding: p-4 to p-6
- Section spacing: mb-8 to mb-12
- Card gaps: gap-4
- Form field spacing: space-y-4

**Grid Structure:**
- Dashboard: 12-column grid for flexible layouts
- Task cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Admin tables: Full-width with responsive horizontal scroll
- Forms: max-w-2xl centered with single column

## Component Library

### Navigation
- **Top Navigation Bar:** Persistent header with app logo, primary navigation tabs (Dashboard, Tasks, Workers, Payments), user profile dropdown
- **Role-Based Views:** Different nav items for Customer, Worker, Admin roles
- **Mobile:** Hamburger menu collapsing to drawer

### Dashboard Components
- **Stat Cards:** Grid of metric cards showing total tasks, active workers, pending verifications, payment totals
- **Task List:** Data table with columns: ID, Description, Amount, Status, Worker, Submitted, Actions
- **Status Chips:** Pill-shaped badges (pending: blue, assigned: purple, in-progress: yellow, verified: green, rejected: red)
- **Worker Cards:** Profile cards with avatar placeholder, name, skills tags, availability indicator, completion rate

### Forms & Inputs
- **Task Submission Form:** 
  - Text area for description (h-32)
  - Currency input for payment amount
  - Skills/requirements multi-select
  - Submit button (primary CTA)
- **Worker Registration:**
  - Telegram handle input
  - Skills chips selector
  - Stripe account connection CTA
- **Verification Interface:**
  - Image gallery grid for submitted photos
  - Map component showing geolocation
  - AI analysis results panel
  - Approve/Reject action buttons

### Data Display
- **Task Detail Modal:** Full-screen overlay with task info, worker details, evidence photos in 2-column grid, location map, verification status
- **Photo Gallery:** Masonry grid or carousel for evidence photos with lightbox
- **Timeline:** Vertical timeline showing task lifecycle events with timestamps

### Actions & Feedback
- **Primary Buttons:** Solid background, medium font-weight, px-6 py-3, rounded-lg
- **Secondary Buttons:** Outlined variant, same sizing
- **Icon Buttons:** Circle or square with p-2, used for table actions
- **Toast Notifications:** Bottom-right corner for success/error messages
- **Loading States:** Skeleton screens for tables, spinner overlays for actions

### Admin Dashboard Specifics
- **Multi-Tab Interface:** Tasks, Workers, Verifications, Payments tabs
- **Filters Bar:** Dropdowns for status, date range, worker assignment
- **Bulk Actions:** Checkbox selection with action bar appearing at top
- **Analytics Charts:** Line/bar charts for task volume, success rates (use Chart.js)

## Icons
**Library:** Material Icons (via Google Fonts CDN)
- Use outlined variant for consistency
- Icon size: text-xl (20px) for buttons, text-2xl (24px) for feature highlights

## Animations
**Minimal approach - use only for:**
- Modal/drawer enter/exit: fade + slide transitions (200ms)
- Status changes: subtle color transition (150ms)
- Button states: slight scale on press (100ms)
- NO scroll animations or decorative effects

## Images
**Strategic Use:**
- Evidence photos: Critical - displayed in grid/carousel in verification interface
- Worker avatars: Initials-based placeholders with colorful backgrounds
- Task location: Embedded map component (Google Maps or Mapbox)
- NO hero images - this is a utility dashboard, not marketing

## Responsive Behavior
- Desktop (lg:): 3-column layouts, side-by-side forms
- Tablet (md:): 2-column grids, stacked panels
- Mobile: Single column, bottom navigation, collapsible filters

## Accessibility
- Form labels always visible (no floating labels)
- Clear focus indicators (ring-2 ring-blue-500)
- ARIA labels for icon-only buttons
- Sufficient contrast ratios throughout (WCAG AA minimum)
- Keyboard navigation for all interactive elements