[swampyer](../README.md) / [Modules](../modules.md) / [transports/transport](../modules/transports_transport.md) / Transport

# Class: Transport

[transports/transport](../modules/transports_transport.md).Transport

## Table of contents

### Constructors

- [constructor](transports_transport.Transport.md#constructor)

### Properties

- [closeEvent](transports_transport.Transport.md#closeevent)
- [messageEvent](transports_transport.Transport.md#messageevent)
- [openEvent](transports_transport.Transport.md#openevent)

### Accessors

- [isClosed](transports_transport.Transport.md#isclosed)

### Methods

- [\_send](transports_transport.Transport.md#_send)
- [close](transports_transport.Transport.md#close)
- [open](transports_transport.Transport.md#open)
- [read](transports_transport.Transport.md#read)
- [write](transports_transport.Transport.md#write)

## Constructors

### constructor

• **new Transport**()

## Properties

### closeEvent

• `Readonly` **closeEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: [error?: Error]) => `void`) => () => `void` |
| `waitForNext` | () => `Promise`<[error?: Error]\> |

___

### messageEvent

• `Readonly` **messageEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: [message: WampMessage]) => `void`) => () => `void` |
| `waitForNext` | () => `Promise`<[message: WampMessage]\> |

___

### openEvent

• `Readonly` **openEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: []) => `void`) => () => `void` |
| `waitForNext` | () => `Promise`<[]\> |

## Accessors

### isClosed

• `get` **isClosed**(): `boolean`

#### Returns

`boolean`

## Methods

### \_send

▸ **_send**<`T`\>(`messageType`, `data`): `void`

For use by the library

#### Type parameters

| Name | Type |
| :------ | :------ |
| `T` | extends `MessageTypes` |

#### Parameters

| Name | Type |
| :------ | :------ |
| `messageType` | `T` |
| `data` | `MessageData`[`T`] |

#### Returns

`void`

___

### close

▸ **close**(`err?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `err?` | `Error` |

#### Returns

`void`

___

### open

▸ **open**(): `void`

#### Returns

`void`

___

### read

▸ **read**(): `Promise`<`WampMessage`\>

An exception indicates that the transport has been closed and there will be no more messages
to read on this transport.

#### Returns

`Promise`<`WampMessage`\>

___

### write

▸ **write**(`payload`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `payload` | `WampMessage` |

#### Returns

`void`
