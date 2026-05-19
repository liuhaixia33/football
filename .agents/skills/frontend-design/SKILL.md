---
name: frontend-design
description: |
  Professional frontend design skill for creating stunning, brand-consistent web pages and mini-program UIs.
  Use when the user asks to: (1) design or build a landing page, marketing page, product page, or SaaS dashboard,
  (2) improve the visual quality of existing frontend code, (3) create UI components with strong design aesthetics,
  (4) avoid generic "AI-looking" templates and produce unique, polished interfaces,
  (5) work with brand colors, typography, spacing, and layout systems.
  Covers modern design principles for React/Vue/mini-programs, mobile-first responsive design,
  visual hierarchy, micro-interactions, and accessibility best practices.
---

# Frontend Design Skill

## Core Design Principles

### Anti-Template Rule
Never produce generic "AI-style" layouts (centered hero with 3 feature cards and a CTA button).
Instead:
- Use asymmetric grids, overlapping elements, or split layouts
- Vary section heights and densities
- Add unexpected visual moments (large typography, image masks, diagonal cuts)
- Reference real high-quality sites (Stripe, Linear, Vercel, Apple, Notion) for inspiration

### Visual Hierarchy Pyramid
1. **Primary focal point**: One dominant element per viewport (large headline, hero image, or key metric)
2. **Secondary support**: 2-3 supporting elements (subhead, description, primary CTA)
3. **Tertiary details**: Everything else (nav, secondary links, metadata)
4. **Whitespace as structure**: Use negative space to separate hierarchy levels, not borders

### Typography System

| Role | Size (Mobile) | Size (Desktop) | Weight | Line Height | Letter Spacing |
|------|---------------|----------------|--------|-------------|----------------|
| Display | 40px | 72px | 700 | 1.0 | -0.02em |
| H1 | 32px | 48px | 700 | 1.1 | -0.02em |
| H2 | 24px | 32px | 600 | 1.2 | -0.01em |
| H3 | 20px | 24px | 600 | 1.3 | 0 |
| Body Large | 18px | 20px | 400 | 1.6 | 0 |
| Body | 16px | 16px | 400 | 1.6 | 0 |
| Caption | 14px | 14px | 400 | 1.5 | 0.01em |
| Label | 12px | 12px | 500 | 1.4 | 0.05em |

**Font stacks**:
- Chinese: `"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif`
- English modern: `"Inter", -apple-system, BlinkMacSystemFont, sans-serif`
- English editorial: `"Georgia", "Times New Roman", serif`

### Color System

Always define colors as a system, not one-offs:

```
Primary:     brand main color (buttons, links, active states)
Primary-600: darker variant (hover states)
Primary-50:  lightest variant (backgrounds, badges)

Text:        #111827 or #1f2937 (main text)
Text-2:      #4b5563 (secondary text)
Text-3:      #9ca3af (disabled, placeholders)

Surface:     #ffffff (cards, modals)
Surface-2:   #f9fafb (page background, subtle sections)
Surface-3:   #f3f4f6 (dividers, borders)

Success:     #10b981
Warning:     #f59e0b
Error:       #ef4444
Info:        #3b82f6
```

### Spacing Scale

Use an 8px base grid. Common values: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px.

**Section spacing**:
- Between major sections: 80-128px (desktop), 48-64px (mobile)
- Inside cards: 24px padding
- Between related elements: 16px
- Between tightly related elements: 8px

## Layout Patterns

### Hero Section Variants
1. **Split asymmetric**: 60/40 or 55/45 split with text left, image right
2. **Full-bleed image**: Large background image with dark overlay + centered text
3. **Typography-forward**: Massive headline, minimal other elements
4. **Card floating**: Hero content inside a floating card over a background

### Content Section Variants
1. **Staggered grid**: 2-column with offset vertical positions
2. **Bento grid**: Asymmetric grid with varying card sizes
3. **Horizontal scroll**: For galleries, testimonials, or feature showcases
4. **Full-width breakout**: Content bleeds to edge with contained text inside

### Card Design Rules
- Use subtle shadows (`0 1px 3px rgba(0,0,0,0.1)`) or borders, never both
- Round corners: 12px for cards, 8px for buttons, 9999px for pills
- Add internal padding: 24px
- Hover: lift shadow (`translateY(-2px)`, deeper shadow) or scale image inside

## Component Guidelines

### Buttons
- Primary: filled brand color, white text, 8px 24px padding, 8px radius
- Secondary: transparent with brand border, brand text
- Ghost: no border, brand text only (for less important actions)
- Hover: darken 10%, add subtle scale(1.02)

### Forms
- Input height: 48px (touch-friendly)
- Border: 1px solid Surface-3, focus: 2px solid Primary
- Label: 14px, 500 weight, 8px below label
- Error: red border + 12px red text below input

### Navigation
- Fixed top, blur backdrop (`backdrop-filter: blur(12px)`), semi-transparent white
- Height: 64px desktop, 56px mobile
- Logo left, links center/right, CTA button far right
- Mobile: hamburger with full-screen overlay menu

## Animation & Micro-interactions

### Entrance Animations
- Fade up: `opacity 0→1`, `translateY(20px→0)`, duration 0.6s, ease-out
- Stagger children: 0.1s delay between sibling elements
- Scale in for cards: `scale(0.95→1)`, `opacity 0→1`

### Hover States
- Buttons: `transform: translateY(-1px)`, shadow increase
- Cards: `transform: translateY(-4px)`, shadow increase
- Images: `scale(1.05)` inside overflow-hidden container
- Links: underline animation (width 0→100% from left)

### Scroll Behaviors
- Smooth scroll globally
- Parallax: background images at 0.5x scroll speed
- Reveal on scroll: IntersectionObserver triggers fade-up

## Mini-Program Specific

### WeChat Mini-Program
- Use `rpx` units, base 750rpx width
- Tab bar: 48px height, simple icons + labels
- Page padding: 32rpx horizontal
- Card radius: 16rpx
- Primary button height: 88rpx (touch-friendly)

### Common Pitfalls to Avoid
1. ❌ Pure white `#ffffff` page background with pure black `#000000` text → use slightly off-white and soft dark
2. ❌ Border-radius 4px everywhere → vary by element type
3. ❌ Box-shadow with large blur and spread → keep subtle
4. ❌ Center-aligned everything → use left alignment for readability
5. ❌ Ignoring mobile touch targets → minimum 44x44px

## Workflow

When user requests a page design:

1. Ask for brand color (or pick a sophisticated default)
2. Determine page type (landing, dashboard, product, marketing)
3. Choose layout pattern (don't default to 3-column features)
4. Define typography scale
5. Build section by section with proper spacing
6. Add micro-interactions and hover states
7. Verify responsive behavior
