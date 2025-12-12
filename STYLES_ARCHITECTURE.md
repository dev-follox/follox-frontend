# Styles Architecture Guide

## Directory Structure

```
styles/
├── index.css                    # Main entry point (imported in index.html)
├── base/                        # Base/foundational styles
│   ├── _variables.css           # CSS custom properties
│   └── _typography.css          # Base typography
├── components/                  # Component-specific styles
│   ├── _button.css
│   ├── _card.css
│   └── _header.css
├── pages/                       # Page-specific styles
│   ├── _auth-landing.css
│   ├── _login.css
│   └── _dashboard.css
├── utilities/                   # Utility classes and helpers
│   └── _helpers.css
└── layouts/                     # Layout-specific styles
    └── _public-layout.css
```

## Best Practices

### 1. **When to Use Custom Styles vs Tailwind**

- **Use Tailwind** for:
  - Spacing, colors, typography (most common cases)
  - Responsive utilities
  - Standard layouts

- **Use Custom CSS** for:
  - Complex animations
  - Custom gradients or effects
  - Styles that require CSS features Tailwind doesn't cover
  - Page-specific unique designs

### 2. **Naming Conventions**

- Use **kebab-case** for class names: `.auth-landing-container`
- Prefix page-specific classes with page name: `.login-form-wrapper`
- Use BEM methodology for complex components if needed

### 3. **File Organization**

- **Component styles**: One file per component in `styles/components/`
- **Page styles**: One file per page in `styles/pages/`
- **Global utilities**: Shared utilities in `styles/utilities/`

### 4. **CSS Variables**

Define reusable values in `styles/base/_variables.css`:
```css
:root {
  --color-primary: #E7FE57;
  --spacing-md: 1rem;
}
```

### 5. **Importing Styles**

All styles are imported in `styles/index.css`, which is loaded in `index.html`.

## Alternative: CSS Modules (Component-Scoped)

If you prefer component-scoped styles, you can use CSS Modules:

```
components/
├── Button/
│   ├── Button.tsx
│   └── Button.module.css
```

Then import in component:
```tsx
import styles from './Button.module.css';
<div className={styles.button}>...</div>
```

## Setting Up SCSS (Optional)

If you want to use SCSS instead of CSS:

1. Install dependencies:
```bash
npm install -D sass
```

2. Rename `.css` files to `.scss`

3. Update imports in `styles/index.css` to use `.scss` extensions

4. You can now use SCSS features:
   - Variables: `$primary-color: #E7FE57;`
   - Nesting
   - Mixins
   - Functions

## Example Usage

### In a Component:
```tsx
// pages/AuthLandingPage.tsx
<div className="auth-landing-container">
  <Card className="auth-card-hover">
    {/* content */}
  </Card>
</div>
```

### In a CSS File:
```css
/* styles/pages/_auth-landing.css */
.auth-landing-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card-hover {
  transition: transform 0.3s ease;
}

.auth-card-hover:hover {
  transform: translateY(-4px);
}
```

