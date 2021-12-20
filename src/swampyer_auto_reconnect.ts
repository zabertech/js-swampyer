import { Swampyer } from './swampyer';
import { TransportProvider } from './transports/transport';
import { CloseDetails, CloseReason, OpenOptions, WelcomeDetails } from './types';

type CloseEventData = [closeReason: CloseReason, closeDetails: CloseDetails];

export const DEFAULT_RECONNECTION_DELAYS = [1, 10, 100, 1000, 2000, 4000, 8000, 16000, 32000];
function defaultGetReconnectionDelay(attempt: number) {
  return DEFAULT_RECONNECTION_DELAYS[Math.min(attempt, DEFAULT_RECONNECTION_DELAYS.length - 1)];
}

export class SwampyerAutoReconnect extends Swampyer {
  private attempt = 0;

  constructor(
    private options: OpenOptions,
    private getTransportProvider: (attempt: number, ...closeData: Partial<CloseEventData>) => TransportProvider | null,
    getReconnectionDelay: (attempt: number, ...closeData: CloseEventData) => number | null = defaultGetReconnectionDelay
  ) {
    super();

    this.closeEvent.addEventListener((reason, details) => {
      if (reason === 'close_method') {
        return;
      }

      const delay = getReconnectionDelay(this.attempt, reason, details);
      if (delay == null) {
        return;
      }

      setTimeout(() => this._attemptOpen(reason, details), delay);
      this.attempt ++;
    });

    this.openEvent.addEventListener(() => {
      this.attempt = 0;
    });
  }

  /** This function is not supported on this class. Please use {@link attemptOpen} instead. */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  open(...args: Parameters<InstanceType<typeof Swampyer>['open']>): Promise<WelcomeDetails> {
    throw new Error(`${this.open.name}() is not supported on ${SwampyerAutoReconnect.name}. Use ${this.attemptOpen.name}() instead.`);
  }

  /**
   * Starts the process of openinig the WAMP connection. It will handle auto reconnection if the
   * open operation fails or if the connection closes at any point.
   */
  attemptOpen() {
    this._attemptOpen();
  }

  private _attemptOpen(...[closeReason, closeDetails]: Partial<CloseEventData>) {
    const transportProvider = this.getTransportProvider(this.attempt, closeReason, closeDetails);
    if (transportProvider != null) {
      void super.open(transportProvider, this.options).catch(() => { /* Not used */ });
    }
  }
}
