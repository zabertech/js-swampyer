import type { Transport, TransportProvider } from './transports/transport';
import {
  WampMessage, MessageData, MessageTypes, PublishOptions, RegistrationHandler, SubscriptionHandler, UnknownObject, WelcomeDetails
} from './types';
import { generateRandomInt, deferredPromise, SimpleEventEmitter } from './utils';

export interface SwampyerOptions {
  realm: string;
  /**
   * Optional authentication data
   * 
   * If this is not defined then the library will try to authenticate using the `anonymous`
   * `authMethod`
   */
  auth?: {
    /**
     * The username or ID to authenticate as.
     * 
     * This value depends on the `authMethods` selected and the settings of your WAMP server.
     */
    authId: string;
    /**
     * Could be values like `anonymous`, `ticket`, `cookie`, etc.
     * 
     * Refer to your WAMP server's settings to find out which auth methods are supported.
     */
    authMethods: string[];
    /**
     * Handle authentication challenge from the WAMP server.
     * 
     * Depending on the auth method requested by the server, this could return things like the
     * password of the user we are trying to authenticate as.
     */
    onChallenge: (authMethod: string) => string;
  }
}

export class Swampyer {
  private transport: Transport | undefined;
  private sessionId: number | undefined;

  private callRequestId = 1;
  private publishRequestId = 1;
  private registrationRequestId = 1;
  private unregistrationRequestId = 1;

  private subscriptionHandlers: { [subscriptionId: number]: SubscriptionHandler } = {};
  private registrationHandlers: { [registrationId: number]: RegistrationHandler } = {};

  private onCloseCleanup: (() => void)[] = [];

  private _openEvent = new SimpleEventEmitter<[WelcomeDetails]>();
  private _closeEvent = new SimpleEventEmitter<[error?: Error]>();

  public readonly openEvent = this._openEvent.publicObject;
  public readonly closeEvent = this._closeEvent.publicObject;

  public get isOpen() {
    return !!this.sessionId;
  }

  constructor(private readonly options: SwampyerOptions) {}

  async open(transportProvider: TransportProvider): Promise<WelcomeDetails> {
    if (this.isOpen) {
      throw Error('The connection is already open');
    } else if (this.transport) {
      throw Error('The connection is currently being opened');
    }

    this.transport = transportProvider.transport;
    const deferred = deferredPromise<WelcomeDetails>();

    const openListenerCleanup = this.transport.openEvent.addEventListener(() => {
      this.transport!._send(MessageTypes.Hello, [this.options.realm, {
        authid: this.options.auth?.authId,
        agent: 'swampyer-js',
        authmethods: this.options.auth?.authMethods || ['anonymous'],
        roles: {subscriber: {}, publisher: {}, caller: {}, callee: {}},
      }]);
    });

    const errorListenerCleanup = this.transport.closeEvent.addEventListener(error => {
      deferred.reject(error || new Error('The transport was closed'))
    });

    const messageListenerCleanup = this.transport.messageEvent.addEventListener(([messageType, ...data]) => {
      switch (messageType) {
        case MessageTypes.Welcome: {
          const [sessionId, details] = data as MessageData[MessageTypes.Welcome];
          this.sessionId = sessionId;
          deferred.resolve(details);
          break;
        }
        case MessageTypes.Abort: {
          const [details, reason] = data as MessageData[MessageTypes.Abort];
          deferred.reject({ details, reason });
          break;
        }
        case MessageTypes.Challenge: {
          const [authMethod] = data as MessageData[MessageTypes.Challenge];
          const errorReason = 'wamp.error.cannot_authenticate';
          if (this.options.auth?.onChallenge) {
            try {
              const authData = this.options.auth.onChallenge(authMethod);
              this.transport!._send(MessageTypes.Authenticate, [authData, {}]);
            } catch (e) {
              const details = { message: 'An exception occured in onChallenge handler' };
              this.transport!._send(MessageTypes.Abort, [details, errorReason]);
              deferred.reject({ details, reason: errorReason });
            }
          } else {
            const details = { message: 'An onChallenge handler is not defined' };
            this.transport!._send(MessageTypes.Abort, [details, errorReason]);
            deferred.reject({ details, reason: errorReason });
          }
          break;
        }
      }
    });

    transportProvider.open();

    deferred.promise
      .then(details => {
        this.onCloseCleanup.push(this.transport!.messageEvent.addEventListener(this.handleEvents.bind(this)));
        this.onCloseCleanup.push(this.transport!.closeEvent.addEventListener(error => this.resetState(error)));
        this._openEvent.emit(details);
      })
      .catch(error => {
        this.resetState(error);
      })
      .finally(() => {
        openListenerCleanup();
        errorListenerCleanup();
        messageListenerCleanup();
      });
    return deferred.promise;
  }

  async close(reason = 'wamp.close.system_shutdown', message?: string): Promise<void> {
    if (!this.isOpen) {
      throw Error('The connection is not open and can not be closed');
    }

    this.transport!._send(MessageTypes.Goodbye, [message ? { message } : {}, reason]);
    const deferred = deferredPromise<void>();
    const messageListenerCleanup = this.transport!.messageEvent.addEventListener(([messageType]) => {
      if (messageType === MessageTypes.Goodbye) {
        deferred.resolve();
      }
    });

    deferred.promise.catch(() => {}).finally(() => {
      messageListenerCleanup();
      this.resetState();
    });
    return deferred.promise;
  }

