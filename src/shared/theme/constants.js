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

export const MUSCLE_GROUP_COLORS = {
  Back: '#3B82F6',
  Biceps: '#8B5CF6',
  Calves: '#F59E0B',
  Chest: '#EF4444',
  Core: '#10B981',
  Glutes: '#F97316',
  Hamstring: '#84CC16',
  Legs: '#06B6D4',
  Quads: '#8B5CF6',
  Shoulders: '#F59E0B',
  Triceps: '#EF4444',
  'Full Body': '#DC2626',
};

export const FALLBACK_MUSCLE_COLORS = [
  '#FF8535', '#00D4FF', '#10B981', '#F59E0B',
  '#EF4444', '#3B82F6', '#A3E635', '#F97316', '#BE185D',
];