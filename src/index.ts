class Swampyer {
  private socket: WebSocket;

  constructor(public readonly url: string, public readonly realm: string) {
    console.log('SWAMPYER CONSTRUCTOR');
    this.setupConnection();
  }

  async setupConnection() {
    this.socket = new WebSocket(this.url, ['wamp.2.json']);

    await new Promise<void>((resolve, reject) => {
      // TODO cleanup these event listeners after we are done with them

      this.socket.addEventListener('open', e => {
        console.log('SOCKET OPEN', e);
        resolve();
      });

      this.socket.addEventListener('error', e => {
        console.log('SOCKET ERROR', e);
        reject();
      })
    });
  }
}
