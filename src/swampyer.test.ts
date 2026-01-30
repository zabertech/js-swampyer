/* eslint-disable @typescript-eslint/no-floating-promises */
import { TransportError, AbortError, ConnectionOpenError, SwampyerOperationError, ConnectionClosedError, SwampyerError } from './errors';
import { Swampyer } from './swampyer';
import { Transport, TransportProvider } from './transports/transport';
import { CloseDetails, CloseReason, MessageData, MessageTypes, OpenOptions } from './types';
import { waitUntilPass } from './utils';

class MockTransportProvider implements TransportProvider {
  transport = new Transport();
  isOpen = false;
  open() {
    this.transport.open();
    this.isOpen = true;
  }
  sendToLib<T extends MessageTypes>(messageType: T, data: MessageData[T]) {
    this.transport.write([messageType, ...data]);
  }
}

export class MockConsole {
  /**
   * The object that contains the mock function for any console method that gets
   * used from this mock
   */
  mock = {} as Record<string, jest.Mock>;
  /**
   * Clears the data in the mock functions
   */
  reset() {
    Object.values(this.mock).forEach(mock => mock.mockClear());
  }
  /**
   * The object that can be used as a replacement for `global.console`
   */
  console = new Proxy({}, {
    get: (targetObj, prop) => {
      const propAsStr = prop as string;

      if (this.mock[propAsStr]) {
        return this.mock[propAsStr];
      }

      const mockFunc = jest.fn();
      this.mock[propAsStr] = mockFunc;
      return mockFunc;
    },
  }) as typeof console;
}

const realm = 'test-realm';

let transportProvider: MockTransportProvider;
let wamp: Swampyer;

const mockConsole = new MockConsole();
// eslint-disable-next-line no-global-assign
console = mockConsole.console;

beforeEach(() => {
  mockConsole.reset();
  transportProvider = new MockTransportProvider();
  wamp = new Swampyer();
});

afterEach(() => {
  transportProvider = null!;
  wamp = null!;
});

async function acceptWampConnection() {
  await transportProvider.transport.read();
  transportProvider.sendToLib(MessageTypes.Welcome, [1234, {
    authid: 'someone',
    authrole: 'auth_master',
    authmethod: 'anonymous',
    roles: {}
  }]);
}

async function rejectWampConnection() {
  await transportProvider.transport.read();
  transportProvider.sendToLib(MessageTypes.Abort, ['some.error.happened', 'no reason at all']);
}

async function openWamp(optionsOverride?: Partial<OpenOptions>, customTransportProvider?: MockTransportProvider) {
  const provider = customTransportProvider ?? transportProvider;
  const openPromise = wamp.open(provider, { realm, ...optionsOverride })
    .catch(e => {
      throw e;
    });

  await waitUntilPass(() => expect(provider.isOpen).toBe(true));
  expect(await provider.transport.read()).toEqual([MessageTypes.Hello, 'test-realm', expect.any(Object)]);
  provider.sendToLib(MessageTypes.Welcome, [1234, {
    authid: 'someone',
    authrole: 'auth_master',
    authmethod: 'anonymous',
    roles: {}
  }]);
  return openPromise;
}

