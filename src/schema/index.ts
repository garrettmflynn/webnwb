import { ArbitraryObject } from 'src/types'

// Types
const latest = '2.4.0'
import latestCore from './2.4.0'

// Note: Always place in reverse release order
const schemas:ArbitraryObject = {
    [latest]: {core: {[latest]: latestCore}},
    // [ Add older or newer versions here ]
}

export default schemas
