[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / ConnectionOpenError

# Class: ConnectionOpenError

[index](../modules/index.md).ConnectionOpenError

## Hierarchy

- [`SwampyerError`](index.SwampyerError.md)

  ↳ **`ConnectionOpenError`**

## Table of contents

### Constructors

- [constructor](index.ConnectionOpenError.md#constructor)

### Properties

- [message](index.ConnectionOpenError.md#message)
- [name](index.ConnectionOpenError.md#name)
- [stack](index.ConnectionOpenError.md#stack)
- [prepareStackTrace](index.ConnectionOpenError.md#preparestacktrace)
- [stackTraceLimit](index.ConnectionOpenError.md#stacktracelimit)

### Methods

- [captureStackTrace](index.ConnectionOpenError.md#capturestacktrace)

## Constructors

### constructor

• **new ConnectionOpenError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

[SwampyerError](index.SwampyerError.md).[constructor](index.SwampyerError.md#constructor)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:979

## Properties

### message

• **message**: `string`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[message](index.SwampyerError.md#message)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:974

___

### name

• **name**: `string`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[name](index.SwampyerError.md#name)

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:973

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[stack](index.SwampyerError.md#stack)

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

[SwampyerError](index.SwampyerError.md).[prepareStackTrace](index.SwampyerError.md#preparestacktrace)

#### Defined in

node_modules/@types/node/globals.d.ts:11

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[stackTraceLimit](index.SwampyerError.md#stacktracelimit)

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

[SwampyerError](index.SwampyerError.md).[captureStackTrace](index.SwampyerError.md#capturestacktrace)

#### Defined in

node_modules/@types/node/globals.d.ts:4
