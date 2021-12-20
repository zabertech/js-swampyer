[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / AbortError

# Class: AbortError

[index](../modules/index.md).AbortError

## Hierarchy

- [`SwampyerError`](index.SwampyerError.md)

  ↳ **`AbortError`**

## Table of contents

### Constructors

- [constructor](index.AbortError.md#constructor)

### Properties

- [details](index.AbortError.md#details)
- [message](index.AbortError.md#message)
- [name](index.AbortError.md#name)
- [reason](index.AbortError.md#reason)
- [stack](index.AbortError.md#stack)
- [prepareStackTrace](index.AbortError.md#preparestacktrace)
- [stackTraceLimit](index.AbortError.md#stacktracelimit)

### Methods

- [captureStackTrace](index.AbortError.md#capturestacktrace)

## Constructors

### constructor

• **new AbortError**(`reason`, `details`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `reason` | `string` |
| `details` | `Object` |

#### Overrides

[SwampyerError](index.SwampyerError.md).[constructor](index.SwampyerError.md#constructor)

#### Defined in

[src/errors.ts:21](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/errors.ts#L21)

## Properties

### details

• `Readonly` **details**: `Object`

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

• `Readonly` **reason**: `string`

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
