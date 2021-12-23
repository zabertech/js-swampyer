[swampyer](../README.md) / [Modules](../modules.md) / index

# Module: index

## Table of contents

### Classes

- [AbortError](../classes/index.AbortError.md)
- [ConnectionClosedError](../classes/index.ConnectionClosedError.md)
- [ConnectionOpenError](../classes/index.ConnectionOpenError.md)
- [Swampyer](../classes/index.Swampyer.md)
- [SwampyerError](../classes/index.SwampyerError.md)
- [SwampyerOperationError](../classes/index.SwampyerOperationError.md)
- [TimeoutError](../classes/index.TimeoutError.md)
- [TransportError](../classes/index.TransportError.md)
- [TransportParseError](../classes/index.TransportParseError.md)

### Interfaces

- [CloseDetails](../interfaces/index.CloseDetails.md)
- [CommonOptions](../interfaces/index.CommonOptions.md)
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

Ƭ **CallOptions**: [`CommonOptions`](../interfaces/index.CommonOptions.md)

___

### CloseReason

Ƭ **CloseReason**: ``"transport_error"`` \| ``"transport_close"`` \| ``"open_error"`` \| ``"goodbye"`` \| ``"close_method"``

___

### RegisterOptions

Ƭ **RegisterOptions**: [`CommonOptions`](../interfaces/index.CommonOptions.md)

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

___

### SubscribeOptions

Ƭ **SubscribeOptions**: [`CommonOptions`](../interfaces/index.CommonOptions.md)

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