describe(`${Swampyer.prototype.open.name}()`, () => {
  it('can establish an unauthenticated WAMP connection if no auth data is provided and emits on "openEvent"', async () => {
    const onOpen = jest.fn();
    wamp.openEvent.addEventListener(onOpen);

    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));

    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, 'test-realm', expect.objectContaining({
      agent: expect.any(String),
      authmethods: ['anonymous'],
      roles: expect.objectContaining({
        callee: expect.anything(),
        caller: expect.anything(),
        publisher: expect.anything(),
        subscriber: expect.anything(),
      })
    })]);

    expect(onOpen).toBeCalledTimes(0);

    const expectedWelcomeDetails = { authid: 'someone', authrole: 'auth_master', authmethod: 'anonymous', roles: {} };
    transportProvider.sendToLib(MessageTypes.Welcome, [1234, expectedWelcomeDetails]);
    const welcomeDetails = await openPromise;

    expect(welcomeDetails).toEqual(expectedWelcomeDetails);
    expect(onOpen).toBeCalledTimes(1);
    expect(onOpen).toBeCalledWith(expectedWelcomeDetails);
  });

  it('can establish an authenticated WAMP connection if auth data is provided and emits on "openEvent"', async () => {
    const onOpen = jest.fn();
    const onChallenge = jest.fn(() => 'You dare challenge me?');

    wamp.openEvent.addEventListener(onOpen);

    const openPromise = wamp.open(transportProvider, {
      realm, auth: {
        authId: 'amazing-test-man',
        authMethods: ['ticket', 'whatever'],
        onChallenge,
      }
    });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));

    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, realm, expect.objectContaining({
      agent: expect.any(String),
      authmethods: ['ticket', 'whatever'],
      roles: expect.objectContaining({
        callee: expect.anything(),
        caller: expect.anything(),
        publisher: expect.anything(),
        subscriber: expect.anything(),
      })
    })]);

    expect(onOpen).toBeCalledTimes(0);
    expect(onChallenge).toBeCalledTimes(0);

    transportProvider.sendToLib(MessageTypes.Challenge, ['ticket', {}]);

    expect(onOpen).toBeCalledTimes(0);
    await waitUntilPass(() => expect(onChallenge).toBeCalledTimes(1));

    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Authenticate, 'You dare challenge me?', expect.any(Object)]);

    const expectedWelcomeDetails = { authid: 'amazing-test-man', authrole: 'auth_master', authmethod: 'ticket', roles: {} };
    transportProvider.sendToLib(MessageTypes.Welcome, [1234, expectedWelcomeDetails]);
    const welcomeDetails = await openPromise;

    expect(welcomeDetails).toEqual(expectedWelcomeDetails);
    expect(onOpen).toBeCalledTimes(1);
    expect(onOpen).toBeCalledWith(expectedWelcomeDetails);
  });

  it('is able to accept async onChallenge handlers', async () => {
    const onChallenge = jest.fn(() => 'You dare challenge me?');
    wamp.open(transportProvider, {
      realm,
      auth: {
        authId: 'amazing-test-man',
        authMethods: ['ticket', 'whatever'],
        onChallenge: async () => onChallenge(),
      }
    });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));

    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Challenge, ['ticket', {}]);

    await waitUntilPass(() => expect(onChallenge).toBeCalledTimes(1));
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Authenticate, 'You dare challenge me?', expect.any(Object)]);
  });

  it('allows for custom "agent" to be set for establishing a WAMP connection', async () => {
    wamp.open(transportProvider, { realm, agent: '47' });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, realm, expect.objectContaining({
      agent: '47'
    })]);
  });

  it('throws an error if the transport is closed before a WAMP connection can be opened. The close event is emiited', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    transportProvider.transport.close();
    await expect(openPromise).rejects.toBeInstanceOf(TransportError);
    expect(onClose).toBeCalledTimes(1);
    expect(onClose).toBeCalledWith<[CloseReason, CloseDetails]>('open_error', { error: expect.any(SwampyerError) });
  });

  it('throws an error if the WAMP server sends an ABORT message. The close event is emiited', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, realm, expect.any(Object)]);
    transportProvider.sendToLib(MessageTypes.Abort, ['some.error.happened', 'no reason at all']);
    await expect(openPromise).rejects.toBeInstanceOf(AbortError);
    expect(onClose).toBeCalledTimes(1);
    expect(onClose).toBeCalledWith<[CloseReason, CloseDetails]>('open_error', { error: expect.any(SwampyerError) });
  });

  it('throws an error if the "auth.onChallenge" function has an error. The close event is emiited', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    const openPromise = wamp.open(transportProvider, {
      realm, auth: {
        authId: 'amazing-test-man',
        authMethods: ['ticket', 'whatever'],
        onChallenge: () => { throw Error('Too challenging') },
      }
    });

    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, realm, expect.any(Object)]);
    transportProvider.sendToLib(MessageTypes.Challenge, ['ticket', {}]);
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Abort, expect.any(Object), 'wamp.error.cannot_authenticate']);

    await expect(openPromise).rejects.toBeInstanceOf(AbortError);
    expect(onClose).toBeCalledTimes(1);
    expect(onClose).toBeCalledWith<[CloseReason, CloseDetails]>('open_error', { error: expect.any(SwampyerError) });
  });

  it('throws an error if we try to call "open()" again while the connection is already open. The transport is not opened', async () => {
    await openWamp();
    const newTransportProvider = new MockTransportProvider();
    await expect(wamp.open(newTransportProvider, { realm })).rejects.toBeInstanceOf(ConnectionOpenError);
    expect(newTransportProvider.isOpen).toBe(false);
  });

  it('throws an error if we call "open()" while a previous call to "open()" is in progress. The transport is not opened', async () => {
    wamp.open(transportProvider, { realm });
    const newTransportProvider = new MockTransportProvider();
    await expect(wamp.open(newTransportProvider, { realm })).rejects.toBeInstanceOf(ConnectionOpenError);
    expect(newTransportProvider.isOpen).toBe(false);
  });

  it('closes the transport if any errors occur', async () => {
    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    transportProvider.transport.close();
    await expect(openPromise).rejects.toBeInstanceOf(TransportError);
    expect(transportProvider.transport.isClosed).toBe(true);
  });
});

