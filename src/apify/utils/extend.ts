function extend(superclass:any, constructor:any) {
    function ApifyExtendedClass(...args: any[]) {
      const _super = (...args: any[]) => Object.assign(this, new superclass(...args));
      constructor.call(this, _super, ...args);
    }
    Object.setPrototypeOf(ApifyExtendedClass, superclass);
    Object.setPrototypeOf(ApifyExtendedClass.prototype, superclass.prototype);
    return ApifyExtendedClass;
 }

 export default extend