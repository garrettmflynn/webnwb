
type ValueOf<T> = T[keyof T];

export const importance = {
    BEST_PRACTICE_SUGGESTION: 0,
    PYNWB_VALIDATION: 1,
    CRITICAL: 2,
    BEST_PRACTICE_VIOLATION: 3,
    ERROR: 4,
}

export const severity = {
    HIGH: 2,
    LOW: 1
}

type InspectorProps = {
    message: string,
    importance?: ValueOf<typeof importance>,
    severity?: ValueOf<typeof severity>,
    check_function_name?: string,
    object_type?: string,
    objectName?: string,
    location?: string,
    filePath?: string,
}

export class InspectorMessage {

    message: InspectorProps["message"]
    importance: InspectorProps["importance"] = severity["LOW"]
    severity: InspectorProps["severity"] = importance["BEST_PRACTICE_SUGGESTION"]
    check_function_name: InspectorProps["check_function_name"]
    object_type: InspectorProps["object_type"]
    objectName: InspectorProps["objectName"]
    location: InspectorProps["location"]
    filePath: InspectorProps["filePath"]


    constructor(info: InspectorProps) { 
        this.message = info.message
        Object.assign(this, info)
    }
}



export function parseISO8601Duration(durationStr: string) {
    const durationRegex = /^P(?!$)(\d+(?:\.\d+)?Y)?(\d+(?:\.\d+)?M)?(\d+(?:\.\d+)?W)?(\d+(?:\.\d+)?D)?(T(?=\d)(\d+(?:\.\d+)?H)?(\d+(?:\.\d+)?M)?(\d+(?:\.\d+)?S)?)?$/;
    const durationMatch = durationRegex.exec(durationStr);
    if (!durationMatch) {
      throw new Error(`Invalid duration string: ${durationStr}`);
    }
    const [, yearStr, monthStr, weekStr, dayStr, , hourStr, minuteStr, secondStr] = durationMatch;
    const year = parseFloat(yearStr || '0');
    const month = parseFloat(monthStr || '0');
    const week = parseFloat(weekStr || '0');
    const day = parseFloat(dayStr || '0');
    const hour = parseFloat(hourStr || '0');
    const minute = parseFloat(minuteStr || '0');
    const second = parseFloat(secondStr || '0');
    const totalDurationMs = ((year * 365 + month * 30 + week * 7 + day) * 24 + hour) * 60 * 60 * 1000 + minute * 60 * 1000 + second * 1000;
    return totalDurationMs;
  }