import { WampMessage, MessageTypes, MessageData } from '../types';
import { deferredPromise, DeferredPromise, SimpleEventEmitter } from '../utils';

export interface TransportProvider {
  open: () => void;
  transport: Transport;
}

export class Transport {
  private ongoingReads: DeferredPromise<WampMessage>[] = [];
  private sendQueue: WampMessage[] = [];

  private _isClosed = false;
  public get isClosed(): boolean {
    return this.isClosed;
  }

  private _messageEvent = new SimpleEventEmitter<[message: WampMessage]>();
  private _openEvent = new SimpleEventEmitter();
  private _closeEvent = new SimpleEventEmitter<[error?: Error]>();

  public readonly messageEvent = this._messageEvent.publicObject;
  public readonly openEvent = this._openEvent.publicObject;
  public readonly closeEvent = this._closeEvent.publicObject;

  /**
   * An exception indicates that the transport has been closed and there will be no more messages
   * to read on this transport.
   */
  async read(): Promise<WampMessage> {
    if (this._isClosed) {
      throw Error('closed');
    }
    if (this.sendQueue.length) {
      return this.sendQueue.shift() as WampMessage;
    }
    const deferred = deferredPromise<WampMessage>();
    this.ongoingReads.push(deferred);
    return deferred.promise;
  }

  write(payload: WampMessage) {
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
    this._closeEvent.emit(err);
    this.ongoingReads.forEach(deferred => deferred.reject(new Error('closed')));
    this.ongoingReads = [];
  }

  /**
   * For use by the library
   */
  _send<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    const message: WampMessage = [messageType, ...data];
    if (this.ongoingReads.length) {
      this.ongoingReads.forEach(deferred => deferred.resolve(message));
      this.ongoingReads = [];
    } else {
      this.sendQueue.push(message);
    }
  }
}
