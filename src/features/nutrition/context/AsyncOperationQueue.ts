export class AsyncOperationQueue {
  private queues = new Map<string, Promise<void>>();

  run<T>(key: string, operation: () => Promise<T>): Promise<T> {
    const previous = this.queues.get(key) || Promise.resolve();
    const run = previous.then(operation, operation);
    const settled = run.then(() => undefined, () => undefined);
    this.queues.set(key, settled);
    void settled.then(() => {
      if (this.queues.get(key) === settled) this.queues.delete(key);
    });
    return run;
  }
}
