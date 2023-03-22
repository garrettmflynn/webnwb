import nwb from '../../dist/index.esm'
import { ObjectEditor } from './src'

const section = document.querySelector('section') as HTMLElement 
const editor = new ObjectEditor({
    // readOnly: true,
    // deferValues: true
})
section.appendChild(editor)


const io = new nwb.NWBHDF5IO()

const run = async () => {
    const start = performance.now()
    const file = await io.load("https://dandiarchive.s3.amazonaws.com/blobs/11e/c89/11ec8933-1456-4942-922b-94e5878bb991", {useStreaming: true})
    console.log(file, performance.now() - start)
    editor.set(file)
}

run()