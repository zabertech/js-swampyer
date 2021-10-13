import { WebsocketJson } from './websocket_json';

let ws: MockWebSocket;
let constructorArgs: unknown[];

class MockWebSocket {
  public onopen?: () => void;
  public onclose?: () => void;
  public onerror?: () => void;
  public onmessage?: (event: { data: string }) => void;
  constructor(...args: unknown[]) {
    ws = this;
    constructorArgs = args;
  }
  close() {}
}

beforeAll(() => {
  global.WebSocket = MockWebSocket as unknown as typeof WebSocket;
});

afterEach(() => {
  ws = null!;
});

it('opens the websocket connection with the expected arguments', async () => {
  const provider = new WebsocketJson('ws://something/ws');
  provider.open();
  expect(constructorArgs).toEqual(['ws://something/ws', ['wamp.2.json']]);
});

it('parses data from the socket as JSON and sends it along to the underlying transport', async () => {
  const provider = new WebsocketJson('');
  const eventHandler = jest.fn();
  provider.transport.messageEvent.addEventListener(data => eventHandler(data));
  provider.open();

  expect(eventHandler).toBeCalledTimes(0);
  ws.onmessage?.({ data: '["data", 1]' });
  expect(eventHandler).toBeCalledTimes(1);
  expect(eventHandler).toBeCalledWith(['data', 1]);
});

it('informs the underlying transport when the websocket connection opens', async () => {
  const provider = new WebsocketJson('');
  const eventHandler = jest.fn();
  provider.transport.openEvent.addEventListener(() => eventHandler());
  provider.open();

  expect(eventHandler).toBeCalledTimes(0);
  ws.onopen?.();
  expect(eventHandler).toBeCalledTimes(1);
});

it('informs the underlying transport when the websocket connection closes', async () => {
  const provider = new WebsocketJson('');
  const eventHandler = jest.fn();
  provider.transport.closeEvent.addEventListener(err => eventHandler(err));
  provider.open();

  expect(eventHandler).toBeCalledTimes(0);
  ws.onclose?.();
  expect(eventHandler).toBeCalledTimes(1);
  expect(eventHandler).toBeCalledWith(undefined)
});

it('informs the underlying transport when the websocket connection closes with an error', async () => {
  const provider = new WebsocketJson('');
  const eventHandler = jest.fn();
  provider.transport.closeEvent.addEventListener(err => eventHandler(err));
  provider.open();

  expect(eventHandler).toBeCalledTimes(0);
  ws.onerror?.();
  expect(eventHandler).toBeCalledTimes(1);
  expect(eventHandler).toBeCalledWith(expect.any(Error));
});
