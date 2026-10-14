import { StyleSheet } from 'react-native';
import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import { normalize } from '../hooks/useResponsive';

type AnyStyle = ViewStyle & TextStyle & ImageStyle;

const sizeProps = [
  'fontSize', 'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
  'padding', 'paddingVertical', 'paddingHorizontal',
  'paddingTop', 'paddingBottom', 'paddingLeft', 'paddingRight',
  'margin', 'marginVertical', 'marginHorizontal',
  'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
  'borderRadius', 'borderWidth', 'borderTopWidth', 'borderBottomWidth',
  'borderLeftWidth', 'borderRightWidth', 'borderTopLeftRadius', 'borderTopRightRadius',
  'borderBottomLeftRadius', 'borderBottomRightRadius',
  'gap', 'rowGap', 'columnGap',
  'top', 'bottom', 'left', 'right',
  'letterSpacing', 'lineHeight',
] as const;

const normalizeStyle = (style: AnyStyle): AnyStyle => {
  const normalized: AnyStyle = { ...style };

  sizeProps.forEach(prop => {
    const value = normalized[prop];
    if (typeof value === 'number') {
      normalized[prop] = normalize(value);
    }
  });

  const offset = normalized.shadowOffset;
  if (offset) {
    normalized.shadowOffset = {
      width: normalize(offset.width),
      height: normalize(offset.height),
    };
  }

  if (typeof normalized.elevation === 'number') {
    normalized.elevation = normalize(normalized.elevation);
  }

  return normalized;
};

export const createStyles = <T extends StyleSheet.NamedStyles<T>>(stylesFn: () => T): T => {
  const styles = stylesFn();
  const normalized: Record<string, AnyStyle> = {};

  for (const [key, style] of Object.entries(styles)) {
    normalized[key] = normalizeStyle(style as AnyStyle);
  }

  return StyleSheet.create(normalized as T);
};
