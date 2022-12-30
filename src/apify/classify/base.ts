type ClassOptionsType = {
    // Use to skip autorejection and otherwise generate values
    onRejectKey?: (key: string, value:any, info:any) => any // return to include the value
}

class ApifyBaseClass {

    [x: string]: any; // arbitrary

    constructor(info: any = {}, options: ClassOptionsType = {}) {

        // Apply Inheritance to this Instance (from the schema)
        let target = this
        const prototypes = []
        do {
            target = Object.getPrototypeOf(target)
            prototypes.push(target)
        } while (Object.getPrototypeOf(target))

        // Properly Inherit from All Superclasses
        prototypes.reverse().forEach(p => Object.assign(this, p))

        // Load Information from the User
        const arr = Object.keys(info)
        arr.forEach((key: string) => {
            const val = info[key]
            if (key === 'name') this[key] = val
            else {

                if (!(key in this)) {
                    const res = (options.onRejectKey) ? options.onRejectKey(key, val, info) : undefined
                    if (res === undefined) {
                        console.warn(`[classify]: ${key} (argument) is out of schema for ${this.name}`, info, this);
                        return;
                    }
                }

                if (this[key] && typeof this[key] === 'object' && this[key].type === 'group') {

                    const camelKey = key[0].toUpperCase() + key.slice(1);

                    for (let name in val) {
                        const instance = val[name]
                        instance.name = name // automatically set name
                        this['create' + camelKey](instance); // create class from raw object
                    }

                } else this[key] = val // assign raw attribute
            }
        })
    }
}

export default ApifyBaseClass