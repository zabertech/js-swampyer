import { Swampyer } from './swampyer';
import { Transport, TransportProvider } from './transports/transport';
import { MessageData, MessageTypes, WampMessage } from './types';
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

const realm = 'test-realm';

let transportProvider: MockTransportProvider;
let wamp: Swampyer;

beforeEach(() => {
  transportProvider = new MockTransportProvider();
  wamp = new Swampyer();
});

afterEach(() => {
  transportProvider = null!;
  wamp = null!;
});

async function openWamp() {
  const openPromise = wamp.open(transportProvider, { realm })
    .catch(e => {
      throw e;
    });

  await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
  expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, 'test-realm', expect.any(Object)]);
  transportProvider.sendToLib(MessageTypes.Welcome, [1234, {
    authid: 'someone',
    authrole: 'auth_master',
    authmethod: 'anonymous',
    roles: {}
  }]);
  return openPromise;
}

describe('open()', () => {
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

    const openPromise = wamp.open(transportProvider, { realm, auth: {
      authId: 'amazing-test-man',
      authMethods: ['ticket', 'whatever'],
      onChallenge,
    }});
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
    expect(onChallenge).toBeCalledTimes(1);

    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Authenticate, 'You dare challenge me?', expect.any(Object)]);

    const expectedWelcomeDetails = { authid: 'amazing-test-man', authrole: 'auth_master', authmethod: 'ticket', roles: {} };
    transportProvider.sendToLib(MessageTypes.Welcome, [1234, expectedWelcomeDetails]);
    const welcomeDetails = await openPromise;

    expect(welcomeDetails).toEqual(expectedWelcomeDetails);
    expect(onOpen).toBeCalledTimes(1);
    expect(onOpen).toBeCalledWith(expectedWelcomeDetails);
  });

  it('allows for custom "agent" to be set for establishing a WAMP connection', async () => {
    wamp.open(transportProvider, { realm, agent: '47' });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, realm, expect.objectContaining({
      agent: '47'
    })]);
  });

  it('throws an error if the transport is closed before a WAMP connection can be opened', async () => {
    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    transportProvider.transport.close();
    await expect(openPromise).rejects.toEqual(expect.anything());
  });

  it('throws an error if the WAMP server sends an ABORT message', async () => {
    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, realm, expect.any(Object)]);
    transportProvider.sendToLib(MessageTypes.Abort, ['some.error.happened', 'no reason at all']);
    await expect(openPromise).rejects.toEqual(expect.anything());
  });

  it('throws an error if the "auth.onChallenge" function has an error', async () => {
    const openPromise = wamp.open(transportProvider, { realm, auth: {
      authId: 'amazing-test-man',
      authMethods: ['ticket', 'whatever'],
      onChallenge: () => { throw Error('Too challenging') },
    }});

    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, realm, expect.any(Object)]);
    transportProvider.sendToLib(MessageTypes.Challenge, ['ticket', {}]);
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Abort, expect.any(Object), 'wamp.error.cannot_authenticate']);

    await expect(openPromise).rejects.toEqual(expect.anything());
  });

  it('throws an error if we try to call "open()" again while the connection is already open. The transport is not opened', async () => {
    await openWamp();
    const newTransportProvider = new MockTransportProvider();
    await expect(wamp.open(newTransportProvider, { realm })).rejects.toEqual(expect.anything());
    expect(newTransportProvider.isOpen).toBe(false);
  });

  it('throws an error if we call "open()" while a previous call to "open()" is in progress. The transport is not opened', async () => {
    wamp.open(transportProvider, { realm });
    const newTransportProvider = new MockTransportProvider();
    await expect(wamp.open(newTransportProvider, { realm })).rejects.toEqual(expect.anything());
    expect(newTransportProvider.isOpen).toBe(false);
  });

  it('closes the transport if any errors occur', async () => {
    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    transportProvider.transport.close();
    await expect(openPromise).rejects.toEqual(expect.anything());
    expect(transportProvider.transport.isClosed).toBe(true);
  });
});

describe('close()', () => {
  it('closes the WAMP connection and the transport', async () => {});
  it('allows custom reason and message to be provided for why the connection is being closed', async () => {});
  it('throws an error if the close operation fails', async () => {});
});

describe('register() and call()', () => {
  it('registers a callback for a URI', async () => {});
  it('responds to call() to the URI', async () => {});
  it('multiple reigstrations are kept separate and handled properly when a call() is made for them', async () => {});
  it('throws an error if an ERROR message is received while registering', async () => {});
  it('throws an error if a GOODBYE message is received while registering', async () => {});
  it('handles errors thrown by registration callbacks and makes the call() throw an error', async () => {});
});

describe('unregister()', () => {
  it('unregisters a registration and the old registration callback no longer responds to any calls to that URI', async () => {});
  it('throws an error if the unregistration fails', async () => {});
});

describe('subscribe() and publish()', () => {
  it('subscribes to the desired URI', async () => {});
  it('calls the subscribed callback when a PUBLISH event is received for the given URI', async () => {});
  it('throws an error if subscription fails', async () => {});
  it('publish() optionally waits for acknowledgement', async () => {});
  it('throws an error if publish operation fails acknowledgement', async () => {});
});

describe('unsubscribe()', () => {
  it('unsubscribes a subscription and the old subscription callback no longer responds to publish events', async () => {});
  it('throws an error if the unsubscribe operation fails', async () => {});
});

describe('misc event handling', () => {
  it('closes properly if the transport gets closed or has an error', async () => {});
  it('closes properly if a GOODBYE message is recevied', async () => {});
});
