type ColorType = string | string[] | undefined;

export const getIconColor = (color: ColorType, index: number, defaultColor: string): string => {
  return color ? (typeof color === 'string' ? color : color[index] || defaultColor) : defaultColor;
};
