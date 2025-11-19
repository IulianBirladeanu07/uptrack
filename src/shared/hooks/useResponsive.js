import { Dimensions, PixelRatio, Platform } from 'react-native';

const screen = Dimensions.get('screen');
const SCREEN_WIDTH = screen.width;
const SCREEN_HEIGHT = screen.height;

const baseWidth = 428;
const baseHeight = 926;

const SCALE_MULTIPLIER = 0.95;

export const normalize = (size) => {
  const scaleWidth = SCREEN_WIDTH / baseWidth;
  const scaleHeight = SCREEN_HEIGHT / baseHeight;
  const scale = Math.min(scaleWidth, scaleHeight);
  
  // Apply multiplier to reduce the scale
  const adjustedScale = scale * SCALE_MULTIPLIER;
  
  const newSize = size * adjustedScale;
  
  if (Platform.OS === 'ios') {
    return Math.round(newSize);
  }
  
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};