import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../auth/services/firebaseConfigService';

export const STEPS_BACKFILL_FROM = '2026-01-01';
export const TODAY_WRITE_INTERVAL_MS = 10 * 60 * 1000;

export const diffSteps = (stored, incoming) => {
  const out = {};
  const s = stored || {};
  Object.entries(incoming || {}).forEach(([k, v]) => {
    const n = Math.round(Number(v));
    if (n > 0 && s[k] !== n) out[k] = n;
  });
  return out;
};

export const chunkRange = (start, end, days = 30) => {
  const out = [];
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

export const persistDailySteps = async (uid, entries, markBackfilled = false) => {
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
