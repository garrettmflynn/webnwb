# Reading an NWB File
NWB files can be read from several locations, including **local** files or **remote** URLs.

To read files, you'll need to create an `NWBHDF5IO` instance.

```js
import nwb from 'webnwb' 
const io = new nwb.NWBHDF5IO()
```                
            

#### Local Files
To access files in the local filesystem, you can simply call the `load` command with no arguments.

```js
const file = await io.load()
```
                
#### Remote Files
Files you'd like to load from a remote endpoint can be specified as the first argument to `load`, which will automatically be recognized as a URL. Many NWB files can be found on the Brain Initiative's [Distributed Archives for Neurophysiology Data Integration Archive (DANDI)](https://dandiarchive.org) and loaded in this manner.

Since this is a huge file at 160.5GB, you'll want to provide the `useStreaming` option to avoid downloading the entire file into memory before interacting it.

```js
const url = 'https://api.dandiarchive.org/api/assets/29ba1aaf-9091-469a-b331-6b8ab818b5a6/download/' const file = await io.load(url, { useStreaming: true })
```
                
            

You can alternatively use our provisional DANDI API to quickly get dandisets and assets based on their IDs.

```js
import * as dandi from 'htts://jsdelivr.net/npm/dandi@0.0.3/dist/index.esm' 
const dandiset = await dandi.get('000003') // Request a dandiset by ID
// const dandiset = (await dandi.getAll())[0] // Get the first dandiset from the list of all dandisets 
const asset = await dandiset.getAsset('29ba1aaf-9091-469a-b331-6b8ab818b5a6')
// const asset = (await dandiset.getAssets())[0] 
const file = await io.load(asset.metadata.contentUrl[0], { useStreaming: true })
```