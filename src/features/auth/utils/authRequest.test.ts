import { isCurrentAuthRequest } from './authRequest';

describe('isCurrentAuthRequest', () => {
  it('accepts the latest request for the current uid, including signed-out state', () => {
    expect(isCurrentAuthRequest({ uid: 'user-a', generation: 2 }, 'user-a', 2)).toBe(true);
    expect(isCurrentAuthRequest({ uid: null, generation: 3 }, null, 3)).toBe(true);
  });

  it('rejects requests from an earlier auth event or another uid', () => {
    expect(isCurrentAuthRequest({ uid: 'user-a', generation: 2 }, 'user-a', 3)).toBe(false);
    expect(isCurrentAuthRequest({ uid: 'user-a', generation: 2 }, 'user-b', 2)).toBe(false);
    expect(isCurrentAuthRequest({ uid: 'user-a', generation: 2 }, null, 2)).toBe(false);
  });
});
