# Design System

> **This file starts with Centercode standards and evolves as your project's design matures.**
>
> Update colors, components, and patterns as your design system solidifies.

## Theme

- **Dark theme only** - no theme switching
- All color values must reference semantic tokens in `tailwind.config.ts`
- NEVER use INLINE hex colors (`#...`) or arbitrary values (`[#...]`)
- NEVER use !important - no exceptions
- ONLY use utility classes when obvious semantic are not available

## Component Foundation

- **Base library:** shadcn/ui components built on Radix primitives
- **Custom components:** Compositions of shadcn/Radix base components only
- **Icons:** lucide-react exclusively
- **No new UI libraries** without discussion and approval

## Component Reuse (Critical)

**ALWAYS reuse existing components. NEVER create duplicates.**

Before creating ANY new component:

1. **Search existing components** in `src/components/ui/` - can you use or extend one?
2. **Check shadcn registry** - does shadcn have this component already?
3. **Compose from existing** - can you combine existing components?

### Common Mistakes to Avoid

❌ **DON'T create custom styled divs** when a component exists:

```tsx
// Wrong - duplicate styling
<div className="rounded-lg border bg-card p-6">...</div>

// Right - use Card component
<Card><CardContent>...</CardContent></Card>
```

❌ **DON'T use utility classes** when semantic tokens exist:

```tsx
// Wrong - utility color
<div className="bg-gray-950">...</div>

// Right - semantic token
<div className="bg-card">...</div>
```

❌ **DON'T create variant components** that should be props:

```tsx
// Wrong - separate component
export function PrimaryButton() { ... }
export function SecondaryButton() { ... }

// Right - variant prop
<Button variant="primary">...</Button>
<Button variant="secondary">...</Button>
```

### When to Create New Components

Only create a new component when:

