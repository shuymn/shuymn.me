# Dark Mode Implementation Plan

## Step-by-Step Implementation

### Step 1: Install Dependencies
```bash
bun add next-themes
```

### Step 2: Update Tailwind Configuration
- Modify `tailwind.config.ts` to:
  - Enable dark mode with class strategy
  - Add custom color variables to theme

### Step 3: Define CSS Variables
- Update `src/app/globals.css`:
  - Add CSS variables for light mode in `:root`
  - Add CSS variables for dark mode in `.dark`

### Step 4: Create Theme Toggle Component
- Create `src/app/_components/ThemeToggle.tsx`:
  - Sun/moon icon toggle button
  - Use `useTheme` hook from next-themes

### Step 5: Update Layout
- Modify `src/app/layout.tsx`:
  - Import and wrap app with `ThemeProvider`
  - Set `attribute="class"` for Tailwind compatibility

### Step 6: Add Toggle to Header
- Update `src/app/_components/Header.tsx`:
  - Import and add ThemeToggle component
  - Position it on the right side

### Step 7: Update Component Styles
- Replace hardcoded colors with CSS variable-based classes:
  - `src/app/layout.tsx` - body classes
  - `src/app/page.tsx` - hr border color
  - `src/app/_components/About.tsx` - any color classes
  - `src/app/_components/PostLink.tsx` - text colors
  - `src/app/posts/[slug]/page.tsx` - prose styles

### Step 8: Test Implementation
- Verify toggle functionality
- Check localStorage persistence
- Ensure no flash on page reload
- Test all pages in both themes

## Order of Execution
1. Dependencies & configuration (Steps 1-3)
2. Core functionality (Steps 4-6)
3. Style updates (Step 7)
4. Testing (Step 8)