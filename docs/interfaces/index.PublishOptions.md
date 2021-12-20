[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / PublishOptions

# Interface: PublishOptions

[index](../modules/index.md).PublishOptions

## Hierarchy

- `CommonOptions`

  ↳ **`PublishOptions`**

## Table of contents

### Properties

- [acknowledge](index.PublishOptions.md#acknowledge)
- [withoutUriBase](index.PublishOptions.md#withouturibase)

## Properties

### acknowledge

• `Optional` **acknowledge**: `boolean`

Asks the WAMP server to acknowledge that the publish call has been fulfilled. `publish()`
will wait for the acknowledgement from the WAMP server if this option is set to `true`.

#### Defined in

[src/types.ts:154](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/types.ts#L154)

___

### withoutUriBase

• `Optional` **withoutUriBase**: `boolean`

If true, the `uriBase` will not be prepended to the provided URI for this operation

#### Inherited from

CommonOptions.withoutUriBase

#### Defined in

[src/types.ts:140](https://github.com/zaberSatnam/js-swampyer/blob/51c14e1/src/types.ts#L140)
