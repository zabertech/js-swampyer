import { Transport, TransportProvider } from './transport';

export class WebsocketJsonTransport implements TransportProvider {
  private socket: WebSocket;

  public readonly transport: Transport;

  constructor(url: string | URL) {
    this.socket = new WebSocket(url, ['wamp.2.json']);
    this.transport = new Transport();

    this.socket.onopen = () => this.transport.open();
    this.socket.onclose = () => this.transport.close();
    this.socket.onerror = () => this.transport.close(new Error('Websocket connection has been closed'));
    this.socket.onmessage = event => this.transport.write(JSON.parse(event.data));

    this.readLoop();
  }

  private async readLoop() {
    try {
      while (true) {
        this.socket.send(JSON.stringify(await this.transport.read()));
      }
    } finally {
      this.socket.close();
    }
  }
}
