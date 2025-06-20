# ARMOR Brand Style Guide

## Color Palette

### Primary Colors
- **Brand Purple** - `#D743DD`
  - Main brand color
  - Used for primary buttons, headings, and important UI elements
  - RGB: 215, 67, 221

- **Brand Pink** - `#E047A0`
  - Secondary brand color
  - Used for secondary text, highlights, and accents
  - RGB: 224, 71, 160

### Secondary Colors
- **Success Green** - `#47E0A0`
  - Used for checkmarks and success indicators
  - RGB: 71, 224, 160

- **Error Red** - `#E04747`
  - Used for error states and warning indicators
  - RGB: 224, 71, 71

### Neutral Colors
- **Background Black** - `#000000`
  - Primary background color
  - RGB: 0, 0, 0

- **Dark Gray** - `#111111`
  - Secondary background color (control panels)
  - RGB: 17, 17, 17

- **Light Gray** - `#999999`
  - Used for secondary text and disabled states
  - RGB: 153, 153, 153

- **Darker Gray** - `#666666`
  - Used for tertiary text and subtle elements
  - RGB: 102, 102, 102

### Gradients
1. **Brand Gradient**
   ```css
   background: linear-gradient(45deg, #D743DD, #E047A0)
   ```
   - Used for premium text elements and important headings

2. **Divider Gradient**
   ```css
   background: linear-gradient(to bottom, transparent, #D743DD, transparent)
   ```
   - Used for vertical dividers in comparison sections

## Typography

### Font Family
- Primary Font: `'Roboto'`
- Weights used: 400 (Regular), 700 (Bold), 900 (Black)
- Font import:
  ```css
  @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;700;900&display=swap')
  ```

### Font Sizes
Base font size: 16px (1rem)

Heading Hierarchy:
- H1: `12vmin` (with font multiplier)
- H2: `8vmin` (with font multiplier)
- H3: `6vmin` (with font multiplier)
- Body text: `4vmin` (with font multiplier)
- Small text: `2vmin` (with font multiplier)

## UI Elements

### Buttons
Primary Button:
```css
background: #D743DD
color: white
padding: 1.875vmin 3.75vmin
border-radius: 1.6vmin
```

### Cards and Containers
Service Cards:
```css
background: rgba(0, 0, 0, 0.2)
border-radius: 2vmin
padding: 2vmin
```

Package Cards:
```css
background: rgba(215, 67, 221, 0.1)
border-radius: 1.875vmin
```

### Overlays
Video Overlay:
```css
background: rgba(0, 0, 0, 0.5)
```

## Animation

### Transitions
- Standard transition time: 0.3s
- Easing function: ease-out

### Keyframe Animations
1. Fade In:
```css
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
```

2. Pulse Effect:
```css
@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1); }
}
```

3. Scale Animation:
```css
@keyframes scale {
    0% { transform: scale(1); }
    25% { transform: scale(1.05); }
    75% { transform: scale(0.95); }
    100% { transform: scale(1); }
}
```

## Layout

### Spacing
- Standard padding: 2.5rem
- Grid gap: 1.875rem
- Section margins: 1.25rem
- Border radius: 1.6vmin - 3vmin

### Responsive Design
- Uses viewport-based units (vmin, vw, vh)
- Font size multiplier system for flexible scaling
- Responsive grid system for service cards

## Brand Elements

### Logo
- Simple text-based logo using Roboto Black (900)
- Primary color: #D743DD
- Subtitle in light gray (#999999)

### Icons
- Minimal, geometric icons
- Consistent size: 5vmin x 5vmin
- Background color: #666666
- Border radius: 1vmin

## Content Guidelines

### Tone of Voice
- Professional yet modern
- Emphasizes premium quality
- Uses action words and strong statements
- Highlights technical superiority

### Key Messages
1. Premium Protection
2. Advanced Technology
3. Complete Coverage
4. Professional Service

### Terminology
- "ARMOR" - Always in capitals
- "360°" - Used for complete protection packages
- "ULTIMATE" - Premium tier branding 