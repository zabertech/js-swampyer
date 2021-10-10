import { Transport, TransportProvider } from './transport';

export class WebsocketJsonTransport implements TransportProvider {
  private socket: WebSocket;

  public readonly transport: Transport;

  constructor(...args: ConstructorParameters<typeof WebSocket>) {
    this.socket = new WebSocket(...args);
    this.transport = new Transport();

    this.socket.onopen = () => this.transport.open();
    this.socket.onclose = () => this.transport.close();
    this.socket.onerror = () => this.transport.close(new Error('Websocket connection has been closed'));
    this.socket.onmessage = event => this.transport.write(JSON.parse(event.data));
  }

  async readLoop() {
    while (true) {
      this.socket.send(JSON.stringify(await this.transport.read()));
    }
  }
}
