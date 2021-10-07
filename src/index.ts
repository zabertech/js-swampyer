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
  [MessageTypes.Error]: unknown[];
  [MessageTypes.Publish]: unknown[];
  [MessageTypes.Published]: unknown[];
  [MessageTypes.Subscribe]: unknown[];
  [MessageTypes.Subscribed]: unknown[];
  [MessageTypes.Unsubscribe]: unknown[];
  [MessageTypes.Unsubscribed]: unknown[];
  [MessageTypes.Event]: unknown[];
  [MessageTypes.Call]: unknown[];
  [MessageTypes.Result]: unknown[];
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
  onopen?: () => void;
}

// TODO move this to a separate file
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

class Swampyer {
  private socket: WebSocket;
  private deferredMessageTypePromises: Partial<Record<MessageTypes, DeferredPromise<unknown>[]>> = {};
  private sessionId: number;

  constructor(private readonly options: SwampyerOptions) {
    this.setupConnection();
  }

  private async setupConnection() {
    this.socket = new WebSocket(this.options.url, ['wamp.2.json']);

    await new Promise<void>((resolve, reject) => {
      // TODO cleanup these event listeners after we are done with them

      this.socket.addEventListener('open', e => {
        console.log('SOCKET OPEN', e);
        resolve();
      });

      this.socket.addEventListener('error', e => {
        console.log('SOCKET ERROR', e);
        reject();
      })
    });

    this.socket.addEventListener('message', this.messageHandler.bind(this));

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
  }

  private sendMessage<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    // TODO Make sure socket is open and ready for use
    this.socket.send(JSON.stringify([messageType, ...data]));
  }

  private getNextMessageOfType<T extends MessageTypes>(messageType: T): Promise<MessageData[T]> {
    const deferred = deferredPromise<MessageData[T]>();
    if (!this.deferredMessageTypePromises[messageType]) {
      this.deferredMessageTypePromises[messageType] = [];
    }
    this.deferredMessageTypePromises[messageType].push(deferred as DeferredPromise<unknown>);
    return deferred.promise;
  }

  private messageHandler(event: MessageEvent<string>) {
    const [messageType, ...data] = JSON.parse(event.data) as BaseMessage;

    this.deferredMessageTypePromises[messageType]?.forEach(deferred => deferred.resolve(data));
    delete this.deferredMessageTypePromises[messageType];

    switch (messageType) {
      case MessageTypes.Challenge:
        const [authMethod] = data as MessageData[MessageTypes.Challenge]
        const authData = this.options.onchallenge?.(authMethod);
        this.sendMessage(MessageTypes.Authenticate, [authData, {}]);
        break;
      case MessageTypes.Welcome:
        const [sessionId] = data as MessageData[MessageTypes.Welcome];
        this.sessionId = sessionId;
        this.options.onopen?.();
        break;
    }
  }
}
