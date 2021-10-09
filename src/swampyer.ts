import {
  AuthMethod, BaseMessage, MessageData, MessageTypes, PublishOptions, RegistrationHandler, SubscriptionHandler, UnknownObject
} from './types';
import { generateRandomInt, deferredPromise } from './utils';

export interface SwampyerOptions {
  url: string;
  realm: string;
  authid: string;
  authmethods: AuthMethod[]
  onchallenge?: (authMethod: AuthMethod) => string;
  onopen?: () => void;
}

export class Swampyer {
  private socket: WebSocket | undefined;
  private sessionId: number | undefined;

  private callRequestId = 1;
  private publishRequestId = 1;
  private registrationRequestId = 1;
  private unregistrationRequestId = 1;

  private subscriptionHandlers: { [subscriptionId: number]: SubscriptionHandler } = {};
  private registrationHandlers: { [registrationId: number]: RegistrationHandler } = {};

  private onCloseCleanup: (() => void)[] = [];

  public get isOpen() {
    return !!this.sessionId;
  }

  constructor(private readonly options: SwampyerOptions) {}

  async open(): Promise<void> {
    if (this.isOpen) {
      throw Error('The connection is already open');
    } else if (this.socket) {
      throw Error('The connection is currently being opened');
    }

    this.socket = new WebSocket(this.options.url, ['wamp.2.json']);
    const deferred = deferredPromise<void>();

    const openListenerCleanup = this.addEventListener('open', () => {
      this.sendMessage(MessageTypes.Hello, [this.options.realm, {
        authid: this.options.authid,
        agent: 'swampyer-js',
        authmethods: this.options.authmethods || ['anonymous'],
        roles: {subscriber: {}, publisher: {}, caller: {}, callee: {}}
      }]);
    });

    const errorListenerCleanup = this.addEventListener('error', () => {
      // TODO create the error object properly
      deferred.reject(new Error('An error ocurred while opening the WebSocket connection'));
    });

    const messageListenerCleanup = this.addEventListener('message', event => {
      const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;
      switch (messageType) {
        case MessageTypes.Welcome: {
          const [sessionId] = data as MessageData[MessageTypes.Welcome];
          this.sessionId = sessionId;
          deferred.resolve();
          break;
        }
        case MessageTypes.Abort: {
          const [details, reason] = data as MessageData[MessageTypes.Abort];
          deferred.reject({ details, reason });
          break;
        }
        case MessageTypes.Challenge: {
          const [authMethod] = data as MessageData[MessageTypes.Challenge];
          const authData = this.options.onchallenge?.(authMethod) ?? '';
          this.sendMessage(MessageTypes.Authenticate, [authData, {}]);
          break;
        }
      }
    });

    deferred.promise
      .then(() => {
        this.onCloseCleanup.push(this.addEventListener('message', this.handleEvents.bind(this)));
        this.onCloseCleanup.push(this.addEventListener('error', () => this.resetState())); // TODO emit `close` event
        this.onCloseCleanup.push(this.addEventListener('close', () => this.resetState())); // TODO emit `close` event
        this.options.onopen?.();
      })
      .catch(() => {
        this.resetState();
      })
      .finally(() => {
        openListenerCleanup();
        errorListenerCleanup();
        messageListenerCleanup();
      });
    return deferred.promise;
  }

  async close(): Promise<void> {
    if (!this.isOpen) {
      throw Error('The connection is not open and can not be closed');
    }

    this.sendMessage(MessageTypes.Goodbye, [{}, 'wamp.close.system_shutdown']);
    const deferred = deferredPromise<void>();
    const messageListenerCleanup = this.addEventListener('message', event => {
      const [messageType] = JSON.parse(event.data) as BaseMessage;
      if (messageType === MessageTypes.Goodbye) {
        deferred.resolve();
      }
    });

    deferred.promise.catch(() => {}).finally(() => {
      messageListenerCleanup();
      this.resetState();
      // TODO emit `close` event
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
      this.sendMessage(MessageTypes.Publish, payload);
    } else {
      await this.sendRequest(MessageTypes.Publish, payload, MessageTypes.Published)
    }
  }

  private addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any) {
    if (!this.socket) {
      throw Error('Socket has not been opened yet')
      // TODO emit error event or close everything instead
    }
    this.socket.addEventListener(type, listener);
    return () => this.socket?.removeEventListener(type, listener);
  }

  private sendMessage<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    if (!this.socket) {
      throw Error('Socket has not been opened yet')
      // TODO emit error event or close everything instead
    }
    this.socket.send(JSON.stringify([messageType, ...data]));
  }

  /**
   * Assumes that `payload[0]` is the `requestId` for the given request
   */
  private sendRequest<T extends MessageTypes, U extends MessageTypes>(
    requestType: T, requestPayload: MessageData[T], awaitMessageType: U
  ): Promise<MessageData[U]> {
    const requestId = requestPayload[0];
    const deferred = deferredPromise<MessageData[U]>();
    this.sendMessage(requestType, requestPayload);

    const messageListenerCleanup = this.addEventListener('message', event => {
      const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;

      if (messageType === awaitMessageType && data[0] === requestId) {
        deferred.resolve(data as MessageData[U]);
        return;
      }

      if (messageType === MessageTypes.Error && data[0] === requestType && data[1] === requestId) {
        const [ , , details, error, args, kwargs] = data as MessageData[MessageTypes.Error];
        deferred.reject({ details, error, args, kwargs });
        return;
      }
    });

    deferred.promise.catch(() => {}).finally(messageListenerCleanup);
    return deferred.promise;
  }

  private handleEvents(event: MessageEvent<string>) {
    const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;
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
          this.sendMessage(
            MessageTypes.Error,
            [MessageTypes.Invocation, requestId, {}, 'com.error.unavailable', ['No handler available for this request'], {}]
          );
        } else {
          try {
            const result = handler(args, kwargs);
            this.sendMessage(MessageTypes.Yield, [requestId, {}, [result], {}]);
          } catch (e) {
            this.sendMessage(MessageTypes.Error, [MessageTypes.Invocation, requestId, {}, 'error.invoke.failed', [e], {}])
          }
        }
        break;
      }
      case MessageTypes.Goodbye: {
        const [details, reason] = data as MessageData[MessageTypes.Goodbye];
        console.log('GOODBYE EVENT', details, reason);
        this.sendMessage(MessageTypes.Goodbye, [{}, 'wamp.close.goodbye_and_out']);
        this.resetState();
        // TODO emit `close` event
        break;
      }
    }
  }

  private resetState() {
    this.sessionId = undefined;

    this.onCloseCleanup.forEach(cleanupFunc => { cleanupFunc() });
    this.onCloseCleanup = [];

    this.socket?.close();
    this.socket = undefined;

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
