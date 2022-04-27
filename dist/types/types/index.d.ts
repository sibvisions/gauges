export interface Hook {
    callback: Function;
    keys: string[];
}
export interface GaugeOptions {
    value: number;
    size?: number;
    thickness?: number;
    color?: string;
    label?: string;
    min?: number;
    max?: number;
    steps?: [number, number, number, number];
    ticks?: number;
    subTicks?: number;
    circle?: number;
    classPrefix?: string;
    tickLabelsInside?: boolean;
}
