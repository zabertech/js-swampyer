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
  [MessageTypes.Publish]: [requestId: number, options: UnknownObject, topic: string, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Published]: [requestId: number, publicationId: number];
  [MessageTypes.Subscribe]: [requestId: number, options: UnknownObject, topic: string];
  [MessageTypes.Subscribed]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribe]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribed]: [requestId: number];
  [MessageTypes.Event]: [subscriptionId: number, publishId: number, details: UnknownObject, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Call]: [requestId: number, options: UnknownObject, procedure: string, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Result]: [requestId: number, details: UnknownObject, resultArray: unknown[], resultObj: UnknownObject];
  [MessageTypes.Register]: unknown[];
  [MessageTypes.Registered]: unknown[];
  [MessageTypes.Unregister]: unknown[];
  [MessageTypes.Unregistered]: unknown[];
  [MessageTypes.Invocation]: unknown[];
  [MessageTypes.Yield]: unknown[];
  // TODO properly define the unknown[]
}

interface SwampyerOptions {
  url: string;
  realm: string;
  authid: string;
  authmethods: AuthMethod[]
  onchallenge?: (authMethod: AuthMethod) => string;
}

type SubscriptionHandler = (args: unknown[], kwargs: UnknownObject) => void;

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
  private socket: WebSocket;
  private sessionId: number;

  private callRequestId = 1;
  private publisRequestId = 1;

  private deferredPromises = {
    unsubscribe: {} as { [requestId: number]: DeferredPromise<void> },
    publish: {} as { [requestId: number]: DeferredPromise<void> },
  }

  private subscriptionHandlers: { [subscriptionId: number]: SubscriptionHandler } = {};

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
          const authData = this.options.onchallenge?.(authMethod);
          this.sendMessage(MessageTypes.Authenticate, [authData, {}]);
          break;
        }
      }
    });

    deferred.promise.catch(() => {}).finally(() => {
      openListenerCleanup();
      errorListenerCleanup();
      messageListenerCleanup();
    });

    return deferred.promise;
  }

  private addEventListener<K extends keyof WebSocketEventMap>(type: K, listener: (this: WebSocket, ev: WebSocketEventMap[K]) => any) {
    // TODO Make sure socket is open and ready for use
    this.socket.addEventListener(type, listener);
    return () => this.socket.removeEventListener(type, listener);
  }

  private sendMessage<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    // TODO Make sure socket is open and ready for use
    this.socket.send(JSON.stringify([messageType, ...data]));
  }

  private messageHandler(event: MessageEvent<string>) {
    const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;
    switch (messageType) {
      case MessageTypes.Event: {
        const [subscriptionId, publishId, details, args, kwargs] = data as MessageData[MessageTypes.Event];
        this.subscriptionHandlers[subscriptionId]?.(args, kwargs);
        break;
      }
      case MessageTypes.Published: {
        const [requestId] = data as MessageData[MessageTypes.Published];
        this.deferredPromises.publish[requestId]?.resolve();
        delete this.deferredPromises.publish[requestId];
        break;
      }
      case MessageTypes.Error: {
        const [requestMessageType, requestId, details, error, args, kwargs] = data as MessageData[MessageTypes.Error];
        switch(requestMessageType) {
          case MessageTypes.Publish: {
            this.deferredPromises.publish[requestId]?.reject({ details, error, args, kwargs });
            delete this.deferredPromises.publish[requestId];
            break;
          }
        }
        break;
      }
    }
  }

  async call(uri: string, args: unknown[] = [], kwargs: UnknownObject = {}): Promise<unknown> {
    const requestId = this.callRequestId;
    this.callRequestId += 1;

    const deferred = deferredPromise<unknown>();
    this.sendMessage(MessageTypes.Call, [requestId, {}, uri, args, kwargs]);

    const messageListenerCleanup = this.addEventListener('message', event => {
      const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;

      if (messageType === MessageTypes.Result && data[0] === requestId) {
        const [ , , resultArray ] = data as MessageData[MessageTypes.Result];
        deferred.resolve(resultArray[0]);
        return;
      }

      if (messageType === MessageTypes.Error && data[0] === MessageTypes.Call && data[1] === requestId) {
        const [ , , details, error, args, kwargs] = data as MessageData[MessageTypes.Error];
        deferred.reject({ details, error, args, kwargs });
        return;
      }
    });

    deferred.promise.catch(() => {}).finally(messageListenerCleanup);
    return deferred.promise;
  }

  async subscribe(uri: string, handler: SubscriptionHandler): Promise<number> {
    const requestId = generateRandomInt();
    const deferred = deferredPromise<number>();

    this.sendMessage(MessageTypes.Subscribe, [requestId, {}, uri]);

    const messageListenerCleanup = this.addEventListener('message', event => {
      const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;

      if (messageType === MessageTypes.Subscribed && data[0] === requestId) {
        const [ , subscriptionId] = data as MessageData[MessageTypes.Subscribed];
        this.subscriptionHandlers[subscriptionId] = handler;
        deferred.resolve(subscriptionId);
        return;
      }

      if (messageType === MessageTypes.Error && data[0] === MessageTypes.Subscribe && data[1] === requestId) {
        const [ , , details, error, args, kwargs] = data as MessageData[MessageTypes.Error];
        deferred.reject({ details, error, args, kwargs });
        return;
      }
    });

    deferred.promise.catch(() => {}).finally(messageListenerCleanup);
    return deferred.promise;
  }

  async unsubscribe(subscriptionId: number): Promise<void> {
    const requestId = generateRandomInt();
    const deferred = deferredPromise<void>();

    this.sendMessage(MessageTypes.Unsubscribe, [requestId, subscriptionId]);

    const messageListenerCleanup = this.addEventListener('message', event => {
      const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;

      if (messageType === MessageTypes.Unsubscribed && data[0] === requestId) {
        deferred.resolve();
        return;
      }

      if (messageType === MessageTypes.Error && data[0] === MessageTypes.Unsubscribe && data[1] === requestId) {
        const [ , , details, error, args, kwargs] = data as MessageData[MessageTypes.Error];
        deferred.reject({ details, error, args, kwargs });
        return;
      }
    });

    deferred.promise.catch(() => {}).finally(messageListenerCleanup);
    return deferred.promise;
  }

  // TODO get options object as argument with `acknowledge` in it
  async publish(uri: string, args: unknown[] = [], kwargs: UnknownObject = {}): Promise<void> {
    const requestId = this.callRequestId;
    this.callRequestId += 1;

    // TODO do not bother with deferred promises if `options.acknowledge` is not true
    const deferrd = deferredPromise<void>();
    this.deferredPromises.publish[requestId] = deferrd;
    // TODO do not enforce `acknowledge`
    this.sendMessage(MessageTypes.Publish, [requestId, { acknowledge: true }, uri, args, kwargs]);

    return deferrd.promise;
  }
}
