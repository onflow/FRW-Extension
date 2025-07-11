// Various neutral colors used in the product
export const COLOR_BLACK_000000 = '#000000';
export const COLOR_BLACK_ALPHA_24_0000003D = '#0000003D';
export const COLOR_SCRIM_BLACK_ALPHA_50_00000080 = '#00000080';
export const COLOR_BLACK_ALPHA_80_000000CC = '#000000CC';
export const COLOR_PRIMARY_DARK_121212 = '#121212';
export const COLOR_DARK_TEAL_BLACK_11271D = '#11271D';
export const COLOR_COLLECTION_DARK_GRAY_1B1B1B = '#1B1B1B';
export const COLOR_VERY_DARK_GRAY_222222 = '#222222';
export const COLOR_SETTINGS_DARK_GRAY_292929 = '#292929';
export const COLOR_PRIMARY_TEXT_282828 = '#282828';
export const COLOR_DARK_CHARCOAL_2C2C2C = '#2C2C2C';
export const COLOR_DARK_GRAY_333333 = '#333333';
export const COLOR_CHARCOAL_GRAY_4C4C4C = '#4C4C4C';
export const COLOR_CHARCOAL_GRAY_ALPHA_24_4C4C4C3D = '#4C4C4C3D';
export const COLOR_PROFILE_DARK_GRAY_484848 = '#484848';
export const COLOR_MEDIUM_DARK_GRAY_5E5E5E = '#5E5E5E';
export const COLOR_LOADING_GRAY_5E5E5EFF = '#5E5E5EFF';
export const COLOR_MEDIUM_GRAY_787878 = '#787878';
export const COLOR_MUTED_BLUE_GRAY_777E90 = '#777E90';
export const COLOR_GRAY_808080 = '#808080';
export const COLOR_MEDIUM_GRAY_BABABA = '#BABABA';
export const COLOR_LIGHT_GRAY_E5E5E5 = '#E5E5E5';
export const COLOR_LIGHT_GRAY_E6E6E6 = '#E6E6E6';
export const COLOR_VERY_LIGHT_GRAY_F2F2F2 = '#F2F2F2';
export const COLOR_OFF_WHITE_FAFAFA = '#FAFAFA';
export const COLOR_OFF_WHITE_F9F9F9 = '#F9F9F9';
export const COLOR_WHITE_ALPHA_08_FFFFFF14 = '#FFFFFF14';
export const COLOR_WHITE_ALPHA_10_FFFFFF1A = '#FFFFFF1A';
export const COLOR_WHITE_ALPHA_12_FFFFFF1F = '#FFFFFF1F';
export const COLOR_WHITE_ALPHA_20_FFFFFF33 = '#FFFFFF33';
export const COLOR_WHITE_ALPHA_40_FFFFFF66 = '#FFFFFF66';
export const COLOR_WHITE_ALPHA_60_FFFFFF99 = '#FFFFFF99';
export const COLOR_WHITE_ALPHA_80_FFFFFFCC = '#FFFFFFCC';

export const COLOR_WHITE_FFFFFF = '#FFFFFF';
export const COLOR_DARK_GRAY_1A1A1A = '#1A1A1A';

// Legacy primary colors used in the product
export const COLOR_ERROR_RED_E54040 = '#E54040';
export const COLOR_BRIGHT_GREEN_38B000 = '#38B000';
export const COLOR_SUCCESS_GREEN_41CC5D = '#41CC5D';
export const COLOR_ORANGE_WARNING_FF8A00 = '#FF8A00';
export const COLOR_SETTINGS_BLUE_59A1DB = '#59A1DB';

// Flow Brand Colors
export const COLOR_GREEN_FLOW_DARKMODE_00EF8B = '#00EF8B';
export const COLOR_GREEN_FLOW_DARKMODE_DARK_02D87E = '#02D87E';
export const COLOR_GREEN_FLOW_THEME_16FF99 = '#16FF99';

export const COLOR_GREEN_FLOW_DARKMODE_00EF8B_10pc = `${COLOR_GREEN_FLOW_DARKMODE_00EF8B}10`;
export const COLOR_GREEN_FLOW_LIGHTMODE_00B877 = '#00B877';

// Gradient colors for welcome page components
export const COLOR_GRADIENT_GREEN_00EF8B_00 = '#00EF8B00';
export const COLOR_GRADIENT_GREEN_00EF8B_20 = '#00EF8B33';
export const COLOR_GRADIENT_WHITE_FFFFFF_NEGATIVE_09 = '#FFFFFF00';

export const COLOR_DARKMODE_BACKGROUND_CARDS_1A1A1A = COLOR_DARK_GRAY_1A1A1A;
export const COLOR_DARKMODE_TEXT_PRIMARY_FFFFFF = COLOR_WHITE_FFFFFF;
export const COLOR_DARKMODE_TEXT_PRIMARY_80_FFFFFF80 = '#FFFFFF80';

export const COLOR_DARKMODE_TEXT_SECONDARY_B3B3B3 = '#B3B3B3';
export const COLOR_DARKMODE_TEXT_SECONDARY_737373 = '#737373';
export const COLOR_DARKMODE_WHITE_10pc = `${COLOR_WHITE_FFFFFF}10`;
export const COLOR_DARKMODE_WHITE_3pc = `${COLOR_WHITE_FFFFFF}03`;
export const COLOR_DARKMODE_WHITE_50pc = `${COLOR_WHITE_FFFFFF}50`;

export const COLOR_GREY_ICONS_767676 = '#767676';
export const COLOR_ACCENT_EVM_627EEA = '#627EEA';

// Network Colors
export const networkColor = (network: string) => {
  switch (network) {
    case 'mainnet':
      return COLOR_GREEN_FLOW_DARKMODE_00EF8B;
    case 'testnet':
      return COLOR_ORANGE_WARNING_FF8A00;
  }
  return COLOR_GREEN_FLOW_DARKMODE_00EF8B;
};
