/* eslint-disable @typescript-eslint/no-floating-promises */
import { TransportError, AbortError, ConnectionOpenError, SwampyerOperationError, ConnectionClosedError } from './errors';
import { Swampyer } from './swampyer';
import { Transport, TransportProvider } from './transports/transport';
import { MessageData, MessageTypes, OpenOptions } from './types';
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

  it('throws an error if the transport is closed before a WAMP connection can be opened. The close event is emiited', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    transportProvider.transport.close();
    await expect(openPromise).rejects.toThrow(TransportError);
    expect(onClose).toBeCalledTimes(1);
  });

  it('throws an error if the WAMP server sends an ABORT message. The close event is emiited', async () => {
    const onClose = jest.fn();
    wamp.closeEvent.addEventListener(onClose);

    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, realm, expect.any(Object)]);
    transportProvider.sendToLib(MessageTypes.Abort, ['some.error.happened', 'no reason at all']);
    await expect(openPromise).rejects.toThrow(AbortError);
    expect(onClose).toBeCalledTimes(1);
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

    await expect(openPromise).rejects.toThrow(AbortError);
    expect(onClose).toBeCalledTimes(1);
  });

  it('throws an error if we try to call "open()" again while the connection is already open. The transport is not opened', async () => {
    await openWamp();
    const newTransportProvider = new MockTransportProvider();
    await expect(wamp.open(newTransportProvider, { realm })).rejects.toThrow(ConnectionOpenError);
    expect(newTransportProvider.isOpen).toBe(false);
  });

  it('throws an error if we call "open()" while a previous call to "open()" is in progress. The transport is not opened', async () => {
    wamp.open(transportProvider, { realm });
    const newTransportProvider = new MockTransportProvider();
    await expect(wamp.open(newTransportProvider, { realm })).rejects.toThrow(ConnectionOpenError);
    expect(newTransportProvider.isOpen).toBe(false);
  });

  it('closes the transport if any errors occur', async () => {
    const openPromise = wamp.open(transportProvider, { realm });
    await waitUntilPass(() => expect(transportProvider.isOpen).toBe(true));
    transportProvider.transport.close();
    await expect(openPromise).rejects.toThrow(TransportError);
    expect(transportProvider.transport.isClosed).toBe(true);
  });
});

describe('close()', () => {
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

describe('register()', () => {
  beforeEach(async () => {
    await openWamp();
  });

  it('registers an (async) callback for a URI and responds to call() on that URI', async () => {
    const regHandler = jest.fn().mockResolvedValue('fancy result');
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

    await expect(regPromise).rejects.toThrow(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received while registering', async () => {
    const regHandler = jest.fn().mockResolvedValue('fancy result');
    const regPromise = wamp.register('com.test.something', regHandler);
    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);

    await expect(regPromise).rejects.toThrow(ConnectionClosedError);
  });

  it('handles errors thrown by registration callbacks and returns the error to the caller', async () => {
    const regHandler = jest.fn().mockRejectedValue('Some error');
    const regPromise = wamp.register('com.test.something', regHandler);
    const regRequest = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Registered, [regRequest[1] as number, 1234]);
    await regPromise;

    transportProvider.sendToLib(MessageTypes.Invocation, [5656, 1234, {}, ['args over here'], {}]);

    expect(await transportProvider.transport.read()).toEqual(
      [MessageTypes.Error, MessageTypes.Invocation, 5656, {}, expect.any(String), ['Some error'], {}]
    );
  });
});

describe('call()', () => {
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
    await expect(promise).rejects.toThrow(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received before the call can be finished', async () => {
    const promise = wamp.call('com.test.something', args, kwargs);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Call, expect.any(Number), {}, 'com.test.something', args, kwargs]);
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toThrow(ConnectionClosedError);
  });
});

describe('unregister()', () => {
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
    await expect(promise).rejects.toThrow(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE event occurs while unregistering', async () => {
    const promise = wamp.unregister(regId);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unregister, expect.any(Number), regId]);
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toThrow(ConnectionClosedError);
  });
});