describe(`${Swampyer.prototype.openAutoReconnect.name}()`, () => {
  const openOptions: OpenOptions = {
    realm,
  };

  function getNewTransportProvider() {
    transportProvider = new MockTransportProvider();
    return transportProvider;
  }

  afterEach(() => {
    jest.useRealTimers();
  });

  it('opens a WAMP connection', async () => {
    const transportProviderFunc = jest.fn(() => (transportProvider = new MockTransportProvider(), transportProvider));
    wamp = new Swampyer();
    wamp.openAutoReconnect(transportProviderFunc, openOptions);
    await acceptWampConnection();
    expect(wamp.isOpen).toBe(true);
    expect(transportProviderFunc).toBeCalledTimes(1);
  });

  it('attempts reconnections when the WAMP connection can not be opened', async () => {
    jest.useFakeTimers();
    const transportProviderFunc = jest.fn(() => getNewTransportProvider());

    wamp = new Swampyer();

    wamp.openAutoReconnect(transportProviderFunc, openOptions);
    await rejectWampConnection();

    expect(transportProviderFunc).toBeCalledTimes(1);
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(true));
    jest.advanceTimersByTime(2);
    await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(2));

    await acceptWampConnection();
    expect(wamp.isOpen).toBe(true);
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(false));
  });

  it('attempts reconnections when the WAMP connection closes for some reason', async () => {
    jest.useFakeTimers();
    const transportProviderFunc = jest.fn(() => getNewTransportProvider());

    wamp = new Swampyer();
    wamp.openAutoReconnect(transportProviderFunc, openOptions);
    await acceptWampConnection();
    expect(wamp.isOpen).toBe(true);
    expect(transportProviderFunc).toBeCalledTimes(1);

    transportProvider.transport.close();
    expect(wamp.isOpen).toBe(false);
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(true));

    jest.advanceTimersByTime(2);
    await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(2));
    await acceptWampConnection();
    expect(wamp.isOpen).toBe(true);
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(false));
  });

  it('optionally gets the delay for each reconnection attempt from the user defined function', async () => {
    jest.useFakeTimers();
    const transportProviderFunc = jest.fn(() => getNewTransportProvider());
    const delayFunc = jest.fn(() => 77);
    const onClose = jest.fn();

    wamp = new Swampyer();
    wamp.closeEvent.addEventListener(onClose);
    wamp.openAutoReconnect(transportProviderFunc, { ...openOptions, autoReconnectionDelay: delayFunc });

    expect(transportProviderFunc).toBeCalledTimes(1);
    expect(delayFunc).toBeCalledTimes(0);

    await rejectWampConnection();
    await waitUntilPass(() => expect(onClose).toBeCalledTimes(1));

    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(true));
    expect(transportProviderFunc).toBeCalledTimes(1);
    expect(delayFunc).toBeCalledTimes(1);

    jest.advanceTimersByTime(70);

    expect(transportProviderFunc).toBeCalledTimes(1);
    expect(delayFunc).toBeCalledTimes(1);

    jest.advanceTimersByTime(10);

    await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(2));
    expect(delayFunc).toBeCalledTimes(1);
    await acceptWampConnection();
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(false));
  });

  it('does not attempt reconnection if the function to stop auto reconnections returns true', async () => {
    jest.useFakeTimers();
    const transportProviderFunc = jest.fn(() => getNewTransportProvider());
    const stopAutoReconnection = jest.fn(() => true);
    const onClose = jest.fn();

    wamp = new Swampyer();
    wamp.closeEvent.addEventListener(onClose);
    wamp.openAutoReconnect(transportProviderFunc, { ...openOptions, stopAutoReconnection });

    expect(transportProviderFunc).toBeCalledTimes(1);
    expect(stopAutoReconnection).toBeCalledTimes(0);

    await rejectWampConnection();
    await waitUntilPass(() => expect(onClose).toBeCalledTimes(1));

    expect(transportProviderFunc).toBeCalledTimes(1);
    await waitUntilPass(() => expect(stopAutoReconnection).toBeCalledTimes(1));

    expect(wamp.isReconnecting).toBe(false);
    jest.advanceTimersByTime(100);
    expect(wamp.isReconnecting).toBe(false);

    expect(transportProviderFunc).toBeCalledTimes(1);
    expect(stopAutoReconnection).toBeCalledTimes(1);
  });

  it(`does not attempt reconnection if ${Swampyer.prototype.close.name}() is called`, async () => {
    jest.useFakeTimers();
    const transportProviderFunc = jest.fn(() => getNewTransportProvider());
    const delayFunc = jest.fn(() => 1);
    const onClose = jest.fn();

    wamp = new Swampyer();
    wamp.closeEvent.addEventListener(onClose);
    wamp.openAutoReconnect(transportProviderFunc, { ...openOptions, autoReconnectionDelay: delayFunc });
    await acceptWampConnection();

    const closePromise = wamp.close();
    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.fine.go.away.then']);
    await closePromise;

    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(false));
    jest.advanceTimersByTime(100);
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(false));

    expect(onClose).toBeCalledTimes(1);
    expect(transportProviderFunc).toBeCalledTimes(1);
    expect(delayFunc).toBeCalledTimes(0);
  });

  it(`does not attempt reconnection if ${Swampyer.prototype.close.name}() is called while waiting for reconnection delay`, async () => {
    jest.useFakeTimers();
    const transportProviderFunc = jest.fn(() => getNewTransportProvider());
    const delayFunc = jest.fn(() => 1);
    const onClose = jest.fn();

    wamp = new Swampyer();
    wamp.closeEvent.addEventListener(onClose);
    wamp.openAutoReconnect(transportProviderFunc, { ...openOptions, autoReconnectionDelay: delayFunc });
    await rejectWampConnection();

    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(true));

    await wamp.close();

    await waitUntilPass(() => expect(onClose).toBeCalledTimes(1));
    expect(transportProviderFunc).toBeCalledTimes(1);
    jest.advanceTimersByTime(2);
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(false));

    expect(delayFunc).toBeCalledTimes(1);
  });

  it('provides correct attempt number to callbacks and resets attempt number to 0 after a successful connection', async () => {
    jest.useFakeTimers();
    const transportProviderFunc = jest.fn(() => getNewTransportProvider());
    const delayFunc = jest.fn(() => 1);
    const onClose = jest.fn();

    wamp = new Swampyer();
    wamp.closeEvent.addEventListener(onClose);
    wamp.openAutoReconnect(transportProviderFunc, { ...openOptions, autoReconnectionDelay: delayFunc });

    await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(1));
    expect(transportProviderFunc).lastCalledWith(0);
    expect(delayFunc).toBeCalledTimes(0);
    await rejectWampConnection();

    await waitUntilPass(() => expect(onClose).toBeCalledTimes(1));
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(true));
    jest.advanceTimersByTime(2);
    await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(2));
    expect(transportProviderFunc).lastCalledWith(1, expect.any(String), expect.any(Object));
    expect(delayFunc).toBeCalledTimes(1);
    expect(delayFunc).lastCalledWith(1, expect.any(String), expect.any(Object));
    await rejectWampConnection();

    await waitUntilPass(() => expect(onClose).toBeCalledTimes(2));
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(true));
    jest.advanceTimersByTime(2);
    await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(3));
    expect(transportProviderFunc).lastCalledWith(2, expect.any(String), expect.any(Object));
    expect(delayFunc).toBeCalledTimes(2);
    expect(delayFunc).lastCalledWith(2, expect.any(String), expect.any(Object));
    await acceptWampConnection();

    await waitUntilPass(() => expect(wamp.isOpen).toBe(true));
    transportProvider.transport.close();

    await waitUntilPass(() => expect(onClose).toBeCalledTimes(3));
    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(true));
    jest.advanceTimersByTime(2);
    await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(4));
    expect(transportProviderFunc).lastCalledWith(1, expect.any(String), expect.any(Object));
    expect(delayFunc).toBeCalledTimes(3);
    expect(delayFunc).lastCalledWith(1, expect.any(String), expect.any(Object));
    await acceptWampConnection();
  });

  it('throws an error if it is called when the connection is already open', async () => {
    const transportProviderFunc = jest.fn(() => (transportProvider = new MockTransportProvider(), transportProvider));
    wamp = new Swampyer();
    wamp.openAutoReconnect(transportProviderFunc, openOptions);
    await acceptWampConnection();
    expect(wamp.isOpen).toBe(true);
    expect(transportProviderFunc).toBeCalledTimes(1);

    expect(() => wamp.openAutoReconnect(transportProviderFunc, openOptions)).toThrow(ConnectionOpenError);
  });

  it('throws an error if it is called when it is reconnecting', async () => {
    jest.useFakeTimers();
    const transportProviderFunc = jest.fn(() => getNewTransportProvider());

    wamp = new Swampyer();
    wamp.openAutoReconnect(transportProviderFunc, openOptions);
    await acceptWampConnection();

    transportProvider.transport.close();

    await waitUntilPass(() => expect(wamp.isReconnecting).toBe(true));
    expect(() => wamp.openAutoReconnect(transportProviderFunc, openOptions)).toThrow(ConnectionOpenError);

    jest.advanceTimersByTime(2);

    await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(2));
    await acceptWampConnection();
  });
});

