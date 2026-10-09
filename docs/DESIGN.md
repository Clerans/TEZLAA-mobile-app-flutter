# Design & UI/UX Standards — TEZLAA Ecosystem

## 1. Design Philosophy
TEZLAA employs an artisan, premium café aesthetic combining warm dark slate tones, warm espresso browns, high-contrast typography, and crisp feedback states.

## 2. Color Palette & Design Tokens

| Token | Hex Code | Purpose |
| :--- | :--- | :--- |
| `primary` | `#0F172A` / `#D97706` | Brand slate & artisanal amber accents |
| `secondary` | `#92400E` | Rich espresso brown |
| `neutral900` | `#0F172A` | Primary typography & high-emphasis headings |
| `neutral500` | `#64748B` | Secondary captions, timestamps & placeholders |
| `neutral100` | `#F1F5F9` | Card surfaces & light input backgrounds |
| `neutral50` | `#F8FAFC` | Main application background |
| `green` | `#16A34A` | Confirmed status, successful payments & in-stock |
| `amber` | `#D97706` | Preparing state, loyalty points & warnings |
| `purple` | `#7C3AED` | Out for delivery & courier dispatch |
| `red` | `#DC2626` | Destructive actions, cancellations & errors |

## 3. Typography
- **Headings & Brand**: Serif display typography for an artisan café feel (`Playfair Display` or serif system font).
- **Body & Controls**: Sans-serif geometric font (`Inter` / system sans) for clarity, legibility, and numbers.

## 4. UI/UX States Specification
Every screen must handle the full lifecycle of async states:
1. **LOADING**: Subtle skeleton loaders (`shimmer`) or centered branding progress indicators.
2. **EMPTY**: Descriptive illustration/icon with a primary call to action (e.g., "Empty Cart" -> "Browse Menu").
3. **ERROR**: Clear human-readable explanation with a primary "Retry" button. Never display blank screens.
4. **OFFLINE**: Informative status banner indicating lost connection with automatic reconnection.
5. **UNAUTHORIZED / SESSION EXPIRED**: Gentle prompt directing the user to sign in without losing active cart state.

## 5. Viewport Profiles & Responsive Target Guidelines

| Category | Viewport Resolution | Target Devices | Layout Strategy |
| :--- | :--- | :--- | :--- |
| **Mobile Compact** | 375 x 812 | iPhone Mini, Compact Android | Single column, sticky bottom actions, safe keyboard insets |
| **Mobile Standard** | 390 x 844 | iPhone 14/15/16, Pixel 7/8 | Default mobile reference layout |
| **Tablet Portrait** | 768 x 1024 | iPad, Android Tablets | 2-column grid for products and KDS cards |
| **Tablet Landscape**| 1024 x 768 | iPad Landscape, POS Station | 3-column KDS grid, side navigation bar |
| **Desktop Laptop**  | 1440 x 900 | Admin Laptop, Store Manager | 4-column responsive layout with fixed sidebar |
| **Desktop Full HD** | 1920 x 1080 | Kitchen Wall Display, Big Screen | Multi-column horizontal swimlanes with high-contrast tickets |
