[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / TransportParseError

# Class: TransportParseError

[index](../modules/index.md).TransportParseError

## Hierarchy

- [`SwampyerError`](index.SwampyerError.md)

  ↳ **`TransportParseError`**

## Table of contents

### Constructors

- [constructor](index.TransportParseError.md#constructor)

### Properties

- [message](index.TransportParseError.md#message)
- [name](index.TransportParseError.md#name)
- [stack](index.TransportParseError.md#stack)
- [prepareStackTrace](index.TransportParseError.md#preparestacktrace)
- [stackTraceLimit](index.TransportParseError.md#stacktracelimit)

### Methods

- [captureStackTrace](index.TransportParseError.md#capturestacktrace)

## Constructors

### constructor

• **new TransportParseError**(`message?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message?` | `string` |

#### Inherited from

[SwampyerError](index.SwampyerError.md).[constructor](index.SwampyerError.md#constructor)

## Properties

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
