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
