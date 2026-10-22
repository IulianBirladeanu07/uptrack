/** Rejects if `promise` does not settle within `ms`. */
export const withTimeout = <T>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => {
      reject(Object.assign(new Error('Request timed out'), { code: 'deadline-exceeded' }));
    }, ms);
    promise.then(
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

export const SAVE_TIMEOUT_MS = 12_000;
