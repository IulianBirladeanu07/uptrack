import { parseDismissedAdjustmentTimestamps } from './homeDismissalStorage';

describe('parseDismissedAdjustmentTimestamps', () => {
  it('returns only string timestamps from an array', () => {
    expect(parseDismissedAdjustmentTimestamps('["a", 2, null, "b"]')).toEqual(['a', 'b']);
  });

  it('returns an empty array when there is no stored value', () => {
    expect(parseDismissedAdjustmentTimestamps(null)).toEqual([]);
  });

  it('rejects malformed or unexpected stored data', () => {
    expect(parseDismissedAdjustmentTimestamps('{')).toBeNull();
    expect(parseDismissedAdjustmentTimestamps('null')).toBeNull();
    expect(parseDismissedAdjustmentTimestamps('{"dismissed":[]}')).toBeNull();
  });
});
