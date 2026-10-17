import { Alert } from 'react-native';
import { formatDate } from '../utils/dateUtils';
import { loadSelectedDateMeals } from './selectedDateMealLoad';

type SelectedDateMealChangeOperations = {
  selectDate: (date: Date) => void;
  getCurrentUserUid: () => string | undefined;
  hasCachedMeals: (dateKey: string) => boolean;
  ensureDayLoaded: (dateKey: string, uid: string) => Promise<void>;
  isCurrentRequest: (uid: string, dateKey: string) => boolean;
  onLoaded: (date: Date) => void;
};

export const handleSelectedDateChange = (
  date: Date,
  operations: SelectedDateMealChangeOperations,
): void => {
  operations.selectDate(date);
  const uid = operations.getCurrentUserUid();
  const dateKey = formatDate(date);
  if (!uid || operations.hasCachedMeals(dateKey)) return;

  void loadSelectedDateMeals(
    () => operations.ensureDayLoaded(dateKey, uid),
    () => operations.isCurrentRequest(uid, dateKey),
    () => operations.onLoaded(date),
    error => {
      console.error('load day failed:', error);
      Alert.alert('Unable to load meals', 'Could not load meals for this date. Check your connection and try again.');
    },
  );
};
