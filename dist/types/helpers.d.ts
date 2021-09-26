export { v4 as uuidv4 } from 'uuid';
/** get the color based on the value and steps */
export declare function getColor(value: number, steps?: [number, number, number, number]): "var(--ui-gauge-color__ok)" | "var(--ui-gauge-color__warning)" | "var(--ui-gauge-color__error)";
export declare function makeSVGElement<T extends SVGElement>(name: string): T;
export declare function maybeScaleDefaults<T extends {
    size?: number;
}>(options: T, size: number, skip?: (keyof T)[]): T;
