/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#2457F5', dark: '#1B44C4', soft: '#E8EEFF' },
        ink: { DEFAULT: '#0F1B2D', soft: '#5B6779' },
        bg: '#F4F6FA', line: '#DDE3EC', locked: '#EEF1F6',
        xp: { DEFAULT: '#B45309', soft: '#FEF3C7' },
        pass: { DEFAULT: '#0F7B55', soft: '#E3F5EC', ink: '#0A5C3F' },
        fail: { DEFAULT: '#C0262D', soft: '#FDECEC', ink: '#8E1B21' },
        quiz: '#7E22CE'
      },
      fontFamily: { display: ['"Space Grotesk"', 'Inter', 'sans-serif'], sans: ['Inter', 'system-ui', 'sans-serif'] }
    }
  },
  plugins: []
}
