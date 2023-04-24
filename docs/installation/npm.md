# Installing WebNWB with NPM
Instead of using a local file or CDN link, you may also install WebNWB from [NPM](https://www.npmjs.com/) when using [Node.js](https://nodejs.org/en/) or a bundler like [vite](https://vitejs.dev/).

```bash
npm install webnwb@1.0.0
```

This module can then be imported into your project using either ESM or CommonJS syntax.

#### ESM Import
```js
import nwb from 'webnwb'
```

#### CommonJS (Node)
```js
const nwb = require('webnwb')
```