- ✅ It's a **new pattern** not covered by existing components
- ✅ It will be **reused 3+ times** across the app
- ✅ It **composes existing components** (doesn't reinvent them)

If creating a one-off layout, just use existing components inline.

## Core Components

Start with default shadcn styling for:

- **Button** - Primary actions, secondary actions, destructive actions
- **Card** - Content containers, data display
- **Dialog** - Modals, confirmations
- **Input** - Text input, number input
- **Select** - Dropdowns, pickers
- **Textarea** - Multi-line text input
- **Separator** - Visual dividers
- **Table** - Data tables
- **Form** - Form layouts and validation

_(As your design evolves, document customizations here)_

## Color Palette

### Card System

**Terminology:** Cards and panels are synonymous - use `<Card>` component for all elevated containers.

**All cards use gray-950 backgrounds:**

- **Card color:** `bg-card` (gray-950: #1F232F)
- **Card text:** `text-card-foreground` (default foreground)
- **Page background:** `bg-background` (black: #12151D)

This creates clear visual hierarchy with cards elevated from the page background.

### Semantic Tokens

All semantic tokens are defined directly in `tailwind.config.ts` as hex values:

**Core tokens:**

```
background          - Page background (#12151D - black)
foreground          - Primary text (#F7F8F9 - gray-50)
card                - Card backgrounds (#1F232F - gray-950)
card-foreground     - Text on cards (#F7F8F9 - gray-50)
popover             - Popover backgrounds (#1F232F - gray-950)
popover-foreground  - Text in popovers (#F7F8F9 - gray-50)
primary             - Primary brand color (#F4D768 - yellow-200)
primary-foreground  - Text on primary (#1F232F - gray-950)
secondary           - Secondary actions (#F4D768 - yellow-200)
secondary-foreground - Text on secondary (#1F232F - gray-950)
muted               - Muted backgrounds (#343A4D - gray-900)
muted-foreground    - Secondary/de-emphasized text (#AAB1C1 - gray-500)
accent              - Accent highlights (#1F232F - gray-950)
accent-foreground   - Text on accents (#F7F8F9 - gray-50)
destructive         - Error/destructive states (#CD4747 - red-500)
destructive-foreground - Text on destructive (#F7F8F9 - gray-50)
border              - Borders and dividers (#4C5163 - gray-800)
input               - Input field borders (#4C5163 - gray-800)
ring                - Focus rings (#F4D768 - yellow-200)
```

**Extended tokens:**

```
sidebar             - Sidebar backgrounds (#1F232F - gray-950)
navbar              - Navbar backgrounds (#12151D - black)
hover               - Hover states (#343A4D - gray-900)
selected            - Selected states (#4C5163 - gray-800)
elevated            - Elevated surfaces (#4C5163 - gray-800)
elevated-foreground - Text on elevated (#F7F8F9 - gray-50)
placeholder         - Placeholder text (#888F9F)
link                - Link color (#4867A1 - blue-400)
link-hover          - Link hover (#6785B9 - blue-300)
link-visited        - Visited links (#324F8A - blue-500)
success             - Success states (#0E907A - green-500)
success-foreground  - Text on success (#F7F8F9 - gray-50)
warning             - Warning states (#F59E0B - yellow-500)
warning-foreground  - Text on warning (#1F232F - gray-950)
info                - Info states (#324F8A - blue-500)
info-foreground     - Text on info (#F7F8F9 - gray-50)
disabled            - Disabled elements (#676D7E)
disabled-foreground - Text on disabled (#AAB1C1 - gray-500)
divider             - Dividing lines (#343A4D - gray-900)
```

### Project Colors

_(Document your project-specific color usage here)_

Example:

```
Budget status colors:
- Under budget: green-600
- Near limit (>80%): yellow-600
- Over budget: red-600
```

## Spacing

Use Tailwind spacing scale exclusively:

- **Page padding:** `px-12 md:px-16` (horizontal), `py-12` (vertical)
- **Section spacing:** `space-y-8` for major sections
- **Component spacing:** `space-y-4` for component groups
- **Inline spacing:** `gap-2`, `gap-4` for flex/grid layouts

_(Adjust these defaults as your design system matures)_

## Border Radius

- **Standard components:** `rounded-md`
- **Large containers:** `rounded-lg` or `rounded-xl`
- **Pills/badges:** `rounded-full`

Use only Tailwind default radius values.

## Shadows

Custom shadows optimized for dark theme using background color (rgba(18, 21, 29)):

- `shadow-sm` - Cards, buttons, subtle elevation
- `shadow` - Default elevation, most components
- `shadow-md` - Dropdowns, popovers, menus
- `shadow-lg` - Modals, dialogs, overlays
- `shadow-xl` - Toasts, notifications, maximum elevation

## Borders

- **Default:** `border` with `border-<color>` for semantic colors
- **Gradient borders:** Add `gradient` prop to Card or Separator components

## Scrollbars

Custom scrollbar styling is applied globally to match the dark theme:

- **Width/Height:** 12px (both vertical and horizontal)
- **Track:** `#1F232F` (card background) with 4px border radius
- **Thumb:** `#4C5163` (border color) with 4px border radius and 2px inset padding
- **Thumb hover:** `#676D7E` (disabled color - slightly lighter)
- **Thumb active:** `#888F9F` (placeholder color - lightest state)

**Browser support:**

- **WebKit/Blink** (Chrome, Edge, Safari): Full custom styling via `::-webkit-scrollbar` pseudo-elements
- **Firefox:** Thin scrollbars with matching colors via `scrollbar-width` and `scrollbar-color`

Scrollbars automatically inherit these styles - no additional classes needed.

## Gradient Borders

**Signature gradient:** Pink (#D456AA) → Teal (#36A6B7) → Purple (#553172) at 135deg

**Usage:**

```tsx
<Card gradient>...</Card>           // Gradient card border
<Separator gradient />              // Gradient horizontal rule
```

**When to use:**

- Hero sections and featured content
- Primary CTAs and premium features
- Use sparingly - defaults to standard `border-border` for most UI

## Typography

### Font Families

Configured in `tailwind.config.ts`:

- **Sans:** Primary UI font
- **Mono:** Code and tabular data

### Type Scale

Use Tailwind text utilities:

```
text-xs    - Captions, labels
text-sm    - Secondary text
text-base  - Body text (default)
text-lg    - Subheadings
text-xl    - Section headers
text-2xl   - Page headers
text-3xl+  - Hero text
```

### Font Weights

```
font-normal   - Body text (400)
font-medium   - Emphasis (500)
font-semibold - Headings (600)
font-bold     - Strong emphasis (700)
```

## Loading States

- **Server-rendered pages:** Await all data before render (no skeleton screens)
- **User actions:** Show loading spinner on buttons during form submission
- **Background operations:** Use toast notifications for completion
- **Code splitting:** Allowed for route-based lazy loading

## Responsive Design

### Breakpoints

Follow Tailwind defaults:

```
sm:  640px   - Small tablets
md:  768px   - Tablets
lg:  1024px  - Laptops
xl:  1280px  - Desktops
2xl: 1536px  - Large desktops
```

### Responsive Rules

- **Mobile-first approach** - design for mobile, enhance for desktop
- **Test at:** `sm` and `md` minimum
- **No horizontal scroll** on any viewport
- **Sidebars:** Collapse to hamburger menu below `md`
- **Tables:** Horizontal scroll on small screens (wrap in `overflow-x-auto`)
- **Forms:** Stack vertically on mobile, side-by-side on `md+`

## Accessibility

- **Keyboard navigation:** All interactive elements must be keyboard accessible
- **Focus indicators:** Visible focus rings on all interactive elements
- **ARIA labels:** Required on custom components and icon buttons
- **Color contrast:** Maintain WCAG AA standards minimum
- **Screen readers:** Test with VoiceOver (macOS) or NVDA (Windows)

## Component Patterns

### Forms

```tsx
<form className="space-y-4">
  <div className="space-y-2">
    <Label>Field Label</Label>
    <Input type="text" />
  </div>
</form>
```

### Data Tables

```tsx
<div className="rounded-md border">
  <Table>
    <TableHeader>...</TableHeader>
    <TableBody>...</TableBody>
  </Table>
</div>
```

### Cards

```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>...</CardContent>
</Card>
```

_(Expand this section with project-specific patterns as they emerge)_

---

**Update this file as your design system evolves. Document new patterns and deviations from defaults.**