describe(`${Swampyer.prototype.close.name}()`, () => {
  beforeEach(async () => {
    await openWamp();
  });

  it('closes the WAMP connection and the transport', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    expect(transportProvider.transport.isClosed).toBe(false);

    const closePromise = wamp.close();
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Goodbye, expect.any(Object), expect.any(String)]);
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.fine.go.away.then']);

    await closePromise;
    expect(wamp.isOpen).toBe(false);
    expect(transportProvider.transport.isClosed).toBe(true);
    expect(onClose).toBeCalledTimes(1);
    expect(onClose).toBeCalledWith<[CloseReason, CloseDetails]>('close_method', {});
  });

  it('allows custom reason and message to be provided for why the connection is being closed', async () => {
    wamp.close('com.i.am.leaving', 'BYE!');
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Goodbye, { message: 'BYE!' }, 'com.i.am.leaving']);
  });

  it('allows the same "Swampyer" object to be used to open a new connection after it gets closed', async () => {
    const closePromise = wamp.close();
    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.fine.go.away.then']);
    await closePromise;

    await openWamp({}, new MockTransportProvider());
  });
});

describe(`${Swampyer.prototype.register.name}()`, () => {
  beforeEach(async () => {
    await openWamp();
  });

  async function testErrorHandling(regHandler: jest.Mock, expectedArgs: unknown[], expectedKwargs: unknown) {
    const regPromise = wamp.register('com.test.something', regHandler);
    const regRequest = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Registered, [regRequest[1] as number, 1234]);
    await regPromise;

    transportProvider.sendToLib(MessageTypes.Invocation, [5656, 1234, {}, ['args over here'], {}]);

    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Error, MessageTypes.Invocation, 5656, {}, expect.any(String), expectedArgs, expectedKwargs]
    );
    expect(mockConsole.mock.error.mock.calls).toEqual([[expect.any(String), expect.anything()]]);
  }

  describe('async handler function', () => {
    it('registers a callback for a URI and responds to call() on that URI', async () => {
      const regHandler = jest.fn().mockImplementation(async () => 'fancy result');

      const regPromise = wamp.register('com.test.something', regHandler);

      const regRequest = await transportProvider.transport.read();
      expect(regRequest).toEqual([MessageTypes.Register, expect.any(Number), expect.any(Object), 'com.test.something']);
      transportProvider.sendToLib(MessageTypes.Registered, [regRequest[1] as number, 1234]);

      const regId = await regPromise;
      expect(regId).toEqual(1234);

      const args = [2, 'args'];
      const kwargs = { one: 'kwarg' };
      const details = {};
      transportProvider.sendToLib(MessageTypes.Invocation, [5656, 1234, details, args, kwargs]);
      await waitUntilPass(() => expect(regHandler).toBeCalledTimes(1));
      expect(regHandler).toBeCalledWith(args, kwargs, details);

      expect(await transportProvider.transport.read()).toEqual([MessageTypes.Yield, 5656, {}, ['fancy result'], {}]);
    });

    it('handles errors thrown by registration callbacks and returns the error to the caller as best as it can', async () => {
      const errorObj = new Error('Some error');
      const regHandler = jest.fn().mockImplementation(async () => { throw errorObj });
      await testErrorHandling(
        regHandler,
        [String(errorObj)],
        { errorDetails: errorObj }
      );
    });
  });

  describe('non-async handler function', () => {
    it('registers a callback for a URI and responds to call() on that URI', async () => {
      const regHandler = jest.fn().mockImplementation(() => 'fancy result');

      const regPromise = wamp.register('com.test.something', regHandler);

      const regRequest = await transportProvider.transport.read();
      expect(regRequest).toEqual([MessageTypes.Register, expect.any(Number), expect.any(Object), 'com.test.something']);
      transportProvider.sendToLib(MessageTypes.Registered, [regRequest[1] as number, 1234]);

      const regId = await regPromise;
      expect(regId).toEqual(1234);

      const args = [2, 'args'];
      const kwargs = { one: 'kwarg' };
      const details = {};
      transportProvider.sendToLib(MessageTypes.Invocation, [5656, 1234, details, args, kwargs]);
      await waitUntilPass(() => expect(regHandler).toBeCalledTimes(1));
      expect(regHandler).toBeCalledWith(args, kwargs, details);

      expect(await transportProvider.transport.read()).toEqual([MessageTypes.Yield, 5656, {}, ['fancy result'], {}]);
    });

    it('handles errors thrown by registration callbacks and returns the error to the caller as best as it can', async () => {
      const errorObj = new Error('Some error');
      const regHandler = jest.fn().mockImplementation(() => { throw errorObj });
      await testErrorHandling(
        regHandler,
        [String(errorObj)],
        { errorDetails: errorObj }
      );
    });
  });

  it('provides reasonable defaults for args, kwargs, and details if they are undefined in the invocation data', async () => {
    const regHandler = jest.fn().mockImplementation(async () => 'fancy result');

    const regPromise = wamp.register('com.test.something', regHandler);

    const regRequest = await transportProvider.transport.read();
    expect(regRequest).toEqual([MessageTypes.Register, expect.any(Number), expect.any(Object), 'com.test.something']);
    transportProvider.sendToLib(MessageTypes.Registered, [regRequest[1] as number, 1234]);

    const regId = await regPromise;
    expect(regId).toEqual(1234);

    const args = undefined;
    const kwargs = undefined;
    const details = undefined;
    transportProvider.sendToLib(MessageTypes.Invocation, [5656, 1234, details!, args!, kwargs!]);
    await waitUntilPass(() => expect(regHandler).toBeCalledTimes(1));
    expect(regHandler).toBeCalledWith([], {}, {});

    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Yield, 5656, {}, ['fancy result'], {}]);
  });

  it('multiple reigstrations are kept separate and handled properly when a call() is made for them', async () => {
    const regHandler1 = jest.fn().mockResolvedValue('fancy result 1');
    const regPromise1 = wamp.register('com.test.something', regHandler1);
    const regRequest1 = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Registered, [regRequest1[1] as number, 1234]);
    await regPromise1;

    const regHandler2 = jest.fn().mockResolvedValue('fancy result 2');
    const regPromise2 = wamp.register('com.test.something_different', regHandler2);
    const regRequest2 = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Registered, [regRequest2[1] as number, 9876]);
    await regPromise2;

    transportProvider.sendToLib(MessageTypes.Invocation, [5656, 1234, {}, ['for 1st reg'], {}]);
    transportProvider.sendToLib(MessageTypes.Invocation, [6767, 9876, {}, ['for 2nd reg'], {}]);

    expect(regHandler1).toBeCalledWith(['for 1st reg'], {}, {});
    expect(regHandler2).toBeCalledWith(['for 2nd reg'], {}, {});

    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Yield, 5656, {}, ['fancy result 1'], {}]);
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Yield, 6767, {}, ['fancy result 2'], {}]);
  });

  it('throws an error if an ERROR message is received while registering', async () => {
    const regHandler = jest.fn().mockResolvedValue('fancy result');
    const regPromise = wamp.register('com.test.something', regHandler);
    const regRequest = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Register, regRequest[1] as number, {}, 'something bad', [], {}]);

    await expect(regPromise).rejects.toBeInstanceOf(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received while registering', async () => {
    const regHandler = jest.fn().mockResolvedValue('fancy result');
    const regPromise = wamp.register('com.test.something', regHandler);
    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);

    await expect(regPromise).rejects.toBeInstanceOf(ConnectionClosedError);
  });
});