  async register(uri: string, handler: RegistrationHandler): Promise<number> {
    this.throwIfNotOpen();
    const requestId = this.registrationRequestId;
    this.registrationRequestId += 1;
    const [ , registrationId] = await this.sendRequest(MessageTypes.Register, [requestId, {}, uri], MessageTypes.Registered);
    this.registrationHandlers[registrationId] = handler;
    return registrationId;
  }

  async unregister(registrationId: number): Promise<void> {
    this.throwIfNotOpen();
    const requestId = this.unregistrationRequestId;
    this.unregistrationRequestId += 1;
    await this.sendRequest(MessageTypes.Unregister, [requestId, registrationId], MessageTypes.Unregistered);
    delete this.registrationHandlers[registrationId];
  }

  async call(uri: string, args: unknown[] = [], kwargs: UnknownObject = {}): Promise<unknown> {
    this.throwIfNotOpen();
    const requestId = this.callRequestId;
    this.callRequestId += 1;
    const [ , , resultArray ] = await this.sendRequest(MessageTypes.Call, [requestId, {}, uri, args, kwargs], MessageTypes.Result);
    return resultArray[0];
  }

  async subscribe(uri: string, handler: SubscriptionHandler): Promise<number> {
    this.throwIfNotOpen();
    const requestId = generateRandomInt();
    const [ , subscriptionId] = await this.sendRequest(MessageTypes.Subscribe, [requestId, {}, uri], MessageTypes.Subscribed);
    this.subscriptionHandlers[subscriptionId] = handler;
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: number): Promise<void> {
    this.throwIfNotOpen();
    const requestId = generateRandomInt();
    await this.sendRequest(MessageTypes.Unsubscribe, [requestId, subscriptionId], MessageTypes.Unsubscribed);
    delete this.subscriptionHandlers[subscriptionId];
  }

  async publish(uri: string, args: unknown[] = [], kwargs: UnknownObject = {}, options: PublishOptions = {}): Promise<void> {
    this.throwIfNotOpen();
    const requestId = this.publishRequestId;
    this.publishRequestId += 1;

    const payload: MessageData[MessageTypes.Publish] = [requestId, options, uri, args, kwargs];
    if (options.acknowledge) {
      this.transport!._send(MessageTypes.Publish, payload);
    } else {
      await this.sendRequest(MessageTypes.Publish, payload, MessageTypes.Published)
    }
  }

  /**
   * Assumes that `payload[0]` is the `requestId` for the given request
   */
  private sendRequest<T extends MessageTypes, U extends MessageTypes>(
    requestType: T, requestPayload: MessageData[T], awaitMessageType: U
  ): Promise<MessageData[U]> {
    this.throwIfNotOpen();
    const requestId = requestPayload[0];
    const deferred = deferredPromise<MessageData[U]>();
    this.transport!._send(requestType, requestPayload);

    const messageListenerCleanup = this.transport?.messageEvent.addEventListener(([messageType, ...data]) => {
      if (messageType === awaitMessageType && data[0] === requestId) {
        deferred.resolve(data as MessageData[U]);
        return;
      }

      if (messageType === MessageTypes.Error && data[0] === requestType && data[1] === requestId) {
        const [ , , details, error, args, kwargs] = data as MessageData[MessageTypes.Error];
        deferred.reject({ details, error, args, kwargs });
        return;
      }

      if (messageType === MessageTypes.Goodbye) {
        const [details, reason] = data as MessageData[MessageTypes.Goodbye];
        deferred.reject({ details, reason });
        return;
      }
    });

    deferred.promise.catch(() => {}).finally(messageListenerCleanup);
    return deferred.promise;
  }

  private handleEvents([messageType, ...data]: WampMessage) {
    switch (messageType) {
      case MessageTypes.Event: {
        const [subscriptionId, publishId, details, args, kwargs] = data as MessageData[MessageTypes.Event];
        this.subscriptionHandlers[subscriptionId]?.(args, kwargs);
        break;
      }
      case MessageTypes.Invocation: {
        const [requestId, registrationId, details, args, kwargs] = data as MessageData[MessageTypes.Invocation];
        const handler = this.registrationHandlers[registrationId];
        if (!handler) {
          this.transport!._send(
            MessageTypes.Error,
            [MessageTypes.Invocation, requestId, {}, 'com.error.unavailable', ['No handler available for this request'], {}]
          );
        } else {
          try {
            const result = handler(args, kwargs);
            this.transport!._send(MessageTypes.Yield, [requestId, {}, [result], {}]);
          } catch (e) {
            this.transport!._send(MessageTypes.Error, [MessageTypes.Invocation, requestId, {}, 'error.invoke.failed', [e], {}])
          }
        }
        break;
      }
      case MessageTypes.Goodbye: {
        const [details, reason] = data as MessageData[MessageTypes.Goodbye];
        console.log('GOODBYE EVENT', details, reason);
        this.transport!._send(MessageTypes.Goodbye, [{}, 'wamp.close.goodbye_and_out']);
        this.resetState();
        break;
      }
    }
  }

  private resetState(error?: Error) {
    if (this.isOpen) {
      this._closeEvent.emit(error);
    }

    this.sessionId = undefined;

    this.onCloseCleanup.forEach(cleanupFunc => { cleanupFunc() });
    this.onCloseCleanup = [];

    this.transport?.close();
    this.transport = undefined;

    this.callRequestId = 1;
    this.publishRequestId = 1;
    this.registrationRequestId = 1;
    this.unregistrationRequestId = 1;

    this.subscriptionHandlers = {};
    this.registrationHandlers = {};
  }

  private throwIfNotOpen() {
    if (!this.isOpen) {
      throw Error('The connection is not open');
    }
  }
}
