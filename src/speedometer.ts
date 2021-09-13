import { maybeScaleDefaults } from './helpers';
import { MeterGauge, MeterGaugeOptions } from './meter';
import './styles/speedometer.scss';

const defaultOptions:Partial<MeterGaugeOptions> = {
    ticks: 11,
    subTicks: 3,
    circle: .75,
    tickLabelsInside: true,
}

export class SpeedometerGauge extends MeterGauge {

    constructor (element: HTMLElement, options: MeterGaugeOptions) {
        super(element, {
            ...defaultOptions,
            ...options
        });
        this.wrapper.classList.add("ui-gauge-meter--speed");
    }

}