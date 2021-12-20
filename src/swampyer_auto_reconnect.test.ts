import { SwampyerAutoReconnect } from './swampyer_auto_reconnect';
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

const openOptions: OpenOptions = {
  realm: 'test-realm',
}

let transportProvider: MockTransportProvider;
let wamp: SwampyerAutoReconnect;

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

afterEach(() => {
  transportProvider = null!;
  wamp = null!;
  jest.useRealTimers();
});

it(`opens a WAMP connection when ${SwampyerAutoReconnect.prototype.attemptOpen.name}() is used`, async () => {
  const transportProviderFunc = jest.fn(() => (transportProvider = new MockTransportProvider(), transportProvider));
  wamp = new SwampyerAutoReconnect(openOptions, transportProviderFunc);
  wamp.attemptOpen();
  await acceptWampConnection();
  expect(wamp.isOpen).toBe(true);
  expect(transportProviderFunc).toBeCalledTimes(1);
});

it(`throws an error if ${SwampyerAutoReconnect.prototype.open.name}() is used`, async () => {
  wamp = new SwampyerAutoReconnect(openOptions, () => (transportProvider = new MockTransportProvider(), transportProvider));
  expect(() => wamp.open(transportProvider, openOptions)).toThrow(Error);
});

it('attempts reconnections when the WAMP connection can not be opened', async () => {
  jest.useFakeTimers();
  const onClose = jest.fn();
  const transportProviderFunc = jest.fn(() => (transportProvider = new MockTransportProvider(), transportProvider));

  wamp = new SwampyerAutoReconnect(openOptions, transportProviderFunc);
  wamp.closeEvent.addEventListener(onClose);

  wamp.attemptOpen();
  await rejectWampConnection();

  await waitUntilPass(() => expect(onClose).toBeCalledTimes(1))

  expect(transportProviderFunc).toBeCalledTimes(1);
  jest.advanceTimersByTime(2);
  await waitUntilPass(() => expect(transportProviderFunc).toBeCalledTimes(2));

  await acceptWampConnection();
  expect(wamp.isOpen).toBe(true);
});

it('attempts reconnections when the WAMP connection closes for some reason', async () => {
  jest.useFakeTimers();
  const transportProviderFunc = jest.fn(() => (transportProvider = new MockTransportProvider(), transportProvider));

  wamp = new SwampyerAutoReconnect(openOptions, transportProviderFunc);
  wamp.attemptOpen();
  await acceptWampConnection();
  expect(wamp.isOpen).toBe(true);
  expect(transportProviderFunc).toBeCalledTimes(1);

  transportProvider.transport.close();
  expect(wamp.isOpen).toBe(false);

  jest.advanceTimersByTime(2);
  expect(transportProviderFunc).toBeCalledTimes(2);
  await acceptWampConnection();
  expect(wamp.isOpen).toBe(true);
});

it('optionally gets the delay for each reconnection attempt from the user defined function', async () => {
  jest.useFakeTimers();
  const transportProviderFunc = jest.fn(() => (transportProvider = new MockTransportProvider(), transportProvider));
  const delayFunc = jest.fn(attempt => 77);
  const onClose = jest.fn();

  wamp = new SwampyerAutoReconnect(openOptions, transportProviderFunc, delayFunc);
  wamp.closeEvent.addEventListener(onClose);
  wamp.attemptOpen();

  expect(transportProviderFunc).toBeCalledTimes(1);
  expect(delayFunc).toBeCalledTimes(0);

  await rejectWampConnection();
  await waitUntilPass(() => expect(onClose).toBeCalledTimes(1));

  expect(transportProviderFunc).toBeCalledTimes(1);
  expect(delayFunc).toBeCalledTimes(1);

  jest.advanceTimersByTime(70);

  expect(transportProviderFunc).toBeCalledTimes(1);
  expect(delayFunc).toBeCalledTimes(1);

  jest.advanceTimersByTime(10);

  expect(transportProviderFunc).toBeCalledTimes(2);
  expect(delayFunc).toBeCalledTimes(1);

  await acceptWampConnection();
});

it('does not attempt reconnection if the function to get the transport provider returns "null"', async () => {
  jest.useFakeTimers();
  const transportProviderFunc = jest.fn(() => null)
  const delayFunc = jest.fn(attempt => 1);

  wamp = new SwampyerAutoReconnect(openOptions, transportProviderFunc, delayFunc);
  wamp.attemptOpen();

  expect(transportProviderFunc).toBeCalledTimes(1);
  jest.advanceTimersByTime(100);
  expect(transportProviderFunc).toBeCalledTimes(1);
  expect(delayFunc).toBeCalledTimes(0);
});

it('does not attempt reconnection if the function to get delay returns "null"', async () => {
  jest.useFakeTimers();
  const transportProviderFunc = jest.fn(() => (transportProvider = new MockTransportProvider(), transportProvider));
  const delayFunc = jest.fn(() => null);
  const onClose = jest.fn();

  wamp = new SwampyerAutoReconnect(openOptions, transportProviderFunc, delayFunc);
  wamp.closeEvent.addEventListener(onClose);
  wamp.attemptOpen();

  expect(transportProviderFunc).toBeCalledTimes(1);
  expect(delayFunc).toBeCalledTimes(0);

  await rejectWampConnection();
  await waitUntilPass(() => expect(onClose).toBeCalledTimes(1));

  expect(transportProviderFunc).toBeCalledTimes(1);
  expect(delayFunc).toBeCalledTimes(1);

  jest.advanceTimersByTime(100);

  expect(transportProviderFunc).toBeCalledTimes(1);
  expect(delayFunc).toBeCalledTimes(1);
});

it(`does not attempt reconnection if ${SwampyerAutoReconnect.prototype.close.name}() is called`, async () => {
  jest.useFakeTimers();
  const transportProviderFunc = jest.fn(() => (transportProvider = new MockTransportProvider(), transportProvider));
  const delayFunc = jest.fn(() => 1);
  const onClose = jest.fn();

  wamp = new SwampyerAutoReconnect(openOptions, transportProviderFunc, delayFunc);
  wamp.closeEvent.addEventListener(onClose);
  wamp.attemptOpen();
  await acceptWampConnection();

  wamp.close();
  await transportProvider.transport.read();
  transportProvider.sendToLib(MessageTypes.Goodbye, [{}, 'com.fine.go.away.then']);
  await waitUntilPass(() => expect(onClose).toBeCalledTimes(1));

  jest.advanceTimersByTime(100);

  expect(onClose).toBeCalledTimes(1);
  expect(transportProviderFunc).toBeCalledTimes(1);
  expect(delayFunc).toBeCalledTimes(0);
});
