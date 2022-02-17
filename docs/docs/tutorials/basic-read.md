---
sidebar_position: 2
---

# Basic File Reading
Coming soon...

### Slicing
Through **h5wasm**, **jsnwb** supports slicing of large datasets.

```javascript
// get full value
console.log('Full value', acquisition.data.value)

// take a slice from 0:10 on axis 0, keeping all of axis 1
console.log('Parial slice', acquisition.data.slice([0,10],[]))

```