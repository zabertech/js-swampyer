import { BaseMessage, MessageTypes, MessageData } from '../types';
import { deferredPromise, DeferredPromise, SimpleEventEmitter } from '../utils';

export interface TransportProvider {
  transport: Transport;
}

export class Transport {
  private ongoingReads: DeferredPromise<BaseMessage>[] = [];

  private _isClosed = false;
  public get isClosed(): boolean {
    return this.isClosed;
  }

  private _messageEvent = new SimpleEventEmitter<[message: BaseMessage]>();
  private _openEvent = new SimpleEventEmitter();
  private _closeEvent = new SimpleEventEmitter();
  private _errorEvent = new SimpleEventEmitter<[error: Error]>();

  public readonly messageEvent = this._messageEvent.protectedAccessObject;
  public readonly openEvent = this._openEvent.protectedAccessObject;
  public readonly closeEvent = this._closeEvent.protectedAccessObject;
  public readonly errorEvent = this._errorEvent.protectedAccessObject;

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
    this._messageEvent.emit(payload);
  }

  open() {
    this._openEvent.emit();
  }

  close(err?: Error) {
    if (this._isClosed) {
      return;
    }
    this._isClosed = true;
    err ? this._errorEvent.emit(err) : this._closeEvent.emit();
    this.ongoingReads.forEach(deferred => deferred.reject(new Error('closed')));
    this.ongoingReads = [];
  }

  /**
   * For use by the library
   */
  _send<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    this.ongoingReads.forEach(deferred => deferred.resolve([messageType, ...data]));
    this.ongoingReads = [];
  }
}
