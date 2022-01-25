---
id: "NWBHDF5IO"
title: "Class: NWBHDF5IO"
sidebar_label: "NWBHDF5IO"
sidebar_position: 0
custom_edit_url: null
---

## Constructors

### constructor

• **new NWBHDF5IO**(`path`, `mode?`)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `path` | `string` | `undefined` |
| `mode` | `FileMethods` | `"r"` |

#### Defined in

[index.ts:9](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/index.ts#L9)

## Properties

### file

• `Optional` **file**: [`NWBFile`](NWBFile)

#### Defined in

[index.ts:6](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/index.ts#L6)

___

### mode

• **mode**: `FileMethods`

#### Defined in

[index.ts:8](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/index.ts#L8)

___

### path

• **path**: `string`

#### Defined in

[index.ts:7](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/index.ts#L7)

## Methods

### close

▸ **close**(): `void`

#### Returns

`void`

#### Defined in

[index.ts:32](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/index.ts#L32)

___

### read

▸ **read**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[index.ts:15](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/index.ts#L15)

___

### write

▸ **write**(`_`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_` | [`NWBFile`](NWBFile) |

#### Returns

`void`

#### Defined in

[index.ts:27](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/index.ts#L27)
