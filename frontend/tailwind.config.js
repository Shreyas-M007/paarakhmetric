/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--gesso-canvas)',
        surface: 'var(--gesso-surface)',
        'surface-elevated': 'var(--gesso-surface-elevated)',
        'surface-recessed': 'var(--gesso-surface-recessed)',
        fg: 'var(--gesso-fg)',
        'fg-muted': 'var(--gesso-fg-muted)',
        divider: 'var(--gesso-divider)',
        accent: 'var(--gesso-accent)',
        'accent-2': 'var(--gesso-accent-2)',
        'on-accent': 'var(--gesso-on-accent)',
        success: 'var(--gesso-success)',
        warning: 'var(--gesso-warning)',
        error: 'var(--gesso-error)',
        primary: 'var(--gesso-primary)',
        secondary: 'var(--gesso-secondary)',
        lime: 'var(--gesso-lime)',
      },
      fontFamily: {
        display: ['var(--gesso-font-display)', 'sans-serif'],
        body: ['var(--gesso-font-body)', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--gesso-radius-sm)',
        md: 'var(--gesso-radius-md)',
        lg: 'var(--gesso-radius-lg)',
        full: 'var(--gesso-radius-full)',
      },
      boxShadow: {
        sm: 'var(--gesso-shadow-sm)',
        md: 'var(--gesso-shadow-md)',
        lg: 'var(--gesso-shadow-lg)',
      }
    },
  },
  plugins: [],
}
