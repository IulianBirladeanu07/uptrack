import { diffSteps, persistDailySteps, restorePendingSteps } from '../helpers/stepsSyncService';
import { recomputeChangedWeeklySteps, type StepStats } from '../helpers/stepStats';
import { formatDate } from '../utils/dateUtils';
import { isCurrentUserRequest } from '../utils/userRequest';
import type { DailySteps, UserData, WeeklySnapshot } from '../../../shared/types';

type StepsFlusherSource = {
    getUid: () => string | undefined;
    getUserData: () => UserData | null;
    getGeneration: () => number;
};

const writtenFields = (stats: StepStats): Pick<WeeklySnapshot, 'daysLoggedSteps' | 'avgSteps' | 'totalSteps'> => ({
    daysLoggedSteps: stats.days,
    avgSteps: stats.avg,
    totalSteps: stats.total,
});

export class StepsFlusher {
    private pending: DailySteps = {};
    private written: DailySteps = {};
    private writtenWeeklySteps: Record<string, StepStats> = {};
    private flushingGeneration: number | null = null;
    private readonly source: StepsFlusherSource;

    constructor(source: StepsFlusherSource) {
        this.source = source;
    }

    queue(entries: DailySteps): void {
        this.pending = { ...this.pending, ...entries };
    }

    reset(): void {
        this.pending = {};
        this.written = {};
        this.writtenWeeklySteps = {};
    }

    async flush(): Promise<void> {
        const uid = this.source.getUid();
        const ud = this.source.getUserData();
        const generation = this.source.getGeneration();
        if (!uid || !ud || (ud.uid && ud.uid !== uid) || this.flushingGeneration === generation) return;
        const incoming = this.pending;
        if (!Object.keys(incoming).length) return;
        const stored = { ...(ud.dailySteps || {}), ...this.written };
        const todayKey = formatDate(new Date());
        const toWrite = diffSteps(stored, incoming, todayKey);
        this.pending = {};
        const mergedDailySteps = { ...stored, ...toWrite };
        const weeklyNutrition = (ud.weeklyNutrition || []).map(snapshot => {
            const written = this.writtenWeeklySteps[snapshot.weekStart];
            return written ? { ...snapshot, ...writtenFields(written) } : snapshot;
        });
        const syncedPastDates = Object.keys(incoming).filter(date => date < todayKey);
        const weeklyUpdate = recomputeChangedWeeklySteps(weeklyNutrition, mergedDailySteps, syncedPastDates);
        if (!Object.keys(toWrite).length && !weeklyUpdate) return;
        this.flushingGeneration = generation;
        const isCurrent = () => isCurrentUserRequest({ uid, generation }, this.source.getUid(), this.source.getGeneration());
        try {
            if (weeklyUpdate) {
                await persistDailySteps(uid, toWrite, false, weeklyUpdate.weeklyNutrition);
            } else {
                await persistDailySteps(uid, toWrite);
            }
            if (isCurrent()) {
                this.written = { ...this.written, ...toWrite };
                if (weeklyUpdate) {
                    this.writtenWeeklySteps = { ...this.writtenWeeklySteps, ...weeklyUpdate.changed };
                }
            }
        } catch (e) {
            if (isCurrent()) {
                this.pending = restorePendingSteps(toWrite, this.pending);
                console.error('persistDailySteps error:', e);
            }
        } finally {
            if (this.flushingGeneration === generation) this.flushingGeneration = null;
        }
    }
}