describe('subscribe()', () => {
  beforeEach(async () => {
    await openWamp();
  });

  it('subscribes to the desired URI and handles publish events', async () => {
    const subHandler = jest.fn();
    const promise = wamp.subscribe('com.some.uri', subHandler);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Subscribe, expect.any(Number), expect.any(Object), 'com.some.uri']);
    transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, 1234]);
    await promise;

    const args = [2, 'args'];
    const kwargs = { one: 'kwarg' };
    const details = {};
    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, details, args, kwargs]);
    expect(subHandler).toBeCalledTimes(1);
    expect(subHandler).toBeCalledWith(args, kwargs, details);
  });

  it('multiple subscriptions can co-exist', async () => {
    const subHandler1 = jest.fn();
    const promise1 = wamp.subscribe('com.some.uri', subHandler1);
    const request1 = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Subscribed, [request1[1] as number, 1234]);
    await promise1;

    const subHandler2 = jest.fn();
    const promise2 = wamp.subscribe('com.some.uri', subHandler2);
    const request2 = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Subscribed, [request2[1] as number, 9876]);
    await promise2;

    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, ['for 1st sub'], {}]);
    transportProvider.sendToLib(MessageTypes.Event, [9876, 6666, {}, ['for 2nd sub'], {}]);

    expect(subHandler1).toBeCalledWith(['for 1st sub'], {}, {});
    expect(subHandler2).toBeCalledWith(['for 2nd sub'], {}, {});
  });

  it('throws an error if subscription fails', async () => {
    const subHandler = jest.fn();
    const promise = wamp.subscribe('com.some.uri', subHandler);
    const request = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Subscribe, request[1] as number, {}, 'something bad', [], {}]);
    await expect(promise).rejects.toThrow(SwampyerOperationError);
  });

  it('throws an error if GOODBYE event occurs before subscribe operation finishes', async () => {
    const subHandler = jest.fn();
    const promise = wamp.subscribe('com.some.uri', subHandler);
    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toThrow(ConnectionClosedError);
  });

  it('does nothing if subscription handler throws an error', async () => {
    const subHandler = jest.fn(() => { throw Error('I never subscribed to this!') });
    const promise = wamp.subscribe('com.some.uri', subHandler);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Subscribe, expect.any(Number), expect.any(Object), 'com.some.uri']);
    transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, 1234]);
    await promise;

    transportProvider.sendToLib(MessageTypes.Event, [1234, 5555, {}, ['args'], {}]);
    expect(subHandler).toBeCalledTimes(1);
  });
});

describe('publish()', () => {
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
    await expect(promise).rejects.toThrow(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received before publish acknowledgement is received', async () => {
    const promise = wamp.publish('com.some.uri', ['something'], { something: 'else' }, { acknowledge: true });
    await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toThrow(ConnectionClosedError);
  });
});

describe('unsubscribe()', () => {
  const subId = 1234;

  let handler: jest.Mock;

  beforeEach(async () => {
    await openWamp();

    handler = jest.fn();
    const promise = wamp.subscribe('com.some.uri', handler);
    const request = await transportProvider.transport.read();
    transportProvider.sendToLib(MessageTypes.Subscribed, [request[1] as number, subId]);
    await promise;
  });

  it('unsubscribes a subscription and the old subscription callback no longer responds to publish events', async () => {
    const promise = wamp.unsubscribe(subId);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unsubscribe, expect.any(Number), subId]);
    transportProvider.sendToLib(MessageTypes.Unsubscribed, [request[1] as number]);
    await promise;
  });

  it('throws an error if the unsubscribe operation fails', async () => {
    const promise = wamp.unsubscribe(subId);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unsubscribe, expect.any(Number), subId]);
    transportProvider.sendToLib(MessageTypes.Error, [MessageTypes.Unsubscribe, request[1] as number, {}, 'something bad', [], {}]);
    await expect(promise).rejects.toThrow(SwampyerOperationError);
  });

  it('throws an error if a GOODBYE message is received before unsubscribe operation finishes', async () => {
    const promise = wamp.unsubscribe(subId);
    const request = await transportProvider.transport.read();
    expect(request).toEqual([MessageTypes.Unsubscribe, expect.any(Number), subId]);
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await expect(promise).rejects.toThrow(ConnectionClosedError);
  });
});

describe('misc event handling', () => {
  beforeEach(async () => {
    await openWamp();
  });

  it('closes properly if the transport gets closed or has an error', async () => {
    transportProvider.transport.close();
    await waitUntilPass(() => expect(wamp.isOpen).toBe(false));
  });

  it('closes properly if a GOODBYE message is recevied', async () => {
    transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.some.reason']);
    await waitUntilPass(() => expect(wamp.isOpen).toBe(false));
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
