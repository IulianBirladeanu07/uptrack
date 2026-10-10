import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';
import { diffPastSteps } from './stepStats';
import type { DailySteps, DateInput } from '../../../shared/types';

export const STEPS_BACKFILL_FROM = '2026-01-01';

export const diffSteps = diffPastSteps;

export const chunkRange = (start: DateInput, end: DateInput, days = 30): [Date, Date][] => {
  const out: [Date, Date][] = [];
  const e = new Date(end);
  const c = new Date(start);
  c.setHours(0, 0, 0, 0);
  while (c <= e) {
    const n = new Date(c);
    n.setDate(n.getDate() + days - 1);
    n.setHours(23, 59, 59, 999);
    out.push([new Date(c), n > e ? new Date(e) : n]);
    c.setDate(c.getDate() + days);
  }
  return out;
};

export const persistDailySteps = async (
  uid: string | null | undefined,
  entries: DailySteps | null | undefined,
  markBackfilled = false,
): Promise<boolean> => {
  const has = entries && Object.keys(entries).length > 0;
  if (!uid || (!has && !markBackfilled)) return false;
  await setDoc(
    doc(db, 'users', uid),
    {
      ...(has ? { dailySteps: entries } : {}),
      ...(markBackfilled ? { stepsBackfilledAt: new Date().toISOString() } : {}),
    },
    { merge: true }
  );
  return true;
};
