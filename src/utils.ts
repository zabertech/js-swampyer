export interface DeferredPromise<T> {
  resolve: (value: T) => void;
  reject: (value: unknown) => void;
  promise: Promise<T>;
}

export function deferredPromise<T>(): DeferredPromise<T> {
  const deferInstance: Partial<DeferredPromise<T>> = {};
  deferInstance.promise = new Promise<T>((resolve, reject) => {
    deferInstance.resolve = resolve;
    deferInstance.reject = reject;
  });
  return deferInstance as DeferredPromise<T>;
}

export function generateRandomInt() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

export class SimpleEventEmitter<Data extends unknown[] = []> {
  private callbackId = 1;
  private callbacks: Record<number, (...args: Data) => void> = {};

  public readonly publicObject = { addEventListener: this.addEventListener.bind(this) };

  addEventListener(callback: (...args: Data) => void) {
    const id = this.callbackId;
    this.callbackId += 1;
    this.callbacks[id] = callback;
    return () => {
      delete this.callbacks[id];
    }
  }

  emit(...data: Data) {
    Object.values(this.callbacks).forEach(callback => callback(...data));
  }
}

export async function waitUntilPass(callback: () => void, maxRetries = 100): Promise<void> {
  for (let i = 0; i <= maxRetries; i += 1) {
    try {
      callback();
      return;
    } catch (e) {
      if (i >= maxRetries) {
        throw e;
      }
      await Promise.resolve();
    }
  }
}
