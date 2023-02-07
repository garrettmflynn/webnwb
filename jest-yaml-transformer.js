import transformer from "jest-transform-yaml"
const tDefault = transformer.default

const newTransformer = {
  ...tDefault,
  process: function (...params) {
    return {
      code: tDefault?.process(...params),
      map: null,
    }
  },
}

export default newTransformer