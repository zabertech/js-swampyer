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

#### Defined in

[src/errors.ts:4](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/errors.ts#L4)

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

### reason

• `Optional` `Readonly` **reason**: `string`

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
