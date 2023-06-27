import * as dandi from '../src/index'

const api = new dandi.API({
    token: '7e55c22480388e1be10245e30fadb67e7e34ed0a',
    type: 'staging'
})

await api.init()
const res =  await api.create('This is my new dataset')
console.log(res)