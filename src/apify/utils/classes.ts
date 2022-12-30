export function isNativeClass (thing: any) {
    return isFunction(thing) === 'class'
}


export function isFunction(x: any) {
    const res = typeof x === 'function'
        ? x.prototype
            ? Object.getOwnPropertyDescriptor(x, 'prototype')?.writable
                ? 'function'
                : 'class'
        : x.constructor.name === 'AsyncFunction'
        ? 'async'
        : 'arrow'
    : '';

    return res
}