/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  theme: {
    defaultTheme: 'warmLight',
    themes: {
      warmLight: {
        dark: false,
        colors: {
          // Topla glavna paleta
          primary: '#D4730A', // Topla narandžasta
          secondary: '#C2410C', // Tamnije narandžasta
          accent: '#F59E0B', // Svetlije žuta
          info: '#1E40AF', // Plava ostaje
          warning: '#F59E0B', // Topla žuta
          error: '#DC2626', // Topla crvena
          success: '#16A34A', // Zelena ostaje
          
          // Neutralne toplije boje
          surface: '#FEF7ED', // Vrlo blago topla bela
          background: '#FFFBF5', // Tople pozadinska
          'surface-variant': '#FFF7ED', // Topliji varijanat
          'on-surface': '#1C1917', // Tamno braon za tekst
          'on-primary': '#FFFFFF',
          'on-secondary': '#FFFFFF',
          'on-background': '#1C1917',
          
          // Custom toplije boje
          'warm-orange': '#EA580C',
          'warm-amber': '#D97706',
          'warm-yellow': '#EAB308',
          'warm-red': '#DC2626',
          'warm-brown': '#92400E',
          'cream': '#FEF3C7',
          'light-orange': '#FED7AA',
          'soft-orange': '#FFEDD5'
        }
      },
      warmDark: {
        dark: true,
        colors: {
          // Topla paleta za tamni režim
          primary: '#F59E0B', // Svetliji narandžasta za tamni
          secondary: '#D97706', // Tamnje narandžasta
          accent: '#FCD34D', // Svetla žuta
          info: '#3B82F6', // Plava
          warning: '#F59E0B', // Topla žuta
          error: '#EF4444', // Topla crvena
          success: '#10B981', // Zelena
          
          // Tamne neutralne toplije boje
          surface: '#1C1917', // Tamno braon
          background: '#0C0A09', // Vrlo tamno braon
          'surface-variant': '#292524', // Tamnje braon
          'on-surface': '#F5F5F4', // Svetlo za tekst
          'on-primary': '#1C1917',
          'on-secondary': '#FFFFFF',
          'on-background': '#F5F5F4',
          
          // Custom tamne toplije boje
          'warm-orange': '#F59E0B',
          'warm-amber': '#D97706',
          'warm-yellow': '#FCD34D',
          'warm-red': '#EF4444',
          'warm-brown': '#A3A3A3',
          'cream': '#44403C',
          'light-orange': '#78716C',
          'soft-orange': '#57534E'
        }
      }
    }
  },
})
