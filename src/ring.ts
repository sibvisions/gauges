import { AbstractGauge } from './gauge';
import { getColor, makeSVGElement, maybeScaleDefaults } from './helpers';
import './styles/ring.scss';

export interface RingGaugeOptions {
    value: number, 
    max: number,
    label: string,
    size?: number, 
    thickness?: number, 
    title?: string,
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

export class RingGauge extends AbstractGauge<RingGaugeOptions> {

    constructor (element: HTMLElement, options: RingGaugeOptions) {
        super(options, maybeScaleDefaults(defaultOptions, options.size));

        const wrapper = document.createElement("div");
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-ring");

        const canvas = document.createElement("div");
        canvas.classList.add("ui-gauge__canvas");
        wrapper.appendChild(canvas);

        //setup title
        const title = document.createElement("div");
        title.classList.add("ui-gauge__title");
        this.addHook(({ title: t }) => {
            title.innerHTML = t;
            if(t) {
                wrapper.prepend(title);
            } else {
                title.remove();
            }
        }, [ "title" ]);

        //setup svg element
        const svg = makeSVGElement("svg");
        canvas.appendChild(svg);
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
        canvas.appendChild(label);
        this.addHook(({ value, label: lbl }) => {
            label.innerHTML = `${value} ${lbl}`;
        }, [ "value", "label" ])

        this.update();

        element.appendChild(wrapper);
    }

    protected updateData(combinedOptions: RingGaugeOptions) {
        const { value, size, color, id, thickness, steps } = combinedOptions;
        //precalculate various values
        const r = (size - thickness - 1) * .5;
        const circumference = 2 * Math.PI * r;
        const hs = size * .5;
        const maskID = `mask-${id}`;
        const gradientID = `gradient-${id}`;

        return {
            ...combinedOptions,
            r,
            circumference,
            hs,
            maskID,
            gradientID,
            color: color || getColor(value, steps)
        };
    }
}