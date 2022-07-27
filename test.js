const methods = JSON.stringify(Array.from(names))
methods.forEach(method => {
    if (!this._deleted) {
    Object.defineProperty(this, '_deleted', {
        value: [],
        enumerable: false,
        writable: false,
    })
    }

if (!thisString) thisString = undefined;

const addName = 'add' + method
const getName = 'get' + method
const createName = 'create' + method

if (!this._deleted.includes(method)){
  try {
    console.log('declaring method')
    Object.defineProperties(this, {
      [addName]: {
        value: function add(obj) {
          this[obj.name] = obj
        }, 
        enumerable: false,
        writable: false
      },
      [getName]: {
        value: function get(name) {
          return this[name]
        }, 
        enumerable: false,
        writable: false
      },
      [createName]: {
        value: function create(o) {
          const cls = globalThis.apify._get("${pascal}")
          if (cls) {
            const created = new cls(o)
            return this.add(created)
          } else {
            console.error('[${this._options.name}]: Could not find class for ${pascal}');
            return null
          }
        }, 
        enumerable: false,
        writable: false
      }
    });
  } catch (e) {
    const aliases = aliases
    console.warn('[${this._options.name}]: Trying to redeclare a helper function for ${pascal}', 'removing aliases: ' + aliases)
    aliases.forEach(alias => {
      delete this[alias]
      this._deleted.push(alias)
    })
  };
}
})
