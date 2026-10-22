/** Rejects if `promise` does not settle within `ms`. Non-thenables are treated as already resolved. */
export const withTimeout = <T>(promise: PromiseLike<T> | T, ms: number): Promise<T> => {
  const settled = Promise.resolve(promise);
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(Object.assign(new Error('Request timed out'), { code: 'deadline-exceeded' }));
    }, ms);
    settled.then(
      value => {
        clearTimeout(id);
        resolve(value);
      },
      error => {
        clearTimeout(id);
        reject(error);
      },
    );
  });
};

export const SAVE_TIMEOUT_MS = 12_000;
