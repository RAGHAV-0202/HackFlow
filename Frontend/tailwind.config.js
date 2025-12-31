/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Custom jute theme colors
				jute: {
					50: '#f9f7f4',
					100: '#f0eae0',
					200: '#e4d7c0',
					300: '#d3bc94',
					400: '#c2a167',
					500: '#b28a4c',
					600: '#a77941',
					700: '#8b623b',
					800: '#714f34',
					900: '#5d422e',
					950: '#2e1f16',
				},
				terracotta: {
					50: '#fbf7f4',
					100: '#f6ece5',
					200: '#ecd5c7',
					300: '#e0b599',
					400: '#d48e6a',
					500: '#c97048',
					600: '#ba5c3d',
					700: '#9b4832',
					800: '#7e3c2e',
					900: '#683428',
					950: '#381a15',
				},
				sage: {
					50: '#f5f8f3',
					100: '#e9f1e6',
					200: '#d5e2cf',
					300: '#b6ccab',
					400: '#92b183',
					500: '#759565',
					600: '#5e784f',
					700: '#4a5f3f',
					800: '#3c4b35',
					900: '#333f2e',
					950: '#182114',
				},
			},
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				display: ['"Playfair Display"', 'serif'],
				body: ['"Open Sans"', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			gradient: {
			'0%': { backgroundPosition: '0% 50%' },
			'50%': { backgroundPosition: '100% 50%' },
			'100%': { backgroundPosition: '0% 50%' },
			},
        
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'gradient': 'gradient 8s linear infinite'
			}
		}
	},
	plugins: [
    	require('@tailwindcss/line-clamp'),
  ],
}