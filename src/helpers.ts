export { v4 as uuidv4 } from 'uuid';

/** Color for ok value. */
const colorOK = "var(--ui-gauge-color__ok)";
/** Color for warning value. */
const colorWarning = "var(--ui-gauge-color__warning)";
/** Color for error value. */
const colorError = "var(--ui-gauge-color__error)";

/** get the color based on the value and steps */
export function getColor(value: number, steps?: [number, number, number, number]) {
    if(!steps) {
        return colorOK;
    }
    if(value <= (steps[0] ?? Number.MIN_VALUE) || value >= (steps[3] ?? Number.MAX_VALUE)) {
        return colorError;
    } else if (value <= (steps[1] ?? Number.MIN_VALUE) || value >= (steps[2] ?? Number.MAX_VALUE)) {
        return colorWarning;
    } else {
        return colorOK;
    }
}

const xmlns = "http://www.w3.org/2000/svg";
export function makeSVGElement<T extends SVGElement>(name: string) {
    return document.createElementNS(xmlns, name) as T;
}

export function maybeScaleDefaults<T extends { size?: number }>(options: T, size: number, skip: (keyof T)[] = []):T {
    if (size && options.size && size != options.size) {
        const out: T = {...options};
        const scale = size / options.size;
        for(let k in out) {
            if(!skip.includes(k) && typeof out[k] === "number") {
                //@ts-ignore
                out[k] *= scale;
            }
        }
        return out;
    } else {
        return options;
    }
}