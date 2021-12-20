[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / CloseDetails

# Interface: CloseDetails

[index](../modules/index.md).CloseDetails

## Table of contents

### Properties

- [error](index.CloseDetails.md#error)
- [goodbye](index.CloseDetails.md#goodbye)

## Properties

### error

• `Optional` **error**: [`SwampyerError`](../classes/index.SwampyerError.md)

This value will only be defined if the connection was closed due to some error

#### Defined in

[src/types.ts:130](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L130)

___

### goodbye

• `Optional` **goodbye**: `Object`

This value will only be defined if the connection was closed due to a GOODBYE event

#### Type declaration

| Name | Type |
| :------ | :------ |
| `details` | `Object` |
| `reason` | `string` |

#### Defined in

[src/types.ts:132](https://github.com/zaberSatnam/js-swampyer/blob/9cfd414/src/types.ts#L132)
