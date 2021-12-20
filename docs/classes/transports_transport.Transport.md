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

#### Defined in

[src/transports/transport.ts:24](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L24)

___

### messageEvent

• `Readonly` **messageEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: [message: WampMessage]) => `void`) => () => `void` |

#### Defined in

[src/transports/transport.ts:22](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L22)

___

### openEvent

• `Readonly` **openEvent**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `addEventListener` | (`callback`: (...`args`: []) => `void`) => () => `void` |

#### Defined in

[src/transports/transport.ts:23](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L23)

## Accessors

### isClosed

• `get` **isClosed**(): `boolean`

#### Returns

`boolean`

#### Defined in

[src/transports/transport.ts:14](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L14)

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

#### Defined in

[src/transports/transport.ts:63](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L63)

___

### close

▸ **close**(`err?`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `err?` | `Error` |

#### Returns

`void`

#### Defined in

[src/transports/transport.ts:50](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L50)

___

### open

▸ **open**(): `void`

#### Returns

`void`

#### Defined in

[src/transports/transport.ts:46](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L46)

___

### read

▸ **read**(): `Promise`<`WampMessage`\>

An exception indicates that the transport has been closed and there will be no more messages
to read on this transport.

#### Returns

`Promise`<`WampMessage`\>

#### Defined in

[src/transports/transport.ts:30](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L30)

___

### write

▸ **write**(`payload`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `payload` | `WampMessage` |

#### Returns

`void`

#### Defined in

[src/transports/transport.ts:42](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/transports/transport.ts#L42)
