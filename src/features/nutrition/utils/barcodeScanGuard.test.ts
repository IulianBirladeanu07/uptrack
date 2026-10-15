import { BarcodeScanGuard } from './barcodeScanGuard';

describe('BarcodeScanGuard', () => {
  it('rejects overlapping scans and accepts another after release', () => {
    const guard = new BarcodeScanGuard();

    expect(guard.acquire()).toBe(true);
    expect(guard.acquire()).toBe(false);
    guard.release();
    expect(guard.acquire()).toBe(true);
  });
});
