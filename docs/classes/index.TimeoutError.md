[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / TimeoutError

# Class: TimeoutError

[index](../modules/index.md).TimeoutError

## Hierarchy

- [`SwampyerError`](index.SwampyerError.md)

  ↳ **`TimeoutError`**

## Table of contents

### Constructors

- [constructor](index.TimeoutError.md#constructor)

### Properties

- [message](index.TimeoutError.md#message)
- [name](index.TimeoutError.md#name)
- [stack](index.TimeoutError.md#stack)
- [timeout](index.TimeoutError.md#timeout)
- [prepareStackTrace](index.TimeoutError.md#preparestacktrace)
- [stackTraceLimit](index.TimeoutError.md#stacktracelimit)

### Methods

- [captureStackTrace](index.TimeoutError.md#capturestacktrace)

## Constructors

### constructor

• **new TimeoutError**(`timeout`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `timeout` | `number` |

#### Overrides

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

### timeout

• `Readonly` **timeout**: `number`

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
