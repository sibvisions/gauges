import { getColor, makeSVGElement, uuidv4 } from './helpers';
import './styles/ring.scss';
import type { Hook } from './types';

export interface RingGaugeOptions {
    value: number, 
    max: number,
    size: number, 
    thickness: number, 
    label: string,
    color?: string,
    steps?: [number, number, number, number],
    id?: string,
}

const defaultOptions:Partial<RingGaugeOptions> = {
    value: 0, 
    max: 10,
    size: 100, 
    thickness: 20, 
}

export class RingGauge {
    private options: RingGaugeOptions;
    private initial: boolean = true;
    private hooks: Hook[] = [];

    constructor (element: HTMLElement, options: RingGaugeOptions) {
        this.options = {
            id: uuidv4(),
            ...defaultOptions,
            ...options
        };

        const wrapper = document.createElement("div");
        wrapper.classList.add("ui-gauge-ring");

        //setup svg element
        const svg = makeSVGElement("svg");
        wrapper.appendChild(svg);
        this.addHook(({ size }) => {
            svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        }, [ "size" ])

        //various defs
        const defs = makeSVGElement("defs");

        //setup gradient
        const gradient = makeSVGElement("linearGradient");
        gradient.setAttribute("gradientTransform", "rotate(90)");
        this.addHook(({ gradientID }) => {
            gradient.setAttribute("id", gradientID);
        }, [ "id" ])
        gradient.innerHTML = `
            <stop offset="0%" stop-color="var(--ui-gauge-gradient__top)" />
            <stop offset="100%" stop-color="var(--ui-gauge-gradient__bottom)" />
        `;
        defs.appendChild(gradient);
        
        //setup mask
        const mask = makeSVGElement("mask");
        this.addHook(({ maskID }) => {
            mask.setAttribute("id", maskID);
        }, [ "id" ])
        const maskCircle = makeSVGElement("circle");
        maskCircle.setAttribute("stroke", "#fff");
        maskCircle.setAttribute("fill", "none");
        this.addHook(({ hs, r, thickness }) => {
            maskCircle.setAttribute("cx", hs); 
            maskCircle.setAttribute("cy", hs);
            maskCircle.setAttribute("r", r);
            maskCircle.setAttribute("stroke-width", thickness);
        }, [ "size", "thickness" ])
        mask.appendChild(maskCircle);
        defs.appendChild(mask);    
        svg.appendChild(defs);

        //setup border
        const border = makeSVGElement("circle");
        border.classList.add("ui-gauge-ring__border");
        this.addHook(({ hs, r, thickness }) => {
            border.setAttribute("cx", hs); 
            border.setAttribute("cy", hs);
            border.setAttribute("r", r);
            border.setAttribute("stroke-width", thickness + 1);
        }, [ "size", "thickness" ])
        svg.appendChild(border);

        //group
        const group = makeSVGElement("g");
        this.addHook(({ maskID }) => {
            group.setAttribute("mask", `url(#${maskID})`);
        }, [ "id" ])
        svg.appendChild(group);

        //fill rect
        const rect = makeSVGElement("rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("fill", "transparent");
        this.addHook(({ size }) => {
            rect.setAttribute("width", size);
            rect.setAttribute("height", size);
        }, [ "size" ])
        group.appendChild(rect);

        //background
        const bg = makeSVGElement("circle");
        bg.classList.add("ui-gauge-ring__bg");
        group.appendChild(bg);
        this.addHook(({ hs, r, thickness }) => {
            bg.setAttribute("cx", hs); 
            bg.setAttribute("cy", hs);
            bg.setAttribute("r", r);
            bg.setAttribute("stroke-width", thickness + 2);
        }, [ "size", "thickness" ])
        this.addHook(({ gradientID }) => {
            bg.setAttribute("stroke", `url(#${gradientID})`);
        }, [ "id" ])

        //foreground
        const fg = makeSVGElement("circle");
        fg.classList.add("ui-gauge-ring__fg");
        group.appendChild(fg);
        this.addHook(({ hs, r, thickness, circumference, value, max, color }) => {
            fg.setAttribute("cx", hs); 
            fg.setAttribute("cy", hs);
            fg.setAttribute("r", r);
            fg.setAttribute("transform", `rotate(-90 ${hs} ${hs})`);
            fg.setAttribute("stroke", color);
            fg.setAttribute("stroke-width", thickness + 2);
            fg.setAttribute("stroke-dasharray", circumference);
            fg.setAttribute("stroke-dashoffset", Math.max(0, Math.min(circumference, (1 - value / max) * circumference)).toString());
        }, [ "size", "thickness", "value", "max", "color" ])

        //setup gauge label
        const label = document.createElement("div");
        label.classList.add("ui-gauge-ring__label");
        wrapper.appendChild(label);
        this.addHook(({ value, label: lbl }) => {
            label.innerHTML = `${value} ${lbl}`;
        }, [ "value", "label" ])

        this.update();

        element.appendChild(wrapper);
    }

    private addHook(callback: Function, keys: string[]) {
        this.hooks.push({
            callback,
            keys
        });
    }

    update(options: Partial<RingGaugeOptions> = {}) {
        const combinedOptions = { ...this.options, ...options };
        const { value, size, color, id, thickness, steps } = combinedOptions;

        //get the keys of changed option values
        const changed = Object.keys(options).filter(k => options[k] !== this.options[k])

        //if this is the first update or if there are changes
        if (this.initial || changed.length) {
            //precalculate various values
            const r = (size - thickness - 1) * .5;
            const circumference = 2 * Math.PI * r;
            const hs = size * .5;
            const maskID = `mask-${id}`;
            const gradientID = `gradient-${id}`;

            const data = {
                ...combinedOptions,
                r,
                circumference,
                hs,
                maskID,
                gradientID,
                color: color || getColor(value, steps)
            };

            //run hooks
            this.hooks.forEach(h => {
                if(this.initial || h.keys.some(k => changed.includes(k))) {
                    h.callback(data);
                }
            });
            this.initial = false;
        }

        this.options = combinedOptions;
    }
}