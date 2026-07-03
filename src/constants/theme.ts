// Light theme — white surface, sky blue (primary accent/CTAs) + mint green
// (verified/success). Camera-context screens (CaptureScreen's permission
// state, ProcessingScreen's photo scrim) intentionally hardcode light text on
// a black backdrop instead of using these tokens — see the comments there.
export const COLORS = {
  background: '#FFFFFF',
  surface: '#F4F8FB',
  surfaceAlt: '#EAF4FB',
  surfaceHover: '#DCEEFA',
  border: '#DCE6EF',
  borderLight: '#EAF1F7',

  text: '#0F172A',
  textSecondary: '#51606F',
  textMuted: '#8B98A5',

  accent: '#0284C7',
  accentLight: '#0369A1',
  accentDim: 'rgba(14, 165, 233, 0.12)',
  accentBorder: 'rgba(14, 165, 233, 0.35)',

  success: '#0D9488',
  successDim: 'rgba(20, 184, 166, 0.14)',
  warning: '#D97706',
  warningDim: 'rgba(217, 119, 6, 0.12)',
  error: '#DC2626',
  errorDim: 'rgba(220, 38, 38, 0.10)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  overlay: 'rgba(15, 23, 42, 0.6)',
  overlayLight: 'rgba(15, 23, 42, 0.35)',
} as const;

export const TYPOGRAPHY = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 36,
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
} as const;

export const RADIUS = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  full: 9999,
} as const;

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  accent: {
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
} as const;
