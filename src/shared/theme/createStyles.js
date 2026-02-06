import { StyleSheet } from 'react-native';
import { normalize } from '../hooks/useResponsive';

export const createStyles = (stylesFn) => {
  const styles = stylesFn();
  const normalized = {};
  
  for (const [key, style] of Object.entries(styles)) {
    normalized[key] = normalizeStyle(style);
  }
  
  return StyleSheet.create(normalized);
};

const normalizeStyle = (style) => {
  const normalized = { ...style };
  
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
  ];
  
  sizeProps.forEach(prop => {
    if (normalized[prop] !== undefined && typeof normalized[prop] === 'number') {
      normalized[prop] = normalize(normalized[prop]);
    }
  });
  
  if (normalized.shadowOffset) {
    normalized.shadowOffset = {
      width: typeof normalized.shadowOffset.width === 'number' 
        ? normalize(normalized.shadowOffset.width) 
        : normalized.shadowOffset.width,
      height: typeof normalized.shadowOffset.height === 'number'
        ? normalize(normalized.shadowOffset.height)
        : normalized.shadowOffset.height,
    };
  }
  
  if (normalized.elevation !== undefined && typeof normalized.elevation === 'number') {
    normalized.elevation = normalize(normalized.elevation);
  }
  
  return normalized;
};