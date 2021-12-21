import { SwampyerError } from './errors';

export enum MessageTypes {
  Hello = 1,
  Welcome = 2,
  Abort = 3,
  Challenge = 4,
  Authenticate = 5,
  Goodbye = 6,
  Error = 8,

  Publish = 16,
  Published = 17,

  Subscribe = 32,
  Subscribed = 33,
  Unsubscribe = 34,
  Unsubscribed = 35,
  Event = 36,

  Call = 48,
  Result = 50,

  Register = 64,
  Registered = 65,
  Unregister = 66,
  Unregistered = 67,
  Invocation = 68,
  Yield = 70,
}

export type WampMessage = [MessageTypes, ...unknown[]];
export interface MessageData {
  [MessageTypes.Hello]: [realm: string, details: Record<string, unknown> ];
  [MessageTypes.Welcome]: [sessionId: number, details: WelcomeDetails];
  [MessageTypes.Abort]: [details: Object, reason: string];
  [MessageTypes.Challenge]: [authMethod: string, extra: Record<string, unknown>];
  [MessageTypes.Authenticate]: [signature: string, extra: Record<string, unknown>];
  [MessageTypes.Goodbye]: [details: Object, reason: string];
  [MessageTypes.Error]: [
    requestMessageType: MessageTypes, requestId: number, details: Object, error: string,
    args: unknown[], kwargs: Object
  ];
  [MessageTypes.Publish]: [requestId: number, options: PublishOptions, topic: string, args: unknown[], kwargs: Object];
  [MessageTypes.Published]: [requestId: number, publicationId: number];
  [MessageTypes.Subscribe]: [requestId: number, options: Object, topic: string];
  [MessageTypes.Subscribed]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribe]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribed]: [requestId: number];
  [MessageTypes.Event]: [subscriptionId: number, publishId: number, details: Object, args: unknown[], kwargs: Object];
  [MessageTypes.Call]: [requestId: number, options: Object, procedure: string, args: unknown[], kwargs: Object];
  [MessageTypes.Result]: [requestId: number, details: Object, resultArray: unknown[], resultObj: Object];
  [MessageTypes.Register]: [requestId: number, details: Object, procedure: string];
  [MessageTypes.Registered]: [requestId: number, registrationId: number];
  [MessageTypes.Unregister]: [requestId: number, registrationId: number];
  [MessageTypes.Unregistered]: [requestId: number];
  [MessageTypes.Invocation]: [requestId: number, registrationId: number, details: Object, args: unknown[], kwargs: Object];
  [MessageTypes.Yield]: [requestId: number, options: Object, args: unknown[], kwargs: Object];
}

export type SubscriptionHandler = (args: unknown[], kwargs: Object, details: Object) => void;
export type RegistrationHandler = (args: unknown[], kwargs: Object, details: Object) => void;

export type WelcomeDetails = {
  authid: string;
  authrole: string;
  authmethod: string;
  roles: Record<string, unknown>;
  authprovider?: string;
  realm?: string;
}

export interface OpenOptions {
  /**
   * The realm to connect to on the WAMP server
   */
  realm: string;
  /**
   * An identifier for this client connection which may be used by the WAMP server for logging
   * purposes
   */
  agent?: string;
  /**
   * This string will be prepended to all of your URI cased WAMP operations. This can be a
   * convenient way to shorten the WAMP URIs by defining the common part of the WAMP URIs
   * here.
   *
   * The final URI that gets used for communicating with the WAMP server ends up being
   * `{uriBase}.{URI of operation}`.
   *
   * It is also possible to disable the use of `uriBase` for a given WAMP operation by setting
   * the `withoutUriBase` option for the operations that support that option
   *
   * @example Setting this to `com.company.something` will allow you to shorten a `call()` to
   * `com.company.something.my.fancy_registration` down to a `call()` to `my.fancy_registration`
   */
  uriBase?: string;
  /**
   * Optional authentication data
   *
   * If this is not defined then the library will try to authenticate using the `anonymous`
   * `authMethod`. Omit this if you only need `anonymous` access.
   */
  auth?: {
    /**
     * The username or ID to authenticate as.
     *
     * This value depends on the `authMethods` selected and the settings of your WAMP server.
     */
    authId: string;
    /**
     * Could be values like `anonymous`, `ticket`, `cookie`, etc.
     *
     * Refer to your WAMP server's settings to find out which auth methods are supported.
     */
    authMethods: string[];
    /**
     * Handle authentication challenge from the WAMP server.
     *
     * Depending on the auth method requested by the server, this could return things like the
     * password of the user we are trying to authenticate as.
     */
    onChallenge: (authMethod: string) => string;
  };
  /**
   * Define a custom delay between reconnection attempts. If this function returns `null` or
   * any number <= 0 then the library will no longer try to reconnect.
   * 
   * If this function is not defined then the library will use a delay that increases with
   * each successive reconnection attempt (up to a maximum of 32000ms)
   */
  autoReconnectionDelay?: (attempt: number, ...closeData: CloseEventData) => number | null;
}

export type CloseReason = 'transport_error' | 'transport_close' | 'open_error' | 'goodbye' | 'close_method';
export interface CloseDetails {
  /** This value will only be defined if the connection was closed due to some error */
  error?: SwampyerError;
  /** This value will only be defined if the connection was closed due to a GOODBYE event */
  goodbye?: {
    reason: string;
    details: Object;
  };
}
export type CloseEventData = [reason: CloseReason, details: CloseDetails];

interface CommonOptions {
  /** If true, the `uriBase` will not be prepended to the provided URI for this operation */
  withoutUriBase?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export type RegisterOptions = CommonOptions;
export type CallOptions = CommonOptions;

export type SubscribeOptions = CommonOptions;
export interface PublishOptions extends CommonOptions {
  /**
   * Asks the WAMP server to acknowledge that the publish call has been fulfilled. `publish()`
   * will wait for the acknowledgement from the WAMP server if this option is set to `true`.
   */
  acknowledge?: boolean;
}
