swampyer / [Modules](modules.md)

# js-swampyer

A lightweight WAMP client that implements the [WAMP v2 basic profile](https://wamp-proto.org/_static/gen/wamp_latest.html)

The library is highly promise based. Almost all available operations return a promise. However, it also allows for subscription to various events useful for monitoring the lifecycle of the WAMP connection.

## `Swampyer` class

Basic usage:

```ts
import { Swampyer } from 'swampyer';
import { WebsocketJson } from 'swampyer/lib/transports/websocket_json';

//...

const wamp = new Swampyer();

// Unauthenticated connection
await wamp.open(new WebsocketJson('ws://localhost:8080/ws'), { realm: 'realm1' });

// Authenticated connection
await this.wamp.open(new WebsocketJson('ws://localhost:8080/ws'), {
  realm: 'realm1',
  auth: {
    authId: '<some username here>',
    authMethods: ['ticket'],
    onChallenge: method => '<authentication for the user>',
  }
});

// Use the `wamp` object for the WAMP operations
```

## `SwampyerAutoReconnect` class

This is an alternate class that provides an automatic reconnection mechanism. It provides an `attemptOpen()` method in place of an `open()` method. If the connection can not be established on the first try or if the connection closes for some reason, then it will keep trying to reconnect until it succeeds or `wamp.close()` is called. 

Basic usage:

```ts
import { Swampyer } from 'swampyer';
import { WebsocketJson } from 'swampyer/lib/transports/websocket_json';

//...

const wamp = new SwampyerAutoReconnect(
  { realm: 'realm1' },
  () => new WebsocketJson('ws://localhost:8080/ws')
);
wamp.attemptOpen();

wamp.openEvent.addEventListener(() => {
  // Use the `wamp` object for the WAMP operations
})
```

By default, the delay between each successive reconnection attempt increases up to a maximum of 32000ms. If you want to have more control over the delay between each reconnection attempt then you can use something like the following

```ts
import { Swampyer } from 'swampyer';
import { WebsocketJson } from 'swampyer/lib/transports/websocket_json';

//...

const wamp = new SwampyerAutoReconnect(
  { realm: 'realm1' },
  () => new WebsocketJson('ws://localhost:8080/ws'),
  () => 1000 // The delay between each reconnection attempt will now be 1000ms
);
wamp.attemptOpen();

wamp.openEvent.addEventListener(() => {
  // Use the `wamp` object for the WAMP operations
})
```

## Usage on nodejs

Some adjustments need to be made in order to get this library working in a Nodejs environment:
- Install a websocket implementation for nodejs (here we use [`ws`](https://www.npmjs.com/package/ws) as an examples)
- Run the following at the start of you nodejs code

  ```js
  const ws = require('ws');

  // Other imports ...

  global.WebSocket = ws;

  // Any code that uses Swampyer ...
  ```

  - This will allow `WebsocketJson` transport provider to work properly in the node environment

## Transport Providers

The core library only concerns itself with sending and handling WAMP protocol messages. The method of transporting the WAMP messages to and from a WAMP server, and the serialization/deserialization process is left up to the user. The user must provide a transport provider to the `open()` method in order to establish a successful WAMP connection.

The library optionally provides `WebsocketJson` which is a transport provider that allows connection over Websockets and uses `JSON` to serialize/deserialize the data. This transport provider should satisfy the needs for most users as most WAMP servers communicate over websocket and use the JSON format for the messages.

### Custom Transport providers

If a custom transport method or serialization method is required, then the library allows the user to easily create their own custom transport providers.

Custom transport providers must be a class that implements the `TransportProvider` interface. This ensures that the class implements all the functions that the library needs in order to make use of the transport provider.

See the implementation of `WebsocketJson` to get an idea of how to implement your own custom transport provider.
