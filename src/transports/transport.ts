import { BaseMessage, MessageTypes, MessageData } from '../types';
import { deferredPromise, DeferredPromise } from '../utils';

interface EventData {
  message: BaseMessage;
  open: undefined;
  close: undefined;
  error: Error;
}

export interface TransportProvider {
  transport: Transport;
}

export class Transport {
  private ongoingReads: DeferredPromise<BaseMessage>[] = [];

  private _isClosed = false;
  public get isClosed(): boolean {
    return this.isClosed;
  }

  private eventListeners: Record<keyof EventData, ((...data: unknown[]) => void)[]> = {
    message: [],
    open: [],
    close: [],
    error: [],
  };

  /**
   * An exception indicates that the transport has been closed and there will be no more messages
   * to read on this transport.
   */
  async read() {
    if (this._isClosed) {
      throw Error('closed');
    }
    const deferred = deferredPromise<BaseMessage>();
    this.ongoingReads.push(deferred);
    return deferred.promise;
  }

  write(payload: BaseMessage) {
    this._dispatchEvent('message', payload);
  }

  open() {
    this._dispatchEvent('open', undefined);
  }

  close(err?: Error) {
    if (this._isClosed) {
      return;
    }
    this._isClosed = true;
    err ? this._dispatchEvent('error', err) : this._dispatchEvent('close', undefined);
    this.ongoingReads.forEach(deferred => deferred.reject(new Error('closed')));
    this.ongoingReads = [];
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
  _send<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    this.ongoingReads.forEach(deferred => deferred.resolve([messageType, ...data]));
    this.ongoingReads = [];
  }

  private _dispatchEvent<T extends keyof EventData>(type: T, data: EventData[T]) {
    (this.eventListeners[type] as ((data: EventData[T]) => void)[]).forEach(callback => callback(data));
  }
}
