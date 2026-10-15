import { isCurrentUserRequest } from './userRequest';

describe('isCurrentUserRequest', () => {
  it('accepts a request only for the current account generation', () => {
    const request = { uid: 'user-a', generation: 3 };

    expect(isCurrentUserRequest(request, 'user-a', 3)).toBe(true);
    expect(isCurrentUserRequest(request, 'user-b', 3)).toBe(false);
    expect(isCurrentUserRequest(request, 'user-a', 4)).toBe(false);
    expect(isCurrentUserRequest(request, null, 3)).toBe(false);
  });
});
