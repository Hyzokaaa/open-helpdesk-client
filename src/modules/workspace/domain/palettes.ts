import { generateScale, hexToRgbString } from './color-scale';

export interface PaletteDefinition {
  name: string;
  label: { en: string; es: string };
  swatch: string;
  accentRgb: string;
  scale: Record<string, string>;
}

export const PALETTES: Record<string, PaletteDefinition> = {
  green: {
    name: 'green',
    label: { en: 'Green', es: 'Verde' },
    swatch: '#059669',
    accentRgb: '5 150 105',
    scale: {
      '50': '#ecfdf5',
      '100': '#d1fae5',
      '200': '#a7f3d0',
      '300': '#6ee7b7',
      '400': '#34d399',
      '500': '#10b981',
      '600': '#059669',
      '700': '#047857',
      '800': '#065f46',
      '900': '#064e3b',
      '950': '#022c22',
    },
  },
  blue: {
    name: 'blue',
    label: { en: 'Blue', es: 'Azul' },
    swatch: '#2563eb',
    accentRgb: '37 99 235',
    scale: {
      '50': '#eff6ff',
      '100': '#dbeafe',
      '200': '#bfdbfe',
      '300': '#93c5fd',
      '400': '#60a5fa',
      '500': '#3b82f6',
      '600': '#2563eb',
      '700': '#1d4ed8',
      '800': '#1e40af',
      '900': '#1e3a8a',
      '950': '#172554',
    },
  },
  purple: {
    name: 'purple',
    label: { en: 'Purple', es: 'Púrpura' },
    swatch: '#7c3aed',
    accentRgb: '124 58 237',
    scale: {
      '50': '#f5f3ff',
      '100': '#ede9fe',
      '200': '#ddd6fe',
      '300': '#c4b5fd',
      '400': '#a78bfa',
      '500': '#8b5cf6',
      '600': '#7c3aed',
      '700': '#6d28d9',
      '800': '#5b21b6',
      '900': '#4c1d95',
      '950': '#2e1065',
    },
  },
  orange: {
    name: 'orange',
    label: { en: 'Orange', es: 'Naranja' },
    swatch: '#ea580c',
    accentRgb: '234 88 12',
    scale: {
      '50': '#fff7ed',
      '100': '#ffedd5',
      '200': '#fed7aa',
      '300': '#fdba74',
      '400': '#fb923c',
      '500': '#f97316',
      '600': '#ea580c',
      '700': '#c2410c',
      '800': '#9a3412',
      '900': '#7c2d12',
      '950': '#431407',
    },
  },
  rose: {
    name: 'rose',
    label: { en: 'Rose', es: 'Rosa' },
    swatch: '#e11d48',
    accentRgb: '225 29 72',
    scale: {
      '50': '#fff1f2',
      '100': '#ffe4e6',
      '200': '#fecdd3',
      '300': '#fda4af',
      '400': '#fb7185',
      '500': '#f43f5e',
      '600': '#e11d48',
      '700': '#be123c',
      '800': '#9f1239',
      '900': '#881337',
      '950': '#4c0519',
    },
  },
  teal: {
    name: 'teal',
    label: { en: 'Teal', es: 'Turquesa' },
    swatch: '#0d9488',
    accentRgb: '13 148 136',
    scale: {
      '50': '#f0fdfa',
      '100': '#ccfbf1',
      '200': '#99f6e4',
      '300': '#5eead4',
      '400': '#2dd4bf',
      '500': '#14b8a6',
      '600': '#0d9488',
      '700': '#0f766e',
      '800': '#115e59',
      '900': '#134e4a',
      '950': '#042f2e',
    },
  },
  indigo: {
    name: 'indigo',
    label: { en: 'Indigo', es: 'Índigo' },
    swatch: '#4f46e5',
    accentRgb: '79 70 229',
    scale: {
      '50': '#eef2ff',
      '100': '#e0e7ff',
      '200': '#c7d2fe',
      '300': '#a5b4fc',
      '400': '#818cf8',
      '500': '#6366f1',
      '600': '#4f46e5',
      '700': '#4338ca',
      '800': '#3730a3',
      '900': '#312e81',
      '950': '#1e1b4b',
    },
  },
};

export const DEFAULT_PALETTE = 'green';

export function isCustomPalette(name: string | null | undefined): boolean {
  return !!name && name.startsWith('custom:');
}

export function getCustomHex(name: string): string {
  return name.replace('custom:', '');
}

export function getPalette(name: string | null | undefined): PaletteDefinition {
  if (!name) return PALETTES[DEFAULT_PALETTE];

  if (isCustomPalette(name)) {
    const hex = getCustomHex(name);
    return {
      name: 'custom',
      label: { en: 'Custom', es: 'Personalizado' },
      swatch: hex,
      accentRgb: hexToRgbString(hex),
      scale: generateScale(hex),
    };
  }

  return PALETTES[name] ?? PALETTES[DEFAULT_PALETTE];
}
