import { RequestTracker } from './requestTracker';

describe('RequestTracker', () => {
  it('ignores requests invalidated by a newer query or clear', () => {
    const tracker = new RequestTracker();
    const pending = tracker.begin();

    tracker.invalidate();

    expect(tracker.isCurrent(pending)).toBe(false);
  });

  it('only accepts the latest request', () => {
    const tracker = new RequestTracker();
    const first = tracker.begin();
    const second = tracker.begin();

    expect(tracker.isCurrent(first)).toBe(false);
    expect(tracker.isCurrent(second)).toBe(true);
  });
});
