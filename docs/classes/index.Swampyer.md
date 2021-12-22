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

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `uri` | `string` | `undefined` |
| `args` | `unknown`[] | `[]` |
| `kwargs` | `Object` | `{}` |
| `options` | `CommonOptions` | `{}` |

#### Returns

`Promise`<`unknown`\>

___

### close

▸ **close**(`reason?`, `message?`): `Promise`<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `reason` | `string` | `'wamp.close.system_shutdown'` |
| `message?` | `string` | `undefined` |

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
| `getTransportProvider` | (`attempt`: `number`, ...`closeData`: [reason: CloseReason, details: CloseDetails]) => [`TransportProvider`](../interfaces/transports_transport.TransportProvider.md) | A function that should return a fresh TransportProvider for each reconnection attempt |
| `options` | [`OpenOptions`](../interfaces/index.OpenOptions.md) | The options for configuring the WAMP connection |

#### Returns

`void`

___

### publish

▸ **publish**(`uri`, `args?`, `kwargs?`, `options?`): `Promise`<`void`\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `uri` | `string` | `undefined` |
| `args` | `unknown`[] | `[]` |
| `kwargs` | `Object` | `{}` |
| `options` | [`PublishOptions`](../interfaces/index.PublishOptions.md) | `{}` |

#### Returns

`Promise`<`void`\>

___

### register

▸ **register**(`uri`, `handler`, `options?`): `Promise`<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `uri` | `string` |
| `handler` | [`RegistrationHandler`](../modules/index.md#registrationhandler) |
| `options` | `CommonOptions` |

#### Returns

`Promise`<`number`\>

___

### subscribe

▸ **subscribe**(`uri`, `handler`, `options?`): `Promise`<`number`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `uri` | `string` |
| `handler` | [`SubscriptionHandler`](../modules/index.md#subscriptionhandler) |
| `options` | `CommonOptions` |

#### Returns

`Promise`<`number`\>

___

### unregister

▸ **unregister**(`registrationId`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `registrationId` | `number` |

#### Returns

`Promise`<`void`\>

___

### unsubscribe

▸ **unsubscribe**(`subscriptionId`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `subscriptionId` | `number` |

#### Returns

`Promise`<`void`\>
