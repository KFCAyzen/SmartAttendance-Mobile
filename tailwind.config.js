/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2F5BFF', // cobalt — couleur de marque
          50: '#EEF2FF',
          100: '#DCE4FF',
          500: '#2F5BFF',
          600: '#1E47E6',
          700: '#1838C2',
          800: '#152E9C',
          900: '#13287F',
          dark: '#152E9C',
        },
        accent: '#FF8A3D', // ambre chaud
        success: '#16A34A',
        warning: '#F59E0B',
        danger: '#EF4444',
        ink: '#0E1326', // texte principal (clair)
        muted: '#717A90', // texte secondaire (clair)
        surface: {
          light: '#F1F3FA', // fond d'écran (clair)
          dark: '#080B14', // fond d'écran (sombre)
          card: '#FFFFFF', // carte (clair)
          cardDark: '#121829', // carte (sombre)
          soft: '#F7F8FD', // sous-carte / champ (clair)
          softDark: '#1A2236', // sous-carte / champ (sombre)
        },
      },
      fontFamily: {
        display: ['BricolageGrotesque_700Bold'],
        body: ['PlusJakartaSans_400Regular'],
        bodyMedium: ['PlusJakartaSans_500Medium'],
        bodySemibold: ['PlusJakartaSans_600SemiBold'],
        bodyBold: ['PlusJakartaSans_700Bold'],
      },
    },
  },
  plugins: [],
};
