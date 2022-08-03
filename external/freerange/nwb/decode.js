import nwb from '../../../src/index'

export default async (o) => {
      console.log('Info', o)
      const io = new nwb.NWBHDF5IO()
      await io._write(o.file.name, o.buffer)
      let file = io.read(o.file.name)
      console.log('file', file)
      return file
}