const mockCalls = [];
const mockStore = { setDocError: null };

jest.mock('firebase/firestore', () => ({
  doc: jest.fn((db, name, id) => ({ name, id })),
  setDoc: jest.fn(async (ref, payload, opts) => {
    mockCalls.push({ ref, payload, opts });
    if (mockStore.setDocError) throw mockStore.setDocError;
  }),
}));
jest.mock('./firebaseConfigService', () => ({ db: {} }));

import { syncAuthEmail } from './emailSyncService';

beforeEach(() => {
  mockCalls.length = 0;
  mockStore.setDocError = null;
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  console.error.mockRestore();
});

describe('syncAuthEmail', () => {
  it('copies a changed Auth email into the user document', async () => {
    const data = { email: 'old@x.co', username: 'u' };
    const result = await syncAuthEmail('u1', 'new@x.co', data);
    expect(result).toEqual({ email: 'new@x.co', username: 'u' });
    expect(mockCalls).toEqual([{ ref: { name: 'users', id: 'u1' }, payload: { email: 'new@x.co' }, opts: { merge: true } }]);
  });

  it('fills in a missing email', async () => {
    const result = await syncAuthEmail('u1', 'a@x.co', {});
    expect(result).toEqual({ email: 'a@x.co' });
    expect(mockCalls).toHaveLength(1);
  });

  it('writes nothing when the emails match', async () => {
    const data = { email: 'a@x.co' };
    expect(await syncAuthEmail('u1', 'a@x.co', data)).toBe(data);
    expect(mockCalls).toHaveLength(0);
  });

  it('writes nothing when Auth has no email', async () => {
    const data = { email: 'a@x.co' };
    expect(await syncAuthEmail('u1', null, data)).toBe(data);
    expect(await syncAuthEmail('u1', undefined, data)).toBe(data);
    expect(await syncAuthEmail('u1', '', data)).toBe(data);
    expect(mockCalls).toHaveLength(0);
  });

  it('returns the data unchanged when the write fails', async () => {
    mockStore.setDocError = new Error('denied');
    const data = { email: 'old@x.co' };
    expect(await syncAuthEmail('u1', 'new@x.co', data)).toBe(data);
  });
});
