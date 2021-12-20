[swampyer](../README.md) / [Modules](../modules.md) / index

# Module: index

## Table of contents

### Classes

- [AbortError](../classes/index.AbortError.md)
- [ConnectionClosedError](../classes/index.ConnectionClosedError.md)
- [ConnectionOpenError](../classes/index.ConnectionOpenError.md)
- [Swampyer](../classes/index.Swampyer.md)
- [SwampyerAutoReconnect](../classes/index.SwampyerAutoReconnect.md)
- [SwampyerError](../classes/index.SwampyerError.md)
- [SwampyerOperationError](../classes/index.SwampyerOperationError.md)
- [TimeoutError](../classes/index.TimeoutError.md)
- [TransportError](../classes/index.TransportError.md)
- [TransportParseError](../classes/index.TransportParseError.md)

### Interfaces

- [CloseDetails](../interfaces/index.CloseDetails.md)
- [OpenOptions](../interfaces/index.OpenOptions.md)
- [PublishOptions](../interfaces/index.PublishOptions.md)

### Type aliases

- [CallOptions](index.md#calloptions)
- [CloseReason](index.md#closereason)
- [RegisterOptions](index.md#registeroptions)
- [RegistrationHandler](index.md#registrationhandler)
- [SubscribeOptions](index.md#subscribeoptions)
- [SubscriptionHandler](index.md#subscriptionhandler)
- [WelcomeDetails](index.md#welcomedetails)

## Type aliases

### CallOptions

Ƭ **CallOptions**: `CommonOptions`

#### Defined in

[src/types.ts:146](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L146)

___

### CloseReason

Ƭ **CloseReason**: ``"transport_error"`` \| ``"transport_close"`` \| ``"open_error"`` \| ``"goodbye"`` \| ``"close_method"``

#### Defined in

[src/types.ts:127](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L127)

___

### RegisterOptions

Ƭ **RegisterOptions**: `CommonOptions`

#### Defined in

[src/types.ts:145](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L145)

___

### RegistrationHandler

Ƭ **RegistrationHandler**: (`args`: `unknown`[], `kwargs`: `Object`, `details`: `Object`) => `void`

#### Type declaration

▸ (`args`, `kwargs`, `details`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `unknown`[] |
| `kwargs` | `Object` |
| `details` | `Object` |

##### Returns

`void`

#### Defined in

[src/types.ts:62](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L62)

___

### SubscribeOptions

Ƭ **SubscribeOptions**: `CommonOptions`

#### Defined in

[src/types.ts:148](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L148)

___

### SubscriptionHandler

Ƭ **SubscriptionHandler**: (`args`: `unknown`[], `kwargs`: `Object`, `details`: `Object`) => `void`

#### Type declaration

▸ (`args`, `kwargs`, `details`): `void`

##### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `unknown`[] |
| `kwargs` | `Object` |
| `details` | `Object` |

##### Returns

`void`

#### Defined in

[src/types.ts:61](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L61)

___

### WelcomeDetails

Ƭ **WelcomeDetails**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `authid` | `string` |
| `authmethod` | `string` |
| `authprovider?` | `string` |
| `authrole` | `string` |
| `realm?` | `string` |
| `roles` | `Record`<`string`, `unknown`\> |

#### Defined in

[src/types.ts:64](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L64)
