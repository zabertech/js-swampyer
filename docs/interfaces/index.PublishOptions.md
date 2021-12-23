[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / PublishOptions

# Interface: PublishOptions

[index](../modules/index.md).PublishOptions

## Hierarchy

- [`CommonOptions`](index.CommonOptions.md)

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

___

### withoutUriBase

• `Optional` **withoutUriBase**: `boolean`

If true, the `uriBase` will not be prepended to the provided URI for this operation

#### Inherited from

[CommonOptions](index.CommonOptions.md).[withoutUriBase](index.CommonOptions.md#withouturibase)
