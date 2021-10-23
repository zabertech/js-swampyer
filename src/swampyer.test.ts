import { Swampyer } from './swampyer';

describe('open()', () => {
  it('can establish an unauthenticated WAMP connection if no auth data is provided', async () => {});
  it('can establish an authenticated WAMP connection if auth data is provided', async () => {});
  it('throws an error if the transport is closed before a WAMP connection can be opened', async () => {});
  it('throws an error if the WAMP server sends an ABORT message', async () => {});
  it('throws an error if the "auth.onChallenge" function has an error', async () => {});
  it('throws an error if we try to call "open()" again while the connection is already open', async () => {});
  it('throws an error if we call "open()" while a previous call to "open()" is still in progress', async () => {});
  it('closes the transport if any errors occur', async () => {});
  it('emits an event on the "openEvent" event listener', async () => {});
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