describe(`${Swampyer.prototype.call.name}()`, () => {
  const args = ['my_args'];
  const kwargs = { my: 'kwargs' };

  beforeEach(async () => {
    await openWamp();
  });

  it('sends a call request and receives the result', async () => {
    const promise = wamp.call('com.test.something', args, kwargs);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Call, expect.any(Number), {}, 'com.test.something', args, kwargs]);
    transportProvider.sendToLib(MessageTypes.Result, [request[1] as number, {}, ['something'], { something: 'else' }]);
    expect(await promise).toEqual('something');
  });

  it('throws an error if the call request fails', async () => {
    const promise = wamp.call('com.test.something', args, kwargs);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Call, expect.any(Number), {}, 'com.test.something', args, kwargs]);
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Call, request[1] as number, {}, 'something bad', [], {}]);
    await expect(promise).rejects.toBeInstanceOf(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received before the call can be finished', async () => {
    const promise = wamp.call('com.test.something', args, kwargs);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Call, expect.any(Number), {}, 'com.test.something', args, kwargs]);
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toBeInstanceOf(ConnectionClosedError);
  });
});

describe(`${Swampyer.prototype.callWithResult.name}()`, () => {
  const args = ['my_args'];
  const kwargs = { my: 'kwargs' };

  const resultDetails = { someWampInfo: 'info' };

  beforeEach(async () => {
    await openWamp();
  });

  it('sends a call request and receives the result', async () => {
    const promise = wamp.callWithResult('com.test.something', args, kwargs);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Call, expect.any(Number), {}, 'com.test.something', args, kwargs]);
    transportProvider.sendToLib(MessageTypes.Result, [request[1] as number, resultDetails, ['something'], { something: 'else' }]);
    expect(await promise).toEqual([['something'], { something: 'else' }, resultDetails]);
  });

  it('throws an error if the call request fails', async () => {
    const promise = wamp.callWithResult('com.test.something', args, kwargs);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Call, expect.any(Number), {}, 'com.test.something', args, kwargs]);
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Call, request[1] as number, {}, 'something bad', [], {}]);
    await expect(promise).rejects.toBeInstanceOf(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received before the call can be finished', async () => {
    const promise = wamp.callWithResult('com.test.something', args, kwargs);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Call, expect.any(Number), {}, 'com.test.something', args, kwargs]);
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toBeInstanceOf(ConnectionClosedError);
  });
});

