export const safeStringify = (input:any, stringify=true):any => {

    if (input instanceof Object) input = (Array.isArray(input)) ? [...input] : Object.assign({}, input)

    // Stringify Functions
    for (let key in input){
        if (input[key] instanceof Function) input[key] = input[key].toString()
        if (input[key] instanceof Object) {
          // console.log(key, input[key])
            input[key] = safeStringify(input[key], false)
        }
    }

    // Actually Stringify
    return (stringify) ? JSON.stringify(input) : input

}

export var objToString = (obj) => {
    let ret = "{";
    for (let k in obj) {
      let v = obj[k];
      if (typeof v === "function") {
        v = v.toString();
      } else if (v instanceof Array) {
        v = JSON.stringify(v);
      } else if (typeof v === "object" && !!v) { // Pass on null and undefined
        v = objToString(v);
      } else if (typeof v === "string") {
        v = `"${v}"`;
      }
      else {
        v = `${v}`;
      }
      ret += `
    "${k}": ${v},`;
    }
    ret += "\n}";
    return ret;
  };