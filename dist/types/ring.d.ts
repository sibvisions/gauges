import { AbstractGauge } from './gauge';
import './styles/ring.scss';
export interface RingGaugeOptions {
    value: number;
    max: number;
    label: string;
    size?: number;
    width?: number;
    height?: number;
    thickness?: number;
    title?: string;
    color?: string;
    steps?: [number, number, number, number];
    id?: string;
    hideValue?: boolean;
    formatValue?: (value: number) => string;
}
export declare class RingGauge extends AbstractGauge<RingGaugeOptions> {
    constructor(element: HTMLElement, options: RingGaugeOptions);
    protected updateData(combinedOptions: RingGaugeOptions): {
        r: number;
        circumference: number;
        hs: number;
        maskID: string;
        gradientID: string;
        color: string;
        value: number;
        max: number;
        label: string;
        size?: number;
        width?: number;
        height?: number;
        thickness?: number;
        title?: string;
        steps?: [number, number, number, number];
        id?: string;
        hideValue?: boolean;
        formatValue?: (value: number) => string;
    };
}
