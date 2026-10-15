import { AsyncOperationQueue } from './AsyncOperationQueue';

describe('AsyncOperationQueue', () => {
  it('serializes operations with the same key and continues after a rejection', async () => {
    const queue = new AsyncOperationQueue();
    let releaseFirst!: () => void;
    const first = queue.run('user-day-meal', () => new Promise<void>(resolve => {
      releaseFirst = resolve;
    }));
    const secondOperation = jest.fn().mockResolvedValue('saved');
    const second = queue.run('user-day-meal', secondOperation);

    await Promise.resolve();
    expect(secondOperation).not.toHaveBeenCalled();
    releaseFirst();
    await expect(first).resolves.toBeUndefined();
    await expect(second).resolves.toBe('saved');
    expect(secondOperation).toHaveBeenCalledTimes(1);

    await expect(queue.run('user-day-meal', () => Promise.reject(new Error('write failed'))))
      .rejects.toThrow('write failed');
    await expect(queue.run('user-day-meal', async () => 'retry')).resolves.toBe('retry');
  });

  it('does not block operations with different keys', async () => {
    const queue = new AsyncOperationQueue();
    let releaseFirst!: () => void;
    const first = queue.run('user-a-day-meal', () => new Promise<void>(resolve => {
      releaseFirst = resolve;
    }));
    const second = queue.run('user-b-day-meal', async () => 'saved');

    await expect(second).resolves.toBe('saved');
    releaseFirst();
    await first;
  });

  it('runs the next mutation against state restored after a failed write', async () => {
    const queue = new AsyncOperationQueue();
    const writes: string[][] = [];
    let foods = ['existing'];
    const save = jest.fn(async (nextFoods: string[]) => {
      if (nextFoods.includes('failed')) throw new Error('write failed');
      writes.push(nextFoods);
    });
    const mutateAndSave = (food: string) => queue.run('user-day-meal', async () => {
      const previous = foods;
      const next = [...foods, food];
      foods = next;
      try {
        await save(next);
        return next;
      } catch (error) {
        foods = previous;
        throw error;
      }
    });

    const failed = mutateAndSave('failed');
    const later = mutateAndSave('kept');

    await expect(failed).rejects.toThrow('write failed');
    await expect(later).resolves.toEqual(['existing', 'kept']);
    expect(foods).toEqual(['existing', 'kept']);
    expect(writes).toEqual([['existing', 'kept']]);
  });
});
