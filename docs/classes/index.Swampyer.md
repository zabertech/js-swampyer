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
| `options` | [`OpenOptions`](../interfaces/index.OpenOptions.md) | The options for configuring the WAMP connection |

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

▸ **register**(`uri`, `handler`, `options?`): `Promise`<`number`\>

Register a callback for a WAMP URI

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `uri` | `string` | The URI to register for.  If the `uriBase` options was defined when opening the connection then `uriBase` will be prepended to the provided URI (unless the appropriate value is set in `options`) |
| `handler` | [`RegistrationHandler`](../modules/index.md#registrationhandler) | The callback function that will handle invocations for this uri |
| `options` | [`CommonOptions`](../interfaces/index.CommonOptions.md) | Settings for how the registration should be done. This may vary across WAMP servers |

#### Returns

`Promise`<`number`\>

The registration ID (useful for unregistering)

___

### subscribe

▸ **subscribe**(`uri`, `handler`, `options?`): `Promise`<`number`\>

Subscribe to publish events on a given WAMP URI

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `uri` | `string` | The URI to subscribe to  If the `uriBase` options was defined when opening the connection then `uriBase` will be prepended to the provided URI (unless the appropriate value is set in `options`) |
| `handler` | [`SubscriptionHandler`](../modules/index.md#subscriptionhandler) | The callback function that will handle subscription events for this uri |
| `options` | [`CommonOptions`](../interfaces/index.CommonOptions.md) | Settings for how the subscription should be done. This may vary across WAMP servers |

#### Returns

`Promise`<`number`\>

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

▸ **unsubscribe**(`subscriptionId`): `Promise`<`void`\>

Unsubscribe from an existing subscription

#### Parameters

| Name | Type |
| :------ | :------ |
| `subscriptionId` | `number` |

#### Returns

`Promise`<`void`\>
