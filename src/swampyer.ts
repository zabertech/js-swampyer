import { AbortError, ConnectionOpenError, ConnectionClosedError, SwampyerError, SwampyerOperationError, TransportError } from './errors';
import type { Transport, TransportProvider } from './transports/transport';
import {
  WampMessage, MessageData, MessageTypes, PublishOptions, RegistrationHandler, SubscriptionHandler, WelcomeDetails,
  OpenOptions, RegisterOptions, CallOptions, SubscribeOptions, CloseReason, CloseDetails, CloseEventData, AutoReconnectionOpenOptions
} from './types';
import { generateRandomInt, deferredPromise, SimpleEventEmitter } from './utils';

export const DEFAULT_RECONNECTION_DELAYS = [1, 10, 100, 1000, 2000, 4000, 8000, 16000, 32000];
function defaultGetReconnectionDelay(attempt: number) {
  return DEFAULT_RECONNECTION_DELAYS[Math.min(attempt - 1, DEFAULT_RECONNECTION_DELAYS.length - 1)];
}
function defaultStopAutoReconnection() {
  return false;
}

export class Swampyer {
  private transport: Transport | undefined;
  private sessionId: number | undefined;
  private uriBase?: string;
  private isClosing = false;
  private _isReconnecting = false;

  private callRequestId = 1;
  private publishRequestId = 1;
  private registrationRequestId = 1;
  private unregistrationRequestId = 1;

  private subscriptionHandlers: { [subscriptionId: number]: SubscriptionHandler } = {};
  private registrationHandlers: { [registrationId: number]: RegistrationHandler } = {};

  private onCloseCleanup: (() => void)[] = [];

  private _openEvent = new SimpleEventEmitter<[WelcomeDetails]>();
  private _closeEvent = new SimpleEventEmitter<CloseEventData>();
  private _closeMethodCallEvent = new SimpleEventEmitter();

  public readonly openEvent = this._openEvent.publicObject;
  public readonly closeEvent = this._closeEvent.publicObject;

  public get isOpen() {
    return !!this.sessionId;
  }

  public get isReconnecting() {
    return this._isReconnecting;
  }

