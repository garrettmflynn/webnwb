export const check = (x:any) => {
    return Boolean(x && (typeof x === 'object') && (Array.isArray(x) || (ArrayBuffer.isView(x) && !(x instanceof DataView))));
}