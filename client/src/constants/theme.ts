/**
 * Shared theme tokens and style constants.
 * Inspired by AutoReel's clean, professional design.
 */

export const COLORS = {
  // Primary brand colors
  PRIMARY: '#6C5CE7',
  PRIMARY_DARK: '#5A4BD1',
  PRIMARY_LIGHT: '#A29BFE',
  
  // Accent colors
  ACCENT: '#00D2FF',
  ACCENT_DARK: '#00B4D8',
  SUCCESS: '#00C48C',
  WARNING: '#FFB800',
  ERROR: '#FF4757',
  
  // Neutrals
  DARK: '#0F0F23',
  DARK_SECONDARY: '#1A1A2E',
  DARK_CARD: '#16213E',
  DARK_SURFACE: '#1E2A47',
  LIGHT_BG: '#F8F9FC',
  LIGHT_CARD: '#FFFFFF',
  
  // Text
  TEXT_PRIMARY_DARK: '#FFFFFF',
  TEXT_SECONDARY_DARK: 'rgba(255, 255, 255, 0.7)',
  TEXT_MUTED_DARK: 'rgba(255, 255, 255, 0.5)',
} as const;

export const GRADIENTS = {
  PRIMARY: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 100%)',
  PRIMARY_HOVER: 'linear-gradient(135deg, #5A4BD1 0%, #8B83E0 100%)',
  HERO: 'linear-gradient(135deg, #0F0F23 0%, #1A1A2E 50%, #16213E 100%)',
  HERO_ACCENT: 'linear-gradient(135deg, #6C5CE7 0%, #00D2FF 100%)',
  CTA: 'linear-gradient(135deg, #6C5CE7 0%, #A29BFE 50%, #00D2FF 100%)',
  CARD_DARK: 'linear-gradient(135deg, rgba(108, 92, 231, 0.1) 0%, rgba(0, 210, 255, 0.05) 100%)',
  PAGE_BG: 'linear-gradient(135deg, #F8F9FC 0%, #EEF0F7 100%)',
  DARK_BG: 'linear-gradient(180deg, #0F0F23 0%, #1A1A2E 100%)',
  SECTION_ALT: 'linear-gradient(180deg, #F8F9FC 0%, #FFFFFF 50%, #F8F9FC 100%)',
  USER_BUTTON_BG:
    'linear-gradient(135deg, rgba(108, 92, 231, 0.12) 0%, rgba(0, 210, 255, 0.08) 100%)',
  USER_BUTTON_BG_HOVER:
    'linear-gradient(135deg, rgba(108, 92, 231, 0.2) 0%, rgba(0, 210, 255, 0.12) 100%)',
  GLASS: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
} as const;

export const SHADOWS = {
  NAV: '0 4px 30px rgba(0, 0, 0, 0.06)',
  NAV_ACTIVE: '0 4px 16px rgba(108, 92, 231, 0.35)',
  NAV_ACTIVE_HOVER: '0 6px 20px rgba(108, 92, 231, 0.45)',
  CARD: '0 4px 20px rgba(0, 0, 0, 0.06)',
  CARD_HOVER: '0 12px 40px rgba(0, 0, 0, 0.12)',
  BUTTON: '0 4px 16px rgba(108, 92, 231, 0.3)',
  BUTTON_HOVER: '0 8px 24px rgba(108, 92, 231, 0.4)',
  USER_MENU: '0 8px 32px rgba(0, 0, 0, 0.12)',
  GLOW: '0 0 40px rgba(108, 92, 231, 0.15)',
} as const;

export const BORDERS = {
  CARD: '1px solid rgba(108, 92, 231, 0.1)',
  CARD_HOVER: '1px solid rgba(108, 92, 231, 0.25)',
  INPUT: '1px solid rgba(0, 0, 0, 0.12)',
  GLASS: '1px solid rgba(255, 255, 255, 0.15)',
  DIVIDER: '1px solid rgba(0, 0, 0, 0.06)',
} as const;

export const RADIUS = {
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  ROUND: 50,
} as const;
