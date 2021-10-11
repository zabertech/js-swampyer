import { Transport } from './transport';

describe('Transport', () => {
  describe('open()', () => {
    it('emits an event once the transport is open and ready for use', async () => {});
  });
  describe('read()', () => {
    it('returns a promise that only resolves when when "_send()" is called', async () => {});
    it('throws an error if the transport is closed', async () => {});
  });
  describe('write()', () => {
    it('emits the "message" event with the same data that "write()" is called with', async () => {});
  });
  describe('close()', () => {
    it('emits the "close" event if closed without error', async () => {});
    it('emits the "close" event and associated error if closed with error', async () => {});
    it('rejects any ongoing "read()" operations', async () => {});
  });
});
