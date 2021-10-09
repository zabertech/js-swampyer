// TODO make sure that all usage of this type is justified
export type UnknownObject = Record<string | number | symbol, unknown>;

export enum AuthMethod {
  Cookie = 'cookie',
  Ticket = 'ticket',
  Anonymous = 'anonymous',
}

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

export type BaseMessage = [MessageTypes, ...unknown[]];
export interface MessageData {
  [MessageTypes.Hello]: [realm: string, details: Record<string, unknown> ];
  [MessageTypes.Welcome]: [sessionId: number, details: Record<string, unknown>];
  [MessageTypes.Abort]: [details: UnknownObject, reason: string];
  [MessageTypes.Challenge]: [authMethod: AuthMethod, extra: Record<string, unknown>];
  [MessageTypes.Authenticate]: [signature: string, extra: Record<string, unknown>];
  [MessageTypes.Goodbye]: [details: UnknownObject, reason: string];
  [MessageTypes.Error]: [
    requestMessageType: MessageTypes, requestId: number, details: UnknownObject, error: string,
    args: unknown[], kwargs: UnknownObject
  ];
  [MessageTypes.Publish]: [requestId: number, options: PublishOptions, topic: string, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Published]: [requestId: number, publicationId: number];
  [MessageTypes.Subscribe]: [requestId: number, options: UnknownObject, topic: string];
  [MessageTypes.Subscribed]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribe]: [requestId: number, subscriptionId: number];
  [MessageTypes.Unsubscribed]: [requestId: number];
  [MessageTypes.Event]: [subscriptionId: number, publishId: number, details: UnknownObject, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Call]: [requestId: number, options: UnknownObject, procedure: string, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Result]: [requestId: number, details: UnknownObject, resultArray: unknown[], resultObj: UnknownObject];
  [MessageTypes.Register]: [requestId: number, details: UnknownObject, procedure: string];
  [MessageTypes.Registered]: [requestId: number, registrationId: number];
  [MessageTypes.Unregister]: [requestId: number, registrationId: number];
  [MessageTypes.Unregistered]: [requestId: number];
  [MessageTypes.Invocation]: [requestId: number, registrationId: number, details: UnknownObject, args: unknown[], kwargs: UnknownObject];
  [MessageTypes.Yield]: [requestId: number, options: UnknownObject, args: unknown[], kwargs: UnknownObject];
  // TODO properly define the unknown[] types
}

export type SubscriptionHandler = (args: unknown[], kwargs: UnknownObject) => void;
export type RegistrationHandler = (args: unknown[], kwargs: UnknownObject) => void;

export interface PublishOptions {
  acknowledge?: boolean;
}
