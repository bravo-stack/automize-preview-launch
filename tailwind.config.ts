import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },

      keyframes: {
        cycle: {
          '10%': { transform: 'translateY(-118%)' },
          '25%': { transform: 'translateY(-108%)' },
          '35%': { transform: 'translateY(-218%)' },
          '50%': { transform: 'translateY(-208%)' },
          '60%': { transform: 'translateY(-318%)' },
          '75%': { transform: 'translateY(-308%)' },
          '85%': { transform: 'translateY(-418%)' },
          '100%': { transform: 'translateY(-408%)' },
        },

        scroll: {
          to: {
            transform: 'translate(-100%)',
          },
        },
      },

      animation: {
        cycle: 'cycle 8s infinite',
        scroll: 'scroll 10s linear infinite',
      },
    },
  },
  plugins: [],
}
export default config
