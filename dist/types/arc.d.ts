import { AbstractGauge } from './gauge';
import './styles/arc.scss';
export interface ArcGaugeOptions {
    value: number;
    min?: number;
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
export declare class ArcGauge extends AbstractGauge<ArcGaugeOptions> {
    constructor(element: HTMLElement, options: ArcGaugeOptions);
    protected updateData(combinedOptions: ArcGaugeOptions): {
        r: number;
        circumference: number;
        ht: number;
        hs: number;
        maskID: string;
        gradientID: string;
        color: string;
        value: number;
        min?: number;
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