  /**
   * Open a WAMP connection that will automatically reconnect in case of failure or closure.
   *
   * @param getTransportProvider A function that should return a fresh TransportProvider for each
   * reconnection attempt.
   *
   * The `attempt` argument for this callback will be `0` for the initial connection attempt.
   * For all reconnection attempts, the `attempt` value will start from `1`.
   * @param options The options for configuring the WAMP connection
   */
  openAutoReconnect(
    getTransportProvider: (attempt: number, ...closeData: Partial<CloseEventData>) => TransportProvider,
    options: AutoReconnectionOpenOptions
  ): void {
    this.throwIfCannotOpen();

    void (async () => {
      let transportProvider = getTransportProvider(0);
      let attempt = 1;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        this._open(transportProvider, options)
          .then(() => {
            this._isReconnecting = false;
            attempt = 1;
          })
          .catch(() => { /* Not used */ });

        const [closeReason, closeDetails] = await this.closeEvent.waitForNext();
        this._isReconnecting = true;

        if (closeReason === 'close_method') {
          this._isReconnecting = false;
          return;
        }

        const { autoReconnectionDelay = defaultGetReconnectionDelay, stopAutoReconnection = defaultStopAutoReconnection } = options;
        const delay = autoReconnectionDelay(attempt, closeReason, closeDetails);
        const shouldStop = stopAutoReconnection(attempt, closeReason, closeDetails);
        if (shouldStop) {
          this._isReconnecting = false;
          return;
        }

        const raceResult = await Promise.race([
          new Promise<'delay'>(resolve => setTimeout(() => resolve('delay'), delay)),
          this._closeMethodCallEvent.waitForNext().then<'close_method'>(() => 'close_method'),
        ]);
        if (raceResult === 'close_method') {
          this._isReconnecting = false;
          return;
        }

        transportProvider = getTransportProvider(attempt, closeReason, closeDetails);
        attempt++;
      }
    })();
  }

  /**
   * Open a WAMP connection.
   *
   * The library will **not** try to automatically reconnect if the operation fails or if the
   * connection gets closed.
   *
   * @param transportProvider The transport provider to open the WAMP connection through
   * @param options The options for configuing the WAMP connection
   * @returns Details about the successful WAMP session
   */
  async open(transportProvider: TransportProvider, options: OpenOptions): Promise<WelcomeDetails> {
    this.throwIfCannotOpen();
    return this._open(transportProvider, options);
  }

  private async _open(transportProvider: TransportProvider, options: OpenOptions): Promise<WelcomeDetails> {
    this.uriBase = options.uriBase;

    this.transport = transportProvider.transport;
    const deferred = deferredPromise<WelcomeDetails>();

    const openListenerCleanup = this.transport.openEvent.addEventListener(() => {
      this.transport!._send(MessageTypes.Hello, [options.realm, {
        authid: options.auth?.authId,
        agent: options.agent || 'swampyer-js',
        authmethods: options.auth?.authMethods || ['anonymous'],
        roles: { subscriber: {}, publisher: {}, caller: {}, callee: {} },
      }]);
    });

    const errorListenerCleanup = this.transport.closeEvent.addEventListener(error => {
      deferred.reject(error ?? new TransportError('The transport was closed'));
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
          deferred.reject(new AbortError(reason, details));
          break;
        }
        case MessageTypes.Challenge: {
          const [authMethod] = data as MessageData[MessageTypes.Challenge];
          const errorReason = 'wamp.error.cannot_authenticate';
          if (options.auth?.onChallenge) {
            Promise.resolve()
              .then(() => options.auth!.onChallenge(authMethod))
              .then(authData => this.transport!._send(MessageTypes.Authenticate, [authData, {}]))
              .catch(e => {
                const details = { message: `An exception occured in onChallenge handler: ${String(e)}` };
                this.transport!._send(MessageTypes.Abort, [details, errorReason]);
                deferred.reject(new AbortError(errorReason, details));
              });
          } else {
            const details = { message: 'A onChallenge handler is not defined' };
            this.transport!._send(MessageTypes.Abort, [details, errorReason]);
            deferred.reject(new AbortError(errorReason, details));
          }
          break;
        }
      }
    });

    transportProvider.open();

    deferred.promise
      .then(details => {
        this.onCloseCleanup.push(this.transport!.messageEvent.addEventListener(this.handleEvents.bind(this)));
        this.onCloseCleanup.push(this.transport!.closeEvent.addEventListener(
          error => this.resetState(error ? 'transport_error' : 'transport_close', { error })
        ));
        this._openEvent.emit(details);
      })
      .catch(error => {
        this.resetState('open_error', { error });
      })
      .finally(() => {
        openListenerCleanup();
        errorListenerCleanup();
        messageListenerCleanup();
      });
    return deferred.promise;
  }

  /**
   * Close the WAMP connection
   *
   * @param reason The reason for the closure
   * @param message Some descriptive message about why the connection is being closed
   */
  async close(reason = 'wamp.close.system_shutdown', message?: string): Promise<void> {
    if (this._isReconnecting) {
      this._closeMethodCallEvent.emit();
      this.resetState('close_method');
      return;
    }

    if (!this.isOpen) {
      throw new SwampyerError('The connection is not open and can not be closed');
    }

    this.isClosing = true;
    this.transport!._send(MessageTypes.Goodbye, [message ? { message } : {}, reason]);
    const deferred = deferredPromise<void>();
    const messageListenerCleanup = this.transport!.messageEvent.addEventListener(([messageType]) => {
      if (messageType === MessageTypes.Goodbye) {
        deferred.resolve();
      }
    });

    deferred.promise.catch(() => { /* Not used */ }).finally(() => {
      messageListenerCleanup();
      this.resetState('close_method');
    });
    return deferred.promise;
  }

  /**
   * Register a callback for a WAMP URI
   *
   * **NOTE**: The library will try to forward as much data as possible from the error
   * thrown by the {@link handler} function to the caller via the `kwargs`. Make sure that the
   * errors do not contain any sensitive information.
   *
   * @param uri The URI to register for.
   *
   * If the `uriBase` options was defined when opening the connection then `uriBase` will be
   * prepended to the provided URI (unless the appropriate value is set in `options`)
   * @param handler The callback function that will handle invocations for this uri
   * @param options Settings for how the registration should be done. This may vary across WAMP servers
   * @returns The registration ID (useful for unregistering)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async register<R = any, A extends any[] = any, K = any>(
    uri: string, handler: RegistrationHandler<R, A, K>, options: RegisterOptions = {}
  ): Promise<number> {
    this.throwIfNotOpen();
    const fullUri = options.withoutUriBase ? uri : this.getFullUri(uri);
    const requestId = this.registrationRequestId;
    this.registrationRequestId += 1;
    const [, registrationId] = await this.sendRequest(MessageTypes.Register, [requestId, options, fullUri], MessageTypes.Registered);
    this.registrationHandlers[registrationId] = handler;
    return registrationId;
  }

  /**
   * Unregister an existing registration
   *
   * @param registrationId The registration ID returned by {@link register register()}
   */
  async unregister(registrationId: number): Promise<void> {
    this.throwIfNotOpen();
    const requestId = this.unregistrationRequestId;
    this.unregistrationRequestId += 1;
    await this.sendRequest(MessageTypes.Unregister, [requestId, registrationId], MessageTypes.Unregistered);
    delete this.registrationHandlers[registrationId];
  }

  /**
   * Call a WAMP URI and get its result
   *
   * @param uri The WAMP URI to call
   *
   * If the `uriBase` options was defined when opening the connection then `uriBase` will be
   * prepended to the provided URI (unless the appropriate value is set in `options`)
   * @param args Positional arguments
   * @param kwargs Keyword arguments
   * @param options Settings for how the registration should be done. This may vary between WAMP servers
   * @returns Arbitrary data returned by the call operation
   */
  async call(uri: string, args: unknown[] = [], kwargs: Object = {}, options: CallOptions = {}): Promise<unknown> {
    this.throwIfNotOpen();
    const fullUri = options.withoutUriBase ? uri : this.getFullUri(uri);
    const requestId = this.callRequestId;
    this.callRequestId += 1;
    const [, , resultArray] = await this.sendRequest(MessageTypes.Call, [requestId, options, fullUri, args, kwargs], MessageTypes.Result);
    return resultArray[0];
  }

  /**
   * Subscribe to publish events on a given WAMP URI
   *
   * @param uri The URI to subscribe to
   *
   * If the `uriBase` options was defined when opening the connection then `uriBase` will be
   * prepended to the provided URI (unless the appropriate value is set in `options`)
   * @param handler The callback function that will handle subscription events for this uri
   * @param options Settings for how the subscription should be done. This may vary across WAMP servers
   * @returns The subscription ID (useful for unsubscribing)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async subscribe<A extends any[] = any, K = any>(
    uri: string, handler: SubscriptionHandler<A, K>, options: SubscribeOptions = {}
  ): Promise<number> {
    this.throwIfNotOpen();
    const fullUri = options.withoutUriBase ? uri : this.getFullUri(uri);
    const requestId = generateRandomInt();
    const [, subscriptionId] = await this.sendRequest(MessageTypes.Subscribe, [requestId, options, fullUri], MessageTypes.Subscribed);
    this.subscriptionHandlers[subscriptionId] = handler;
    return subscriptionId;
  }

  /**
   * Unsubscribe from an existing subscription
   *
   * @param registrationId The subscription ID returned by {@link subscribe subscribe()}
   */
  async unsubscribe(subscriptionId: number): Promise<void> {
    this.throwIfNotOpen();
    const requestId = generateRandomInt();
    await this.sendRequest(MessageTypes.Unsubscribe, [requestId, subscriptionId], MessageTypes.Unsubscribed);
    delete this.subscriptionHandlers[subscriptionId];
  }

  /**
   * Publish an event on the given WAMP URI
   *
   * @param uri The WAMP URI to publish the event for
   *
   * If the `uriBase` options was defined when opening the connection then `uriBase` will be
   * prepended to the provided URI (unless the appropriate value is set in `options`)
   * @param args Positional arguments
   * @param kwargs Keyword arguments
   * @param options Settings for how the registration should be done. This may vary between WAMP servers
   */
  async publish(uri: string, args: unknown[] = [], kwargs: Object = {}, options: PublishOptions = {}): Promise<void> {
    this.throwIfNotOpen();
    const fullUri = options.withoutUriBase ? uri : this.getFullUri(uri);
    const requestId = this.publishRequestId;
    this.publishRequestId += 1;

    const payload: MessageData[MessageTypes.Publish] = [requestId, options, fullUri, args, kwargs];
    if (options.acknowledge) {
      await this.sendRequest(MessageTypes.Publish, payload, MessageTypes.Published);
    } else {
      this.transport!._send(MessageTypes.Publish, payload);
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
        const [, , details, error, args, kwargs] = data as MessageData[MessageTypes.Error];
        deferred.reject(new SwampyerOperationError(details, error, args, kwargs));
        return;
      }

      if (messageType === MessageTypes.Goodbye) {
        const [details, reason] = data as MessageData[MessageTypes.Goodbye];
        deferred.reject(new ConnectionClosedError(reason, details));
        return;
      }
    });

    deferred.promise.catch(() => { /* Not used */ }).finally(messageListenerCleanup);
    return deferred.promise;
  }

  private handleEvents([messageType, ...data]: WampMessage) {
    switch (messageType) {
      case MessageTypes.Event: {
        const [subscriptionId, , details, args, kwargs] = data as MessageData[MessageTypes.Event];
        try {
          this.subscriptionHandlers[subscriptionId]?.(args, kwargs, details);
        } catch (e) { /* Do nothing */ }
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
          Promise.resolve((async () => handler(args, kwargs, details))())
            .then(result => this.transport!._send(MessageTypes.Yield, [requestId, {}, [result], {}]))
            .catch(e => this.transport!._send(
              MessageTypes.Error,
              [
                MessageTypes.Invocation, requestId, {}, 'error.invoke.failure',
                [String(e)],
                { errorDetails: JSON.parse(JSON.stringify(e)) },
              ]
            ));
        }
        break;
      }
      case MessageTypes.Goodbye: {
        if (!this.isClosing) {
          const [details, reason] = data as MessageData[MessageTypes.Goodbye];
          this.transport!._send(MessageTypes.Goodbye, [{}, 'wamp.close.goodbye_and_out']);
          this.resetState('goodbye', { goodbye: { details, reason } });
        }
        break;
      }
    }
  }

  private resetState(reason: CloseReason, details: CloseDetails = {}) {
    if (this.isOpen || reason === 'open_error') {
      this._closeEvent.emit(reason, details);
    }

    this.sessionId = undefined;
    this.isClosing = false;

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
      throw new SwampyerError('The connection is not open');
    }
  }

  private throwIfCannotOpen() {
    if (this.isOpen) {
      throw new ConnectionOpenError('The connection is already open');
    } else if (this._isReconnecting) {
      throw new ConnectionOpenError('The connection is currently being automatically reconnected');
    } else if (this.transport) {
      throw new ConnectionOpenError('The connection is currently being opened');
    }
  }

  private getFullUri(uri: string) {
    return this.uriBase ? `${this.uriBase}.${uri}` : uri;
  }
}
