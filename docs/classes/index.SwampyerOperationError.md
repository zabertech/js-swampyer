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
- [reason](index.SwampyerOperationError.md#reason)

### Methods

- [toString](index.SwampyerOperationError.md#tostring)

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

• `Optional` `Readonly` **message**: `string`

#### Inherited from

[SwampyerError](index.SwampyerError.md).[message](index.SwampyerError.md#message)

___

### reason

• `Optional` `Readonly` **reason**: `string`

## Methods

### toString

▸ **toString**(): `string`

#### Returns

`string`

#### Overrides

[SwampyerError](index.SwampyerError.md).[toString](index.SwampyerError.md#tostring)
