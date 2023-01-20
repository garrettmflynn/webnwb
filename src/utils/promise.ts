export const isPromise = (o: any) => typeof o === 'object' && typeof o.then === 'function'
