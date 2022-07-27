function extend(superclass:any, constructor:any) {
    function Extended(...args: any[]) {
      const _super = (...args: any[]) => Object.assign(this, new superclass(...args));
      constructor.call(this, _super, ...args);
    }
    Object.setPrototypeOf(Extended, superclass);
    Object.setPrototypeOf(Extended.prototype, superclass.prototype);
    return Extended;
 }

 export default extend