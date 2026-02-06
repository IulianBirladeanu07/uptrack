import { normalize } from '../hooks/useResponsive';

export const LIST = {
  ITEM_HEIGHT: normalize(80),
  HEADER_HEIGHT: normalize(48),
  INITIAL_ITEMS_COUNT: 3,
};

export const EMPTY_STATE = {
  ICON_SIZE: normalize(64),
};

export const SWIPE = {
  DELETE_THRESHOLD: -80,
  ACTIVE_OFFSET: 8,
  SPRING_CONFIG: { damping: 20, stiffness: 300 },
  TIMING_CONFIG: { duration: 150 },
  CONTAINER_SCALE_REDUCTION: 0.02,
  TRASH_ICON_SCALE: 0.15,
  TRASH_ICON_ROTATION: 90,
};

export const PRESS = {
  SCALE: 0.98,
  DURATION: 100,
};

export const FOOD_NAME = {
  MAX_LENGTH: 35,
  TRUNCATE_THRESHOLD: 0.6,
};

export const SEARCH = {
  MAX_RECENT: 5,
  STORAGE_KEY: '@recent_searches',
};