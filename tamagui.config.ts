import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';

const tamaguiConfig = createTamagui(defaultConfig);

export default tamaguiConfig;

export type TamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
