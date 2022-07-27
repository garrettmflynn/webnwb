class ApifyBaseClass {

    [x:string]: any; // arbitrary

    constructor(info: any) {

        
                // Trigger correct response from the constructor
                const arr = Object.keys(info)
                arr.forEach((key:string) => {
                  const val = info[key]
                  if (key === 'name') this[key] = val
                  else if (key in this){
                    if (this[key] && typeof this[key] === 'object' && this[key].type === 'group') {
        
                      const camelKey = key[0].toUpperCase() + key.slice(1);
        
                      for (let name in val){
                        const instance = val[name]
                        instance.name = name // automatically set name
                        this['create' + camelKey](instance); // create class from raw object
                      }
                    } else this[key] = val // assign raw attribute
                  } else console.warn('[${this.info.name}]: ' + key + ' (argument) is out of schema for ${name}')
                })

                console.log('this')
            }
 }

 export default ApifyBaseClass