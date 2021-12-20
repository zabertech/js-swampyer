[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / SwampyerError

# Class: SwampyerError

[index](../modules/index.md).SwampyerError

## Hierarchy

- `Error`

  ↳ **`SwampyerError`**

  ↳↳ [`SwampyerOperationError`](index.SwampyerOperationError.md)

  ↳↳ [`TimeoutError`](index.TimeoutError.md)

  ↳↳ [`AbortError`](index.AbortError.md)

  ↳↳ [`ConnectionOpenError`](index.ConnectionOpenError.md)

  ↳↳ [`TransportError`](index.TransportError.md)

  ↳↳ [`TransportParseError`](index.TransportParseError.md)

  ↳↳ [`ConnectionClosedError`](index.ConnectionClosedError.md)

## Table of contents

### Constructors

- [constructor](index.SwampyerError.md#constructor)

### Properties

- [message](index.SwampyerError.md#message)
- [name](index.SwampyerError.md#name)
- [stack](index.SwampyerError.md#stack)
- [prepareStackTrace](index.SwampyerError.md#preparestacktrace)
- [stackTraceLimit](index.SwampyerError.md#stacktracelimit)

### Methods

- [captureStackTrace](index.SwampyerError.md#capturestacktrace)

## Constructors

### constructor

• **new SwampyerError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

Error.constructor

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:979

## Properties

### message

• **message**: `string`

#### Inherited from

Error.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: `string`

#### Inherited from

Error.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:973

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

Error.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:975

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

#### Type declaration

▸ (`err`, `stackTraces`): `any`

Optional override for formatting stack traces

**`see`** https://v8.dev/docs/stack-trace-api#customizing-stack-traces

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

Error.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:11

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

Error.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:13

## Methods

### captureStackTrace

▸ `Static` **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

Error.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:4
