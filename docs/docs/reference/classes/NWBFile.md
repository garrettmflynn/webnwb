---
id: "NWBFile"
title: "Class: NWBFile"
sidebar_label: "NWBFile"
sidebar_position: 0
custom_edit_url: null
---

## Constructors

### constructor

• **new NWBFile**()

#### Defined in

[file.ts:8](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/file.ts#L8)

## Properties

### acquisition

• **acquisition**: `Object` = `{}`

#### Index signature

▪ [x: `string`]: [`TimeSeries`](TimeSeries)

#### Defined in

[file.ts:6](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/file.ts#L6)

## Methods

### addAcquisition

▸ **addAcquisition**(`o`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `o` | [`TimeSeries`](TimeSeries) |

#### Returns

`void`

#### Defined in

[file.ts:12](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/file.ts#L12)

___

### getAcquisition

▸ **getAcquisition**(`name`): [`TimeSeries`](TimeSeries)

#### Parameters

| Name | Type |
| :------ | :------ |
| `name` | `string` |

#### Returns

[`TimeSeries`](TimeSeries)

#### Defined in

[file.ts:16](https://github.com/brainsatplay/jsnwb/blob/14685c9/src/file.ts#L16)
