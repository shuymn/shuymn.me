module.exports = {
  purge: {
    content: ['./src/pages/**/*.tsx', './src/components/**/*.tsx'],
    options: { safelist: ['text-center', 'text-base'] },
  },
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [require('@tailwindcss/typography')],
}
