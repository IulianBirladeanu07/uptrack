jest.mock('firebase/firestore', () => ({}));
jest.mock('@react-native-async-storage/async-storage', () => ({}));
jest.mock('../../auth/services/firebaseConfigService', () => ({ db: {} }));

import { WeightService } from './weightService';

describe('WeightService date handling', () => {
  it('treats date-only strings as local dates when finding the week start', () => {
    expect(WeightService.getWeekStartDate('2026-10-15')).toEqual(new Date(2026, 9, 12));
  });
});
