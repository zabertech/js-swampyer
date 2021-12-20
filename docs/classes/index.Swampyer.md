[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / Swampyer

# Class: Swampyer

[index](../modules/index.md).Swampyer

## Hierarchy

- **`Swampyer`**

  ↳ [`SwampyerAutoReconnect`](index.SwampyerAutoReconnect.md)

## Table of contents

### Constructors

- [constructor](index.Swampyer.md#constructor)

### Properties

- [closeEvent](index.Swampyer.md#closeevent)
- [openEvent](index.Swampyer.md#openevent)

### Accessors

- [isOpen](index.Swampyer.md#isopen)

### Methods

- [call](index.Swampyer.md#call)
- [close](index.Swampyer.md#close)
- [open](index.Swampyer.md#open)
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
| `addEventListener` | (`callback`: (...`args`: [reason: CloseReason, details: CloseDetails]) => `void`) => () => `void` |

#### Defined in

[src/swampyer.ts:29](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L29)

___

### openEvent

• `Readonly` **openEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: [[`WelcomeDetails`](../modules/index.md#welcomedetails)]) => `void`) => () => `void` |

#### Defined in

[src/swampyer.ts:28](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L28)

## Accessors

### isOpen

• `get` **isOpen**(): `boolean`

#### Returns

`boolean`

#### Defined in

[src/swampyer.ts:31](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L31)

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

#### Defined in

[src/swampyer.ts:155](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L155)

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

#### Defined in

[src/swampyer.ts:116](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L116)

___

### open

▸ **open**(`transportProvider`, `options`): `Promise`<[`WelcomeDetails`](../modules/index.md#welcomedetails)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `transportProvider` | [`TransportProvider`](../interfaces/transports_transport.TransportProvider.md) |
| `options` | [`OpenOptions`](../interfaces/index.OpenOptions.md) |

#### Returns

`Promise`<[`WelcomeDetails`](../modules/index.md#welcomedetails)\>

#### Defined in

[src/swampyer.ts:35](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L35)

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

#### Defined in

[src/swampyer.ts:180](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L180)

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

#### Defined in

[src/swampyer.ts:137](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L137)

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

#### Defined in

[src/swampyer.ts:164](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L164)

___

### unregister

▸ **unregister**(`registrationId`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `registrationId` | `number` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/swampyer.ts:147](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L147)

___

### unsubscribe

▸ **unsubscribe**(`subscriptionId`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `subscriptionId` | `number` |

#### Returns

`Promise`<`void`\>

#### Defined in

[src/swampyer.ts:173](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/swampyer.ts#L173)
