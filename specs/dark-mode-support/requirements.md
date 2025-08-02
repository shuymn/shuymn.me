# Dark Mode Support Requirements

## Overview
Add dark mode support to the shuymn.me blog using standard patterns that work with our Next.js + Tailwind CSS stack.

## Core Requirements

1. **Theme Toggle**
   - Add a toggle button to switch between light and dark modes
   - Place it in the header for easy access

2. **Theme Persistence**
   - Save user's theme preference in localStorage
   - Theme choice should persist across page reloads

3. **Visual Implementation**
   - Use Tailwind CSS's dark mode utilities
   - Apply dark colors to background, text, and UI elements
   - Ensure readable contrast in dark mode

4. **Technical Approach**
   - Use next-themes or similar established solution
   - Prevent flash of wrong theme on page load
   - Works on latest Chrome

That's it. Simple dark mode that works.