export class SwampyerError {
  constructor(public readonly message?: string) {}

  toString() {
    return this.message;
  }
}

export class SwampyerOperationError extends SwampyerError {
  constructor(
    public readonly details?: Object,
    public readonly reason?: string,
    public readonly args?: unknown[],
    public readonly kwargs?: Object
  ) {
    super(reason);
  }

  toString() {
    return `${this.message}\n\n${this.args?.join('\n\n')}`;
  }
}

export class TimeoutError extends SwampyerError {
  constructor(public readonly timeout: number) {
    super(`Operation did not finish before timeout (${timeout} ms)`);
  }
}

export class AbortError extends SwampyerError {
  constructor(public readonly reason: string, public readonly details: Object) {
    super(`Wamp connection could not be established and was aborted: ${reason}`);
  }
}

export class ConnectionOpenError extends SwampyerError {}
export class TransportError extends SwampyerError {}
export class TransportParseError extends SwampyerError { }

export class ConnectionClosedError extends SwampyerError {
  constructor(public readonly reason: string, public readonly details: Object) {
    super(`The WAMP connection has been closed: ${reason}`);
  }
}
