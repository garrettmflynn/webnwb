# Writing an NWB File
::: warning Write Support Status
webnwb@0.1.0 currently has experimental write support because memory overload errors from h5wasm limit our capacity to write new data to existing files.

To learn more about this issue, visit [Issue #2](https://github.com/brainsatplay/webnwb/issues/2) on the WebNWB issue tracker.
:::

Using the file you provided in the last tutorial—or using the streamed DANDI file for dummy data—we'll experiment with updating metadata. On any part of the `NWBFile`, you can simply update the property to change its representation in memory.

```js
file.file_create_date = Date.now()
```
                
The WebNWB API automatically conforms values provided by users to the [NWB Schema](https://nwb-schema.readthedocs.io/en/latest/).

For instance, the `file_create_date` value should be an array of isodatetime values. So our `Date.now()` output will be converted into an ISO string inside an array!

Additionally, WebNWB ensures that values carry all of their metadata with them. Instead of a standard string, then, the new `file_create_date` string will be created using the `String` constructor and the Array will have additional properties such as `doc`, `dims`, `dtype`, `name`, and `shape` from the [NWBFile schema entry](https://nwb-schema.readthedocs.io/en/latest/format.html#nwbfile).

```js
console.log(file.file_create_date) // Will look like: [ String('2023-02-08T22:09:34.901Z') ]
```                
            
### Saving Changes

While all of your changes have been registered in memory, we still have to save them to local storage using the `save` command.

```js
const filename = await io.save(file) console.log('Saved:', filename)
```     
            

Once saved, you can access this file by name using the `load` function.

```js
const fileFromLocalStorage = await io.load(filename) console.log('File from local storage:', fileFromLocalStorage)
```                

### Downloading a NWB File from the Browser
Finally, if you'd like to download the updated file to your local computer, simply use the `download` function.

```js
io.download(filename)
```