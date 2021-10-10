import { deferredPromise, DeferredPromise } from '../utils';

interface EventData {
  message: unknown[];
  open: undefined;
  close: undefined;
  error: Error;
}

export interface TransportProvider {
  transport: Transport;
}

export class Transport {
  private ongoingReads: DeferredPromise<unknown[]>[] = [];

  private eventListeners: Record<keyof EventData, ((...data: unknown[]) => void)[]> = {
    message: [],
    open: [],
    close: [],
    error: [],
  };

  async read() {
    const deferred = deferredPromise<unknown[]>();
    this.ongoingReads.push(deferred);
    return deferred.promise;
  }

  write(payload: unknown[]) {
    this._dispatchEvent('message', payload);
  }

  open() {
    this._dispatchEvent('open', undefined);
  }

  close(err?: Error) {
    err ? this._dispatchEvent('error', err) : this._dispatchEvent('close', undefined);
  }

  /**
   * For use by the library
   */
  _addEventListener<T extends keyof EventData>(type: T, callback: (data: EventData[T]) => void) {
    (this.eventListeners[type] as ((data: EventData[T]) => void)[]).push(callback);
    return () => {
      this.eventListeners[type] = this.eventListeners[type].filter(storedCallback => storedCallback !== callback)
    }
  }

  /**
   * For use by the library
   */
  _send(payload: unknown[]) {
    this.ongoingReads.forEach(deferred => deferred.resolve(payload));
    this.ongoingReads = [];
  }

  private _dispatchEvent<T extends keyof EventData>(type: T, data: EventData[T]) {
    (this.eventListeners[type] as ((data: EventData[T]) => void)[]).forEach(callback => callback(data));
  }
}
