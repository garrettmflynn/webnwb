export const base = (str:string, caps:string[] = []) => {
    caps.forEach(s => {
        str = str.replace(new RegExp(s, 'g'), s.toLowerCase()); // Replace all
        // str = str.replaceAll(s, s.toLowerCase())
    })
    return str
}