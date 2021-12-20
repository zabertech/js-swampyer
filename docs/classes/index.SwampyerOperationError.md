[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / SwampyerOperationError

# Class: SwampyerOperationError

[index](../modules/index.md).SwampyerOperationError

## Hierarchy

- [`SwampyerError`](index.SwampyerError.md)

  ↳ **`SwampyerOperationError`**

## Table of contents

### Constructors

- [constructor](index.SwampyerOperationError.md#constructor)

### Properties

- [args](index.SwampyerOperationError.md#args)
- [details](index.SwampyerOperationError.md#details)
- [kwargs](index.SwampyerOperationError.md#kwargs)
- [message](index.SwampyerOperationError.md#message)
- [name](index.SwampyerOperationError.md#name)
- [reason](index.SwampyerOperationError.md#reason)
- [stack](index.SwampyerOperationError.md#stack)
- [prepareStackTrace](index.SwampyerOperationError.md#preparestacktrace)
- [stackTraceLimit](index.SwampyerOperationError.md#stacktracelimit)

### Methods

- [captureStackTrace](index.SwampyerOperationError.md#capturestacktrace)

## Constructors

### constructor

• **new SwampyerOperationError**(`details?`, `reason?`, `args?`, `kwargs?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `details?` | `Object` |
| `reason?` | `string` |
| `args?` | `unknown`[] |
| `kwargs?` | `Object` |

#### Overrides

[SwampyerError](index.SwampyerError.md).[constructor](index.SwampyerError.md#constructor)

## Properties

### args

• `Optional` `Readonly` **args**: `unknown`[]

___

### details

• `Optional` `Readonly` **details**: `Object`

___

### kwargs

• `Optional` `Readonly` **kwargs**: `Object`

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

• `Optional` `Readonly` **reason**: `string`

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
