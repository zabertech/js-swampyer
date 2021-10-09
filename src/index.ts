// TODO make sure that all usage of this type is justified
type UnknownObject = Record<string | number | symbol, unknown>;

enum AuthMethod {
  Cookie = 'cookie',
  Ticket = 'ticket',
  Anonymous = 'anonymous',
}

enum MessageTypes {
  Hello = 1,
  Welcome = 2,
  Abort = 3,
  Challenge = 4,
  Authenticate = 5,
  Goodbye = 6,
  Error = 8,

  Publish = 16,
  Published = 17,

  Subscribe = 32,
  Subscribed = 33,
  Unsubscribe = 34,
  Unsubscribed = 35,
  Event = 36,

  Call = 48,
  Result = 50,

  Register = 64,
  Registered = 65,
  Unregister = 66,
  Unregistered = 67,
  Invocation = 68,
  Yield = 70,
}

type BaseMessage = [MessageTypes, ...unknown[]];
interface MessageData {
  [MessageTypes.Hello]: [realm: string, details: Record<string, unknown> ];
  [MessageTypes.Welcome]: [sessionId: number, details: Record<string, unknown>];
  [MessageTypes.Abort]: [details: UnknownObject, reason: string];
  [MessageTypes.Challenge]: [authMethod: AuthMethod, extra: Record<string, unknown>];
  [MessageTypes.Authenticate]: [signature: string, extra: Record<string, unknown>];
  [MessageTypes.Goodbye]: unknown[];
  [MessageTypes.Error]: [
    requestMessageType: MessageTypes, requestId: number, details: UnknownObject, error: string,
    args: unknown[], kwargs: UnknownObject
  ];
  [MessageTypes.Publish]: [requestId: number, options: PublishOptions, topic: string, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Published]: [requestId: number, publicationId: number];
  [MessageTypes.Subscribe]: [requestId: number, options: UnknownObject, topic: string];
  [MessageTypes.Subscribed]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribe]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribed]: [requestId: number];
  [MessageTypes.Event]: [subscriptionId: number, publishId: number, details: UnknownObject, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Call]: [requestId: number, options: UnknownObject, procedure: string, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Result]: [requestId: number, details: UnknownObject, resultArray: unknown[], resultObj: UnknownObject];
  [MessageTypes.Register]: [requestId: number, details: UnknownObject, procedure: string];
  [MessageTypes.Registered]: [requestId: number, registrationId: number];
  [MessageTypes.Unregister]: [requestId: number, registrationId: number];
  [MessageTypes.Unregistered]: [requestId: number];
  [MessageTypes.Invocation]: [requestId: number, registrationId: number, details: UnknownObject, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Yield]: [requestId: number, options: UnknownObject, args: unknown[], kwargs: UnknownObject];
  // TODO properly define the unknown[] types
}

interface SwampyerOptions {
  url: string;
  realm: string;
  authid: string;
  authmethods: AuthMethod[]
  onchallenge?: (authMethod: AuthMethod) => string;
}

type SubscriptionHandler = (args: unknown[], kwargs: UnknownObject) => void;
type RegistrationHandler = (args: unknown[], kwargs: UnknownObject) => void;

interface PublishOptions {
  acknowledge?: boolean;
}

// TODO implement timeout for these deferred promises
interface DeferredPromise<T> {
  resolve: (value: T) => void;
  reject: (value: unknown) => void;
  promise: Promise<T>;
}
function deferredPromise<T>(): DeferredPromise<T> {
  const deferInstance: Partial<DeferredPromise<T>> = {};
  deferInstance.promise = new Promise<T>((resolve, reject) => {
    deferInstance.resolve = resolve;
    deferInstance.reject = reject;
  });
  return deferInstance as DeferredPromise<T>;
}

function generateRandomInt() {
  return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
}

class Swampyer {
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

  async open() {
    this.socket = new WebSocket(this.options.url, ['wamp.2.json']);
    const deferred = deferredPromise<void>();

    const openListenerCleanup = this.addEventListener('open', () => {
      this.sendMessage(MessageTypes.Hello, [this.options.realm, {
        authid: this.options.authid,
        agent: 'swampyer-js',
        authmethods: this.options.authmethods || ['anonymous'],
        roles: {
          subscriber: {},
          publisher: {},
          caller: {},
          callee: {},
        }
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

    this.onCloseCleanup.push(this.addEventListener('message', this.handleEvents.bind(this)));

    deferred.promise
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

  async register(uri: string, handler: RegistrationHandler): Promise<number> {
    const requestId = this.registrationRequestId;
    this.registrationRequestId += 1;
    const [ , registrationId] = await this.sendRequest(MessageTypes.Register, [requestId, {}, uri], MessageTypes.Registered);
    this.registrationHandlers[registrationId] = handler;
    return registrationId;
  }

  async unregister(registrationId: number): Promise<void> {
    const requestId = this.unregistrationRequestId;
    this.unregistrationRequestId += 1;
    await this.sendRequest(MessageTypes.Unregister, [requestId, registrationId], MessageTypes.Unregistered);
    delete this.registrationHandlers[registrationId];
  }

  async call(uri: string, args: unknown[] = [], kwargs: UnknownObject = {}): Promise<unknown> {
    const requestId = this.callRequestId;
    this.callRequestId += 1;
    const [ , , resultArray ] = await this.sendRequest(MessageTypes.Call, [requestId, {}, uri, args, kwargs], MessageTypes.Result);
    return resultArray[0];
  }

  async subscribe(uri: string, handler: SubscriptionHandler): Promise<number> {
    const requestId = generateRandomInt();
    const [ , subscriptionId] = await this.sendRequest(MessageTypes.Subscribe, [requestId, {}, uri], MessageTypes.Subscribed);
    this.subscriptionHandlers[subscriptionId] = handler;
    return subscriptionId;
  }

  async unsubscribe(subscriptionId: number): Promise<void> {
    const requestId = generateRandomInt();
    await this.sendRequest(MessageTypes.Unsubscribe, [requestId, subscriptionId], MessageTypes.Unsubscribed);
    delete this.subscriptionHandlers[subscriptionId];
  }

  async publish(uri: string, args: unknown[] = [], kwargs: UnknownObject = {}, options: PublishOptions = {}): Promise<void> {
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
    // TODO Make sure socket is open and ready for use
    if (!this.socket) {
      throw Error('Socket has not been opened yet')
    }
    this.socket.addEventListener(type, listener);
    return () => this.socket?.removeEventListener(type, listener);
  }

  private sendMessage<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    // TODO Make sure socket is open and ready for use
    if (!this.socket) {
      throw Error('Socket has not been opened yet')
    }
    this.socket.send(JSON.stringify([messageType, ...data]));
  }

  /**
   * Assumes that `pyaload[0]` is the `requestId` for the given request
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
        try {
          const handler = this.registrationHandlers[registrationId];
          if (!handler) {
            this.sendMessage(
              MessageTypes.Error,
              [MessageTypes.Invocation, requestId, {}, 'com.error.unavailable', ['No handler available for this request'], {}]
            );
          } else {
            const result = handler(args, kwargs);
            this.sendMessage(MessageTypes.Yield, [requestId, {}, [result], {}]);
          }
        } catch (e) {
          this.sendMessage(MessageTypes.Error, [MessageTypes.Invocation, requestId, {}, '', [e], {}])
        }
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
}
