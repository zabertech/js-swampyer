import { waitUntilPass } from '../utils';
import { Transport } from './transport';

describe('Transport', () => {
  describe('open()', () => {
    it('emits an event once the transport is open and ready for use', async () => {
      const transport = new Transport();
      const openHandler = jest.fn();
      transport.openEvent.addEventListener(() => openHandler());

      expect(openHandler).toBeCalledTimes(0);
      transport.open();
      expect(openHandler).toBeCalledTimes(1);
    });
  });

  describe('read()', () => {
    it('returns a promise that only resolves when "_send()" is called', async () => {
      const transport = new Transport();
      const onRead = jest.fn();
      transport.read().then(res => onRead(res));

      expect(onRead).toBeCalledTimes(0);
      transport._send(0, ['test']);
      await waitUntilPass(() => expect(onRead).toBeCalledTimes(1));
      expect(onRead).toBeCalledWith([0, 'test']);
    });

    it('queues messages if nothing is waiting on a "read()". The next "read()" gives queued message in FIFO way', async () => {
      const transport = new Transport();

      transport._send(0, ['test 1']);
      expect(await transport.read()).toEqual([0, 'test 1']);

      transport._send(0, ['test 2']);
      transport._send(0, ['test 3']);
      expect(await transport.read()).toEqual([0, 'test 2']);
      expect(await transport.read()).toEqual([0, 'test 3']);
    });

    it('throws an error if the transport is already closed', async () => {
      const transport = new Transport();
      transport.close();
      expect(transport.read()).rejects.toEqual(expect.anything())
    });
  });

  describe('write()', () => {
    it('emits the "message" event with the same data that "write()" is called with', async () => {
      const transport = new Transport();
      const messageHandler = jest.fn();
      transport.messageEvent.addEventListener(msg => messageHandler(msg));

      expect(messageHandler).toBeCalledTimes(0);
      transport.write([0, 'test']);
      expect(messageHandler).toBeCalledTimes(1);
      expect(messageHandler).toBeCalledWith([0, 'test']);
    });
  });

  describe('close()', () => {
    it('emits the "close" event if closed without error', async () => {
      const transport = new Transport();
      const closeHandler = jest.fn();
      transport.closeEvent.addEventListener(err => closeHandler(err));

      expect(closeHandler).toBeCalledTimes(0);
      transport.close();
      await waitUntilPass(() => expect(closeHandler).toBeCalledTimes(1));
      expect(closeHandler).toBeCalledWith(undefined);
    });

    it('emits the "close" event and associated error if closed with error', async () => {
      const transport = new Transport();
      const closeHandler = jest.fn();
      const error = new Error('test');
      transport.closeEvent.addEventListener(err => closeHandler(err));

      expect(closeHandler).toBeCalledTimes(0);
      transport.close(error);
      await waitUntilPass(() => expect(closeHandler).toBeCalledTimes(1));
      expect(closeHandler).toBeCalledWith(error);
    });

    it('rejects any ongoing "read()" operations', async () => {
      const transport = new Transport();
      const onErr = jest.fn();
      transport.read().catch(err => onErr(err));

      expect(onErr).toBeCalledTimes(0);
      transport.close();
      await waitUntilPass(() => expect(onErr).toBeCalledTimes(1));
    });
  });
});
