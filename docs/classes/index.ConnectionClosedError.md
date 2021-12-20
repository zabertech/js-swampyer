[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / ConnectionClosedError

# Class: ConnectionClosedError

[index](../modules/index.md).ConnectionClosedError

## Hierarchy

- [`SwampyerError`](index.SwampyerError.md)

  ↳ **`ConnectionClosedError`**

## Table of contents

### Constructors

- [constructor](index.ConnectionClosedError.md#constructor)

### Properties

- [details](index.ConnectionClosedError.md#details)
- [message](index.ConnectionClosedError.md#message)
- [name](index.ConnectionClosedError.md#name)
- [reason](index.ConnectionClosedError.md#reason)
- [stack](index.ConnectionClosedError.md#stack)
- [prepareStackTrace](index.ConnectionClosedError.md#preparestacktrace)
- [stackTraceLimit](index.ConnectionClosedError.md#stacktracelimit)

### Methods

- [captureStackTrace](index.ConnectionClosedError.md#capturestacktrace)

## Constructors

### constructor

• **new ConnectionClosedError**(`reason`, `details`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `reason` | `string` |
| `details` | `Object` |

#### Overrides

[SwampyerError](index.SwampyerError.md).[constructor](index.SwampyerError.md#constructor)

## Properties

### details

• `Readonly` **details**: `Object`

___

### message

• **message**: `string`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[message](index.SwampyerError.md#message)

___

### name

• **name**: `string`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[name](index.SwampyerError.md#name)

___

### reason

• `Readonly` **reason**: `string`

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[stack](index.SwampyerError.md#stack)

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

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[stackTraceLimit](index.SwampyerError.md#stacktracelimit)

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
