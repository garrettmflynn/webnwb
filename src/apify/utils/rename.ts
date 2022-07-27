export const base = (str:string, caps:string[] = []) => {
    caps.forEach(s => {
        str = str.replaceAll(s, s.toLowerCase())
    })
    return str
}