describe(`${Swampyer.prototype.unregister.name}()`, () => {
  const regId = 1234;

  let handler: jest.Mock;

  beforeEach(async () => {
    await openWamp();

    handler = jest.fn().mockRejectedValue('Some error');
    const promise = wamp.register('com.test.something', handler);
    const request = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Registered, [request[1] as number, regId]);
    await promise;
  });

  it('unregisters a registration and the old registration callback no longer responds to any calls to that URI', async () => {
    const promise = wamp.unregister(regId);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unregister, expect.any(Number), regId]);
    transportProvider.sendToLib(MessageTypes.Unregistered, [request[1] as number]);
    await promise;

    expect(handler).toBeCalledTimes(0);
    transportProvider.sendToLib(MessageTypes.Invocation, [6767, 9876, {}, ['args'], {}]);
    expect(handler).toBeCalledTimes(0);
  });

  it('throws an error if the unregistration fails', async () => {
    const promise = wamp.unregister(regId);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unregister, expect.any(Number), regId]);
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Unregister, request[1] as number, {}, 'something bad', [], {}]);
    await expect(promise).rejects.toBeInstanceOf(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE event occurs while unregistering', async () => {
    const promise = wamp.unregister(regId);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unregister, expect.any(Number), regId]);
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toBeInstanceOf(ConnectionClosedError);
  });
});

