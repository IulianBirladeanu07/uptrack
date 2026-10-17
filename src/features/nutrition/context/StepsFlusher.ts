import { diffSteps, persistDailySteps, restorePendingSteps } from '../helpers/stepsSyncService';
import { formatDate } from '../utils/dateUtils';
import { isCurrentUserRequest } from '../utils/userRequest';
import type { DailySteps, UserData } from '../../../shared/types';

type StepsFlusherSource = {
    getUid: () => string | undefined;
    getUserData: () => UserData | null;
    getGeneration: () => number;
};

export class StepsFlusher {
    private pending: DailySteps = {};
    private written: DailySteps = {};
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
    }

    async flush(): Promise<void> {
        const uid = this.source.getUid();
        const ud = this.source.getUserData();
        const generation = this.source.getGeneration();
        if (!uid || !ud || (ud.uid && ud.uid !== uid) || this.flushingGeneration === generation) return;
        const incoming = this.pending;
        if (!Object.keys(incoming).length) return;
        const stored = { ...(ud.dailySteps || {}), ...this.written };
        const toWrite = diffSteps(stored, incoming, formatDate(new Date()));
        this.pending = {};
        if (!Object.keys(toWrite).length) return;
        this.flushingGeneration = generation;
        const isCurrent = () => isCurrentUserRequest({ uid, generation }, this.source.getUid(), this.source.getGeneration());
        try {
            await persistDailySteps(uid, toWrite);
            if (isCurrent()) {
                this.written = { ...this.written, ...toWrite };
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
