[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / Swampyer

# Class: Swampyer

[index](../modules/index.md).Swampyer

## Table of contents

### Constructors

- [constructor](index.Swampyer.md#constructor)

### Properties

- [closeEvent](index.Swampyer.md#closeevent)
- [openEvent](index.Swampyer.md#openevent)

### Accessors

- [isOpen](index.Swampyer.md#isopen)
- [isReconnecting](index.Swampyer.md#isreconnecting)

### Methods

- [call](index.Swampyer.md#call)
- [close](index.Swampyer.md#close)
- [open](index.Swampyer.md#open)
- [openAutoReconnect](index.Swampyer.md#openautoreconnect)
- [publish](index.Swampyer.md#publish)
- [register](index.Swampyer.md#register)
- [subscribe](index.Swampyer.md#subscribe)
- [unregister](index.Swampyer.md#unregister)
- [unsubscribe](index.Swampyer.md#unsubscribe)

## Constructors

### constructor

• **new Swampyer**()

## Properties

### closeEvent

• `Readonly` **closeEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: `CloseEventData`) => `void`) => () => `void` |
| `waitForNext` | () => `Promise`<`CloseEventData`\> |

___

### openEvent

• `Readonly` **openEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: [[`WelcomeDetails`](../modules/index.md#welcomedetails)]) => `void`) => () => `void` |
| `waitForNext` | () => `Promise`<[[`WelcomeDetails`](../modules/index.md#welcomedetails)]\> |

## Accessors

### isOpen

• `get` **isOpen**(): `boolean`

#### Returns

`boolean`

___

### isReconnecting

• `get` **isReconnecting**(): `boolean`

#### Returns

`boolean`

## Methods

### call

▸ **call**(`uri`, `args?`, `kwargs?`, `options?`): `Promise`<`unknown`\>

Call a WAMP URI and get its result

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `uri` | `string` | `undefined` | The WAMP URI to call  If the `uriBase` options was defined when opening the connection then `uriBase` will be prepended to the provided URI (unless the appropriate value is set in `options`) |
| `args` | `unknown`[] | `[]` | Positional arguments |
| `kwargs` | `Object` | `{}` | Keyword arguments |
| `options` | [`CommonOptions`](../interfaces/index.CommonOptions.md) | `{}` | Settings for how the registration should be done. This may vary between WAMP servers |

#### Returns

`Promise`<`unknown`\>

Arbitrary data returned by the call operation

___

### close

▸ **close**(`reason?`, `message?`): `Promise`<`void`\>

Close the WAMP connection

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `reason` | `string` | `'wamp.close.system_shutdown'` | The reason for the closure |
| `message?` | `string` | `undefined` | Some descriptive message about why the connection is being closed |

#### Returns

`Promise`<`void`\>

___

### open

▸ **open**(`transportProvider`, `options`): `Promise`<[`WelcomeDetails`](../modules/index.md#welcomedetails)\>

Open a WAMP connection.

The library will **not** try to automatically reconnect if the operation fails or if the
connection gets closed.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `transportProvider` | [`TransportProvider`](../interfaces/transports_transport.TransportProvider.md) | The transport provider to open the WAMP connection through |
| `options` | [`OpenOptions`](../interfaces/index.OpenOptions.md) | The options for configuing the WAMP connection |

#### Returns

`Promise`<[`WelcomeDetails`](../modules/index.md#welcomedetails)\>

Details about the successful WAMP session

___

### openAutoReconnect

▸ **openAutoReconnect**(`getTransportProvider`, `options`): `void`

Open a WAMP connection that will automatically reconnect in case of failure or closure.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `getTransportProvider` | (`attempt`: `number`, ...`closeData`: [reason: CloseReason, details: CloseDetails]) => [`TransportProvider`](../interfaces/transports_transport.TransportProvider.md) | A function that should return a fresh TransportProvider for each reconnection attempt.  The `attempt` argument for this callback will be `0` for the initial connection attempt. For all reconnection attempts, the `attempt` value will start from `1`. |
| `options` | `AutoReconnectionOpenOptions` | The options for configuring the WAMP connection |

#### Returns

`void`

___

### publish

▸ **publish**(`uri`, `args?`, `kwargs?`, `options?`): `Promise`<`void`\>

Publish an event on the given WAMP URI

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `uri` | `string` | `undefined` | The WAMP URI to publish the event for  If the `uriBase` options was defined when opening the connection then `uriBase` will be prepended to the provided URI (unless the appropriate value is set in `options`) |
| `args` | `unknown`[] | `[]` | Positional arguments |
| `kwargs` | `Object` | `{}` | Keyword arguments |
| `options` | [`PublishOptions`](../interfaces/index.PublishOptions.md) | `{}` | Settings for how the registration should be done. This may vary between WAMP servers |

#### Returns

`Promise`<`void`\>

___

### register

▸ **register**<`R`, `A`, `K`\>(`uri`, `handler`, `options?`): `Promise`<`number`\>

Register a callback for a WAMP URI

**NOTE**: The library will try to forward as much data as possible from the error
thrown by the {@link handler} function to the caller via the `kwargs`. Make sure that the
errors do not contain any sensitive information.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `R` | `any` |
| `A` | extends `any`[] = `any` |
| `K` | `any` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `uri` | `string` | The URI to register for.  If the `uriBase` options was defined when opening the connection then `uriBase` will be prepended to the provided URI (unless the appropriate value is set in `options`) |
| `handler` | [`RegistrationHandler`](../modules/index.md#registrationhandler)<`R`, `A`, `K`\> | The callback function that will handle invocations for this uri |
| `options` | [`CommonOptions`](../interfaces/index.CommonOptions.md) | Settings for how the registration should be done. This may vary across WAMP servers |

#### Returns

`Promise`<`number`\>

The registration ID (useful for unregistering)

___

### subscribe

▸ **subscribe**<`A`, `K`\>(`uri`, `handler`, `options?`): `Promise`<`SubscriptionIdentifier`\>

Subscribe to publish events on a given WAMP URI.

If a subscription already exists for a given subscription ID then all subscription handlers will
get called when an event occurs on the subscription ID.

#### Type parameters

| Name | Type |
| :------ | :------ |
| `A` | extends `any`[] = `any` |
| `K` | `any` |

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `uri` | `string` | The URI to subscribe to  If the `uriBase` options was defined when opening the connection then `uriBase` will be prepended to the provided URI (unless the appropriate value is set in `options`) |
| `handler` | [`SubscriptionHandler`](../modules/index.md#subscriptionhandler)<`A`, `K`\> | The callback function that will handle subscription events for this uri |
| `options` | [`CommonOptions`](../interfaces/index.CommonOptions.md) | Settings for how the subscription should be done. This may vary across WAMP servers |

#### Returns

`Promise`<`SubscriptionIdentifier`\>

The subscription ID (useful for unsubscribing)

___

### unregister

▸ **unregister**(`registrationId`): `Promise`<`void`\>

Unregister an existing registration

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `registrationId` | `number` | The registration ID returned by [register()](index.Swampyer.md#register) |

#### Returns

`Promise`<`void`\>

___

### unsubscribe

▸ **unsubscribe**(`subscriptionData`, `unsubscribeAll?`): `Promise`<`void`\>

Unsubscribe from all existing subscriptions given a subscription ID.

NOTE: This will clear out any other subscriptions with the same subscription ID as well.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `subscriptionData` | `SubscriptionIdentifier` | The subscription data returned by [subscribe()](index.Swampyer.md#subscribe) |
| `unsubscribeAll?` | `boolean` | Multiple subscriptions can have the same ID if the same client subscribes to the same URI. Set this to `true` if you would like to unsubscribe all existing subscriptions for this client for the given subscription ID. |

#### Returns

`Promise`<`void`\>