describe(`${Swampyer.prototype.subscribe.name}()`, () => {
  beforeEach(async () => {
    await openWamp();
  });

  it('subscribes to the desired URI and handles publish events', async () => {
    const subHandler = jest.fn();
    const promise = wamp.subscribe('com.some.uri', subHandler);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Subscribe, expect.any(Number), expect.any(Object), 'com.some.uri']);
    transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, 1234]);
    const data = await promise;

    expect(data).toEqual({ id: 1234, handler: subHandler });

    const args = [2, 'args'];
    const kwargs = { one: 'kwarg' };
    const details = {};
    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, details, args, kwargs]);
    expect(subHandler).toBeCalledTimes(1);
    expect(subHandler).toBeCalledWith(args, kwargs, details);
  });

  it('runs multiple subscription handlers for different subscription IDs', async () => {
    const subHandler1 = jest.fn();
    const promise1 = wamp.subscribe('com.some.uri1', subHandler1);
    const request1 = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Subscribed, [request1[1] as number, 1234]);
    await promise1;

    const subHandler2 = jest.fn();
    const promise2 = wamp.subscribe('com.some.uri2', subHandler2);
    const request2 = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Subscribed, [request2[1] as number, 9876]);
    await promise2;

    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, ['for 1st sub'], {}]);
    transportProvider.sendToLib(MessageTypes.Event, [9876, 6666, {}, ['for 2nd sub'], {}]);

    expect(subHandler1).toBeCalledWith(['for 1st sub'], {}, {});
    expect(subHandler2).toBeCalledWith(['for 2nd sub'], {}, {});
  });

  it('runs multiple subscription handlers for same subscription ID', async () => {
    const subHandler1 = jest.fn();
    const promise1 = wamp.subscribe('com.some.uri', subHandler1);
    const request1 = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Subscribed, [request1[1] as number, 1234]);
    await promise1;

    const subHandler2 = jest.fn();
    const promise2 = wamp.subscribe('com.some.uri', subHandler2);
    const request2 = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Subscribed, [request2[1] as number, 1234]);
    await promise2;

    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, ['some event'], {}]);

    expect(subHandler1).toBeCalledWith(['some event'], {}, {});
    expect(subHandler2).toBeCalledWith(['some event'], {}, {});
  });

  it('provides reasonable defaults for args, kwargs, and details if they are undefined in the event data', async () => {
    const subHandler = jest.fn();
    const promise = wamp.subscribe('com.some.uri', subHandler);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Subscribe, expect.any(Number), expect.any(Object), 'com.some.uri']);
    transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, 1234]);
    await promise;

    const args = undefined;
    const kwargs = undefined;
    const details = undefined;
    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, details!, args!, kwargs!]);
    expect(subHandler).toBeCalledTimes(1);
    expect(subHandler).toBeCalledWith([], {}, {});
  });

  it('throws an error if subscription fails', async () => {
    const subHandler = jest.fn();
    const promise = wamp.subscribe('com.some.uri', subHandler);
    const request = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Subscribe, request[1] as number, {}, 'something bad', [], {}]);
    await expect(promise).rejects.toBeInstanceOf(SwampyerOperationError);
  });

  it('throws an error if GOODBYE event occurs before subscribe operation finishes', async () => {
    const subHandler = jest.fn();
    const promise = wamp.subscribe('com.some.uri', subHandler);
    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toBeInstanceOf(ConnectionClosedError);
  });

  it('logs an error to console if subscription handler throws an error', async () => {
    const errorObj = new Error('I never subscribed to this');
    const subHandler = jest.fn(() => { throw errorObj });

    const promise = wamp.subscribe('com.some.uri', subHandler);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Subscribe, expect.any(Number), expect.any(Object), 'com.some.uri']);
    transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, 1234]);
    await promise;

    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, ['args'], {}]);
    expect(subHandler).toBeCalledTimes(1);

    // eslint-disable-next-line no-console
    await waitUntilPass(() => expect(console.error).toBeCalledTimes(1));
    // eslint-disable-next-line no-console
    expect(console.error).toBeCalledWith(expect.any(String), errorObj);
  });

  it('logs an error to console if an async subscription handler throws an error', async () => {
    const errorObj = new Error('I never subscribed to this');
    const subHandler = jest.fn(async () => { throw errorObj });

    const promise = wamp.subscribe('com.some.uri', subHandler);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Subscribe, expect.any(Number), expect.any(Object), 'com.some.uri']);
    transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, 1234]);
    await promise;

    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, ['args'], {}]);
    expect(subHandler).toBeCalledTimes(1);

    // eslint-disable-next-line no-console
    await waitUntilPass(() => expect(console.error).toBeCalledTimes(1));
    // eslint-disable-next-line no-console
    expect(console.error).toBeCalledWith(expect.any(String), errorObj);
  });
});

describe(`${Swampyer.prototype.publish.name}()`, () => {
  beforeEach(async () => {
    await openWamp();
  });

  it('publishes to the desired URI', async () => {
    wamp.publish('com.some.uri', ['something'], { something: 'else' });
    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Publish, expect.any(Number), {}, 'com.some.uri', ['something'], { something: 'else' }]
    );
  });

  it('optionally waits for acknowledgement', async () => {
    const promise = wamp.publish('com.some.uri', ['something'], { something: 'else' }, { acknowledge: true });
    const request = await transportProvider.transport.read();
    expect(request).toEqual(
      [MessageTypes.Publish, expect.any(Number), { acknowledge: true }, 'com.some.uri', ['something'], { something: 'else' }]
    );
    transportProvider.sendToLib(MessageTypes.Published, [request[1] as number, expect.any(Number)]);
    await promise;
  });

  it('throws an error if publish operation fails acknowledgement', async () => {
    const promise = wamp.publish('com.some.uri', ['something'], { something: 'else' }, { acknowledge: true });
    const request = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Publish, request[1] as number, {}, 'something bad', [], {}]);
    await expect(promise).rejects.toBeInstanceOf(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received before publish acknowledgement is received', async () => {
    const promise = wamp.publish('com.some.uri', ['something'], { something: 'else' }, { acknowledge: true });
    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toBeInstanceOf(ConnectionClosedError);
  });
});

