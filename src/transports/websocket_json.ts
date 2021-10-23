import { Transport, TransportProvider } from './transport';

export class WebsocketJson implements TransportProvider {
  private socket?: WebSocket;

  public readonly transport: Transport = new Transport();

  constructor(private url: string | URL) { }

  open() {
    this.socket = new WebSocket(this.url, ['wamp.2.json']);

    this.socket.onopen = () => this.transport.open();
    this.socket.onclose = () => this.transport.close();
    this.socket.onerror = () => this.transport.close(new Error('Websocket connection encountered an error'));
    this.socket.onmessage = event => this.transport.write(JSON.parse(event.data));

    this.readLoop();
  }

  private async readLoop() {
    try {
      while (true) {
        this.socket!.send(JSON.stringify(await this.transport.read()));
      }
    } catch (e) {
      this.socket!.close();
    }
  }
}
