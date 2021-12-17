import { SwampyerAutoReconnect } from './swampyer_auto_reconnect';
import { Transport, TransportProvider } from './transports/transport';
import { MessageData, MessageTypes, OpenOptions } from './types';

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

async function doSuccessfulWampConnection() {
  expect(await transportProvider.transport.read()).toEqual([MessageTypes.Hello, 'test-realm', expect.any(Object)]);
  transportProvider.sendToLib(MessageTypes.Welcome, [1234, {
    authid: 'someone',
    authrole: 'auth_master',
    authmethod: 'anonymous',
    roles: {}
  }]);
}

afterEach(() => {
  transportProvider = null!;
  wamp = null!;
});

it(`opens a WAMP connection when ${SwampyerAutoReconnect.prototype.attemptOpen.name}() is used`, async () => {
  wamp = new SwampyerAutoReconnect(openOptions, () => (transportProvider = new MockTransportProvider(), transportProvider));
  wamp.attemptOpen();
  await doSuccessfulWampConnection();
  expect(wamp.isOpen).toBe(true);
});

it(`throws an error if ${SwampyerAutoReconnect.prototype.open.name}() is used`, async () => {
  wamp = new SwampyerAutoReconnect(openOptions, () => (transportProvider = new MockTransportProvider(), transportProvider));
  expect(() => wamp.open(transportProvider, openOptions)).toThrow(Error);
});

it('attempts reconnections when the WAMP connection closes for some reason', async () => {});
it('attempts reconnections when the WAMP connection can not be opened', async () => {});
it('gets a new transport provider for each reconnection attempt', async () => {});
it('stops trying to reconnect if the function to get the transport provider returns "null"', async () => {});
it('optionally gets the delay for each reconnection attempt from the user defined function', async () => {});
it('stops trying to reconnect if the function to get delay returns "null"', async () => {});
