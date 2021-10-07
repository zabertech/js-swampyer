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

interface SwampyerOptions {
  url: string;
  realm: string;
  authid: string;
  authmethods: AuthMethod[]
}

class Swampyer {
  private socket: WebSocket;

  constructor(private readonly options: SwampyerOptions) {
    console.log('SWAMPYER CONSTRUCTOR');
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

    this.socket.addEventListener('message', this.messageHandler);

    this.socket.send(JSON.stringify([MessageTypes.Hello, this.options.realm, {
      authid: this.options.authid,
      agent: 'swampyer-js',
      authmethods: this.options.authmethods || ['anonymous'],
      roles: {
        subscriber: {},
        publisher: {},
        caller: {},
        callee: {},
      }
    }]));
  }

  private messageHandler(event: MessageEvent<string>) {
    console.log('SOCKET MESSAGE EVENT', event);
    const data = JSON.parse(event.data);
    console.log('SOCKET MESSAGE DATA', data);
  }
}
