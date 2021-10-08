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
  [MessageTypes.Abort]: unknown[];
  [MessageTypes.Challenge]: [authMethod: AuthMethod, extra: Record<string, unknown>];
  [MessageTypes.Authenticate]: [signature: string, extra: Record<string, unknown>];
  [MessageTypes.Goodbye]: unknown[];
  [MessageTypes.Error]: [requestMessageType: MessageTypes, requestId: number, details: UnknownObject, error: string, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Publish]: unknown[];
  [MessageTypes.Published]: unknown[];
  [MessageTypes.Subscribe]: [requestId: number, options: UnknownObject, topic: string];
  [MessageTypes.Subscribed]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribe]: unknown[];
  [MessageTypes.Unsubscribed]: unknown[];
  [MessageTypes.Event]: unknown[];
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

type SubscriptionHandler = () => void;

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

  private sequentialRequestId = 1;

  private deferredPromises = {
    open: deferredPromise<void>(),
    call: {} as { [callId: string]: DeferredPromise<unknown> },
    subscribe: {} as { [requestId: number]: DeferredPromise<number> & { handler: SubscriptionHandler } },
  }

  private subscriptionHandlers: { [subscriptionId: number]: SubscriptionHandler } = {};

  constructor(private readonly options: SwampyerOptions) {}

  async open() {
    this.socket = new WebSocket(this.options.url, ['wamp.2.json']);

    this.socket.addEventListener('open', () => {
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

    this.socket.addEventListener('error', () => {
      // TODO create the error object properly
      this.deferredPromises.open.reject(new Error('An error ocurred while opening the WebSocket connection'));
    });

    this.socket.addEventListener('message', this.messageHandler.bind(this));

    return this.deferredPromises.open.promise;
  }

  private sendMessage<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    // TODO Make sure socket is open and ready for use
    this.socket.send(JSON.stringify([messageType, ...data]));
  }

  private messageHandler(event: MessageEvent<string>) {
    const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;
    switch (messageType) {
      case MessageTypes.Challenge: {
        const [authMethod] = data as MessageData[MessageTypes.Challenge];
        const authData = this.options.onchallenge?.(authMethod);
        this.sendMessage(MessageTypes.Authenticate, [authData, {}]);
        break;
      }
      case MessageTypes.Welcome: {
        const [sessionId] = data as MessageData[MessageTypes.Welcome];
        this.sessionId = sessionId;
        this.deferredPromises.open.resolve();
        break;
      }
      case MessageTypes.Result: {
        const [requestId, details, resultArray, resultObj ] = data as MessageData[MessageTypes.Result];
        this.deferredPromises.call[requestId]?.resolve(resultArray[0]);
        delete this.deferredPromises.call[requestId];
        break;
      }
      case MessageTypes.Subscribed: {
        const [requestId, subscriptionId] = data as MessageData[MessageTypes.Subscribed];
        this.subscriptionHandlers[subscriptionId] = this.deferredPromises.subscribe[requestId].handler;
        this.deferredPromises.subscribe[requestId]?.resolve(subscriptionId);
        delete this.deferredPromises.subscribe[requestId];
        break;
      }
      case MessageTypes.Error: {
        const [requestMessageType, requestId, details, error, args, kwargs] = data as MessageData[MessageTypes.Error];
        switch(requestMessageType) {
          case MessageTypes.Call:
            this.deferredPromises.call[requestId]?.reject({ details, error, args, kwargs });
            delete this.deferredPromises.call[requestId];
            break;
          case MessageTypes.Subscribe:
            this.deferredPromises.subscribe[requestId]?.reject({ details, error, args, kwargs });
            delete this.deferredPromises.subscribe[requestId];
            break;
        }
        break;
      }
    }
  }

  async call(uri: string, args?: unknown[], kwargs?: UnknownObject): Promise<unknown> {
    const currentRequestId = this.sequentialRequestId;
    this.sequentialRequestId += 1;

    const deferred = deferredPromise<unknown>();
    this.sendMessage(MessageTypes.Call, [currentRequestId, {}, uri, args ?? [], kwargs ?? {}]);
    this.deferredPromises.call[currentRequestId] = deferred;
    return deferred.promise;
  }

  async subscribe(uri: string, handler: SubscriptionHandler): Promise<number> {
    const requestId = generateRandomInt();
    const deferred = deferredPromise<number>();
    this.deferredPromises.subscribe[requestId] = {
      ...deferred,
      handler
    };
    this.sendMessage(MessageTypes.Subscribe, [requestId, {}, uri]);
    return deferred.promise;
  }
}
