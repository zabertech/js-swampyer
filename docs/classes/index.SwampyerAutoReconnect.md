[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / SwampyerAutoReconnect

# Class: SwampyerAutoReconnect

[index](../modules/index.md).SwampyerAutoReconnect

## Hierarchy

- [`Swampyer`](index.Swampyer.md)

  ↳ **`SwampyerAutoReconnect`**

## Table of contents

### Constructors

- [constructor](index.SwampyerAutoReconnect.md#constructor)

### Properties

- [closeEvent](index.SwampyerAutoReconnect.md#closeevent)
- [openEvent](index.SwampyerAutoReconnect.md#openevent)

### Accessors

- [isOpen](index.SwampyerAutoReconnect.md#isopen)

### Methods

- [attemptOpen](index.SwampyerAutoReconnect.md#attemptopen)
- [call](index.SwampyerAutoReconnect.md#call)
- [close](index.SwampyerAutoReconnect.md#close)
- [open](index.SwampyerAutoReconnect.md#open)
- [publish](index.SwampyerAutoReconnect.md#publish)
- [register](index.SwampyerAutoReconnect.md#register)
- [subscribe](index.SwampyerAutoReconnect.md#subscribe)
- [unregister](index.SwampyerAutoReconnect.md#unregister)
- [unsubscribe](index.SwampyerAutoReconnect.md#unsubscribe)

## Constructors

### constructor

• **new SwampyerAutoReconnect**(`options`, `getTransportProvider`, `getReconnectionDelay?`)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `options` | [`OpenOptions`](../interfaces/index.OpenOptions.md) | `undefined` |
| `getTransportProvider` | (`attempt`: `number`, ...`closeData`: [closeReason: CloseReason, closeDetails: CloseDetails]) => ``null`` \| [`TransportProvider`](../interfaces/transports_transport.TransportProvider.md) | `undefined` |
| `getReconnectionDelay` | (`attempt`: `number`, ...`closeData`: `CloseEventData`) => ``null`` \| `number` | `defaultGetReconnectionDelay` |

#### Overrides

[Swampyer](index.Swampyer.md).[constructor](index.Swampyer.md#constructor)

## Properties

### closeEvent

• `Readonly` **closeEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: [reason: CloseReason, details: CloseDetails]) => `void`) => () => `void` |

#### Inherited from

[Swampyer](index.Swampyer.md).[closeEvent](index.Swampyer.md#closeevent)

___

### openEvent

• `Readonly` **openEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: [[`WelcomeDetails`](../modules/index.md#welcomedetails)]) => `void`) => () => `void` |

#### Inherited from

[Swampyer](index.Swampyer.md).[openEvent](index.Swampyer.md#openevent)

## Accessors

### isOpen

• `get` **isOpen**(): `boolean`

#### Returns

`boolean`

#### Inherited from

Swampyer.isOpen

## Methods

### attemptOpen

▸ **attemptOpen**(): `void`

Starts the process of openinig the WAMP connection. It will handle auto reconnection if the
open operation fails or if the connection closes at any point.

#### Returns

`void`

___

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

#### Inherited from

[Swampyer](index.Swampyer.md).[call](index.Swampyer.md#call)

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

#### Inherited from

[Swampyer](index.Swampyer.md).[close](index.Swampyer.md#close)

___

### open

▸ **open**(...`args`): `Promise`<[`WelcomeDetails`](../modules/index.md#welcomedetails)\>

This function is not supported on this class. Please use [attemptOpen](index.SwampyerAutoReconnect.md#attemptopen) instead.

#### Parameters

| Name | Type |
| :------ | :------ |
| `...args` | [transportProvider: TransportProvider, options: OpenOptions] |

#### Returns

`Promise`<[`WelcomeDetails`](../modules/index.md#welcomedetails)\>

#### Overrides

[Swampyer](index.Swampyer.md).[open](index.Swampyer.md#open)

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

#### Inherited from

[Swampyer](index.Swampyer.md).[publish](index.Swampyer.md#publish)

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

#### Inherited from

[Swampyer](index.Swampyer.md).[register](index.Swampyer.md#register)

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

#### Inherited from

[Swampyer](index.Swampyer.md).[subscribe](index.Swampyer.md#subscribe)

___

### unregister

▸ **unregister**(`registrationId`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `registrationId` | `number` |

#### Returns

`Promise`<`void`\>

#### Inherited from

[Swampyer](index.Swampyer.md).[unregister](index.Swampyer.md#unregister)

___

### unsubscribe

▸ **unsubscribe**(`subscriptionId`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `subscriptionId` | `number` |

#### Returns

`Promise`<`void`\>

#### Inherited from

[Swampyer](index.Swampyer.md).[unsubscribe](index.Swampyer.md#unsubscribe)
