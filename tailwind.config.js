/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {

    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'xl': '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }

      'massive': '2500px',
      // => @media (min-width: 1536px) { ... }
    },

    extend: {
      animation: {
        fade: 'fadeOut 10s ease-in-out',
      },
      variants: {
        outline: [ "focus" ],
      },
      keyframes: theme => ( {
        fadeOut: {
          '0%': { backgroundColor: theme( 'colors.inherit.300' ) },
          '100%': { backgroundColor: theme( 'colors.transparent' ) },
        },
      } ),

      fontFamily: {
        Lato: ["Lato", "sans-serif"],
        Roboto: ["Roboto", "sans-serif"],
       },

      colors: {
        'regal-blue': '#243c5a',
        'primary': '#C74782',
      },
      
      backgroundImage: {
        'bbm-background': "url('/src/images/blackBoxBoardDark.png')",
      },
    }
  },
  
  plugins: [],
  important: true,
}