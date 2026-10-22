import { withTimeout } from './withTimeout';

describe('withTimeout', () => {
  test('resolves when the promise finishes in time', async () => {
    await expect(withTimeout(Promise.resolve(7), 100)).resolves.toBe(7);
  });

  test('rejects with deadline-exceeded when the promise is too slow', async () => {
    await expect(
      withTimeout(new Promise(() => {}), 20),
    ).rejects.toMatchObject({ code: 'deadline-exceeded' });
  });

  test('rejects with the original error when the promise fails first', async () => {
    await expect(
      withTimeout(Promise.reject(Object.assign(new Error('nope'), { code: 'x' })), 100),
    ).rejects.toMatchObject({ code: 'x', message: 'nope' });
  });
});
