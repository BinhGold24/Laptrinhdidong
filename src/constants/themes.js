import { Platform } from 'react-native';

export const FONT_FAMILY = Platform.select({
  ios: 'Courier',
  android: 'monospace',
  default: 'monospace',
});

export const THEMES = {
  strawberry: {
    id: 'strawberry',
    name: 'Dâu Sữa',
    nameVi: 'Dâu Sữa',
    nameEn: 'Strawberry',
    icon: '🍓',
    fontFamily: FONT_FAMILY,
    background: '#FFF7F8',
    surface: '#FFFFFF',
    primary: '#FF7E95',
    primaryLight: '#FFE9ED',
    secondary: '#A290E8',
    secondaryLight: '#F3EFFF',
    accent: '#FFB84C',
    accentLight: '#FFF4E0',
    green: '#6BCB77',
    greenLight: '#E8F8EB',
    ink: '#2D2836',
    muted: '#9E98A8',
    line: '#F4ECEF',
    border: '#F8E7EB',
    isDark: false,
  },
  lavender: {
    id: 'lavender',
    name: 'Oải Hương',
    nameVi: 'Oải Hương',
    nameEn: 'Lavender',
    icon: '💜',
    fontFamily: FONT_FAMILY,
    background: '#F9F8FF',
    surface: '#FFFFFF',
    primary: '#9182EB',
    primaryLight: '#F0EEFF',
    secondary: '#FF88A5',
    secondaryLight: '#FFEBF0',
    accent: '#4D96FF',
    accentLight: '#EAF3FF',
    green: '#54BAB9',
    greenLight: '#E7F7F7',
    ink: '#272338',
    muted: '#9691A5',
    line: '#ECEBF6',
    border: '#E8E5F7',
    isDark: false,
  },
  mint: {
    id: 'mint',
    name: 'Bơ & Matcha',
    nameVi: 'Bơ & Matcha',
    nameEn: 'Mint & Matcha',
    icon: '🥑',
    fontFamily: FONT_FAMILY,
    background: '#F6FAF7',
    surface: '#FFFFFF',
    primary: '#52B788',
    primaryLight: '#E8F6EF',
    secondary: '#F4A261',
    secondaryLight: '#FEF3EA',
    accent: '#4EA8DE',
    accentLight: '#EAF5FB',
    green: '#52B788',
    greenLight: '#E8F6EF',
    ink: '#23302B',
    muted: '#8B9C94',
    line: '#E7EFEA',
    border: '#E2EEE6',
    isDark: false,
  },
  peach: {
    id: 'peach',
    name: 'Trà Đào',
    nameVi: 'Trà Đào',
    nameEn: 'Peach Tea',
    icon: '🍑',
    fontFamily: FONT_FAMILY,
    background: '#FFF8F4',
    surface: '#FFFFFF',
    primary: '#FF8A65',
    primaryLight: '#FFECE5',
    secondary: '#9C88FF',
    secondaryLight: '#F2EFFE',
    accent: '#FFC048',
    accentLight: '#FFF6E3',
    green: '#66BB6A',
    greenLight: '#EBF7EC',
    ink: '#362A27',
    muted: '#A59792',
    line: '#F4ECE6',
    border: '#F7E7DC',
    isDark: false,
  },
  midnight: {
    id: 'midnight',
    name: 'Bóng Đêm',
    nameVi: 'Bóng Đêm',
    nameEn: 'Midnight Dark',
    icon: '🌙',
    isDark: true,
    fontFamily: FONT_FAMILY,
    background: '#121216',
    surface: '#1E1E26',
    primary: '#A290E8',
    primaryLight: '#2C2740',
    secondary: '#FF7E95',
    secondaryLight: '#3D2530',
    accent: '#FFD166',
    accentLight: '#3D311E',
    green: '#52B788',
    greenLight: '#1E382B',
    ink: '#F5F4F8',
    muted: '#A6A2B2',
    line: '#2A2834',
    border: '#363342',
  },
  darkRose: {
    id: 'darkRose',
    name: 'Hoa Hồng Đêm',
    nameVi: 'Hoa Hồng Đêm',
    nameEn: 'Dark Rose',
    icon: '🖤',
    isDark: true,
    fontFamily: FONT_FAMILY,
    background: '#161316',
    surface: '#241D24',
    primary: '#FF6B8B',
    primaryLight: '#3D1F29',
    secondary: '#C084FC',
    secondaryLight: '#351F42',
    accent: '#FBBF24',
    accentLight: '#3D3118',
    green: '#34D399',
    greenLight: '#18382B',
    ink: '#FDF2F4',
    muted: '#ABA0A6',
    line: '#332933',
    border: '#453745',
  },
};

export function getEffectiveTheme(themeKey, isDark) {
  let targetKey = themeKey;

  // Nếu ở chế độ Sáng (!isDark) mà themeKey là theme tối -> tự chuyển sang theme sáng Dâu Sữa
  if (!isDark && (targetKey === 'midnight' || targetKey === 'darkRose' || THEMES[targetKey]?.isDark)) {
    targetKey = 'strawberry';
  }

  const base = THEMES[targetKey] || THEMES.strawberry;

  if (isDark) {
    // Theme Bóng Đêm và Hoa Hồng Đêm là các theme tối chuyên biệt
    if (base.isDark) {
      return base;
    }
    // Tạo bản tối đồng bộ cho các màu pastel khi người dùng bật Chế độ Tối
    switch (targetKey) {
      case 'strawberry':
        return {
          ...base,
          isDark: true,
          background: '#151216',
          surface: '#221C22',
          primary: '#FF7E95',
          primaryLight: '#3D1F29',
          ink: '#FDF2F4',
          muted: '#ABA0A6',
          line: '#2F2631',
          border: '#3E3240',
        };
      case 'lavender':
        return {
          ...base,
          isDark: true,
          background: '#13121C',
          surface: '#1E1C2B',
          primary: '#9182EB',
          primaryLight: '#2C2740',
          ink: '#F5F4F8',
          muted: '#A6A2B2',
          line: '#2A263C',
          border: '#393352',
        };
      case 'mint':
        return {
          ...base,
          isDark: true,
          background: '#111714',
          surface: '#1A2420',
          primary: '#52B788',
          primaryLight: '#1C382A',
          ink: '#F2FAF5',
          muted: '#9FB0A7',
          line: '#24332D',
          border: '#30453D',
        };
      case 'peach':
        return {
          ...base,
          isDark: true,
          background: '#171311',
          surface: '#261F1C',
          primary: '#FF8A65',
          primaryLight: '#3D271E',
          ink: '#FFF5F0',
          muted: '#B0A29C',
          line: '#332925',
          border: '#453731',
        };
      default:
        return THEMES.midnight;
    }
  } else {
    // Chế độ sáng hoàn toàn cho pastel
    return {
      ...base,
      isDark: false,
    };
  }
}