describe(`${Swampyer.prototype.unsubscribe.name}()`, () => {
  const subId = 1234;

  let handler1: jest.Mock;

  beforeEach(async () => {
    await openWamp();

    handler1 = jest.fn();
    const promise = wamp.subscribe('com.some.uri', handler1);
    const request = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, subId]);
    await promise;
  });

  it('unsubscribes a subscription', async () => {
    const promise = wamp.unsubscribe({ id: subId, handler: handler1 });
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unsubscribe, expect.any(Number), subId]);
    transportProvider.sendToLib(MessageTypes.Unsubscribed, [request[1] as number]);
    await promise;

    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, [97], {}]);
    expect(handler1).toBeCalledTimes(0);
  });

  it('throws an error if the unsubscribe operation fails', async () => {
    const promise = wamp.unsubscribe({ id: subId, handler: handler1 });
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unsubscribe, expect.any(Number), subId]);
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Unsubscribe, request[1] as number, {}, 'something bad', [], {}]);
    await expect(promise).rejects.toBeInstanceOf(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received before unsubscribe operation finishes', async () => {
    const promise = wamp.unsubscribe({ id: subId, handler: handler1 });
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unsubscribe, expect.any(Number), subId]);
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toBeInstanceOf(ConnectionClosedError);
  });

  describe('multiple subscription for same subscription ID', () => {
    let handler2: jest.Mock;

    beforeEach(async () => {
      handler2 = jest.fn();
      const promise = wamp.subscribe('com.some.uri', handler2);
      const request = await transportProvider.transport.read();
      transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, subId]);
      await promise;
    });

    it('unsubscribes the given handler but leaves the other handlers subscribed', async () => {
      await wamp.unsubscribe({ id: subId, handler: handler1 });

      transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, [97], {}]);
      expect(handler1).toBeCalledTimes(0);
      expect(handler2).toBeCalledTimes(1);
      expect(handler2).toBeCalledWith([97], {}, {});
    });

    it('unsubscribes fully once the last handler is unsubscribed', async () => {
      await wamp.unsubscribe({ id: subId, handler: handler1 });

      transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, [97], {}]);
      expect(handler1).toBeCalledTimes(0);
      expect(handler2).toBeCalledTimes(1);
      expect(handler2).toBeCalledWith([97], {}, {});

      const promise = wamp.unsubscribe({ id: subId, handler: handler2 });
      const request = await transportProvider.transport.read();
      expect(request).toEqual([MessageTypes.Unsubscribe, expect.any(Number), subId]);
      transportProvider.sendToLib(MessageTypes.Unsubscribed, [request[1] as number]);
      await promise;

      transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, [97], {}]);
      expect(handler1).toBeCalledTimes(0);
      expect(handler2).toBeCalledTimes(1);
    });

    it('unsubscribes fully if the argument is provided', async () => {
      const promise = wamp.unsubscribe({ id: subId, handler: handler2 }, true);
      const request = await transportProvider.transport.read();
      expect(request).toEqual([MessageTypes.Unsubscribe, expect.any(Number), subId]);
      transportProvider.sendToLib(MessageTypes.Unsubscribed, [request[1] as number]);
      await promise;

      transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, [97], {}]);
      expect(handler1).toBeCalledTimes(0);
      expect(handler2).toBeCalledTimes(0);
    });
  });
});

describe('misc event handling', () => {
  beforeEach(async () => {
    await openWamp();
  });

  it('closes properly if the transport gets closed', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    transportProvider.transport.close();
    await waitUntilPass(() => expect(wamp.isOpen).toBe(false));
    expect(onClose).toBeCalledTimes(1);
    expect(onClose).toBeCalledWith<[CloseReason, CloseDetails]>('transport_close', {});
  });

  it('closes properly if the transport gets closed with an error', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    transportProvider.transport.close(new Error('some error'));
    await waitUntilPass(() => expect(wamp.isOpen).toBe(false));
    expect(onClose).toBeCalledTimes(1);
    expect(onClose).toBeCalledWith<[CloseReason, CloseDetails]>('transport_error', { error: expect.any(Error) });
  });

  it('closes properly if a GOODBYE message is recevied', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await waitUntilPass(() => expect(wamp.isOpen).toBe(false));
    expect(onClose).toBeCalledTimes(1);
    expect(onClose).toBeCalledWith<[CloseReason, CloseDetails]>('goodbye', { goodbye: { details: {}, reason: 'com.some.reason' } });
  });
});

describe('"uriBase" option during "open()"', () => {
  beforeEach(async () => {
    await openWamp({ uriBase: 'com.uri.base' });
  });

  it('is respected for register()', async () => {
    wamp.register('works', () => null);
    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Register, expect.any(Number), expect.any(Object), 'com.uri.base.works']
    );
  });

  it('is respected for call()', async () => {
    wamp.call('works');
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Call, expect.any(Number), {}, 'com.uri.base.works', [], {}]);
  });

  it('is respected for subscribe()', async () => {
    wamp.subscribe('works', () => null);
    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Subscribe, expect.any(Number), expect.any(Object), 'com.uri.base.works']
    );
  });

  it('is respected for publish()', async () => {
    wamp.publish('works');
    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Publish, expect.any(Number), {}, 'com.uri.base.works', [], {}]
    );
  });
});

describe('"withoutUriBase" option during specific operations', () => {
  beforeEach(async () => {
    await openWamp({ uriBase: 'com.uri.base' });
  });

  it('is respected for register()', async () => {
    wamp.register('com.uri.some_other_base.works', () => null, { withoutUriBase: true });
    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Register, expect.any(Number), expect.any(Object), 'com.uri.some_other_base.works']
    );
  });

  it('is respected for call()', async () => {
    wamp.call('com.uri.some_other_base.works', [], {}, { withoutUriBase: true });
    expect(await transportProvider.transport.read()).toEqual([
      MessageTypes.Call, expect.any(Number), expect.any(Object), 'com.uri.some_other_base.works', [], {}
    ]);
  });

  it('is respected for subscribe()', async () => {
    wamp.subscribe('com.uri.some_other_base.works', () => null, { withoutUriBase: true });
    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Subscribe, expect.any(Number), expect.any(Object), 'com.uri.some_other_base.works']
    );
  });

  it('is respected for publish()', async () => {
    wamp.publish('com.uri.some_other_base.works', [], {}, { withoutUriBase: true });
    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Publish, expect.any(Number), expect.any(Object), 'com.uri.some_other_base.works', [], {}]
    );
  });
});
