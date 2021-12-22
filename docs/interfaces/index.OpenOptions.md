[swampyer](../README.md) / [Modules](../modules.md) / [index](../modules/index.md) / OpenOptions

# Interface: OpenOptions

[index](../modules/index.md).OpenOptions

## Table of contents

### Properties

- [agent](index.OpenOptions.md#agent)
- [auth](index.OpenOptions.md#auth)
- [realm](index.OpenOptions.md#realm)
- [uriBase](index.OpenOptions.md#uribase)

### Methods

- [autoReconnectionDelay](index.OpenOptions.md#autoreconnectiondelay)

## Properties

### agent

• `Optional` **agent**: `string`

An identifier for this client connection which may be used by the WAMP server for logging
purposes

___

### auth

• `Optional` **auth**: `Object`

Optional authentication data

If this is not defined then the library will try to authenticate using the `anonymous`
`authMethod`. Omit this if you only need `anonymous` access.

#### Type declaration

| Name | Type | Description |
| :------ | :------ | :------ |
| `authId` | `string` | The username or ID to authenticate as.  This value depends on the `authMethods` selected and the settings of your WAMP server. |
| `authMethods` | `string`[] | Could be values like `anonymous`, `ticket`, `cookie`, etc.  Refer to your WAMP server's settings to find out which auth methods are supported. |
| `onChallenge` | (`authMethod`: `string`) => `string` | - |

___

### realm

• **realm**: `string`

The realm to connect to on the WAMP server

___

### uriBase

• `Optional` **uriBase**: `string`

This string will be prepended to all of your URI cased WAMP operations. This can be a
convenient way to shorten the WAMP URIs by defining the common part of the WAMP URIs
here.

The final URI that gets used for communicating with the WAMP server ends up being
`{uriBase}.{URI of operation}`.

It is also possible to disable the use of `uriBase` for a given WAMP operation by setting
the `withoutUriBase` option for the operations that support that option

**`example`** Setting this to `com.company.something` will allow you to shorten a `call()` to
`com.company.something.my.fancy_registration` down to a `call()` to `my.fancy_registration`

## Methods

### autoReconnectionDelay

▸ `Optional` **autoReconnectionDelay**(`attempt`, ...`closeData`): ``null`` \| `number`

Define a custom delay between reconnection attempts. If this function returns `null` or
any number <= 0 then the library will no longer try to reconnect.

If this function is not defined then the library will use a delay that increases with
each successive reconnection attempt (up to a maximum of 32000ms)

The `attempt` argument for the function will always be `>= 1`.

#### Parameters

| Name | Type |
| :------ | :------ |
| `attempt` | `number` |
| `...closeData` | `CloseEventData` |

#### Returns

``null`` \| `number`
