import { getColor, makeSVGElement, uuidv4 } from './helpers';
import './styles/arc.scss';
import type { Hook } from './types';

export interface ArcGaugeOptions {
    value: number, 
    max: number,
    size: number, 
    thickness: number, 
    label: string,
    color?: string,
    steps?: [number, number, number, number],
    id?: string,
}

const defaultOptions:Partial<ArcGaugeOptions> = {
    value: 0, 
    max: 10,
    size: 100, 
    thickness: 20, 
}

export class ArcGauge {
    private options: ArcGaugeOptions;
    private initial: boolean = true;
    private hooks: Hook[] = [];

    constructor (element: HTMLElement, options: ArcGaugeOptions) {
        this.options = {
            id: uuidv4(),
            ...defaultOptions,
            ...options
        };

        const wrapper = document.createElement("div");
        wrapper.classList.add("ui-gauge-arc");

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
        const maskPath = makeSVGElement("path");
        maskPath.setAttribute("stroke", "#fff");
        maskPath.setAttribute("fill", "none");
        this.addHook(({ ht, hs, size, r, thickness }) => {
            maskPath.setAttribute("d", `M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`); 
            maskPath.setAttribute("stroke-width", thickness);
        }, [ "size", "thickness" ])
        mask.appendChild(maskPath);
        defs.appendChild(mask);    
        svg.appendChild(defs);

        //outer group
        const outerGroup = makeSVGElement("g");
        this.addHook(({ size }) => {
            outerGroup.setAttribute("transform", `translate(0 ${size * .25})`);
        }, [ "size" ])
        svg.appendChild(outerGroup);

        //border
        const border = makeSVGElement("path");
        border.classList.add("ui-gauge-arc__border");
        outerGroup.appendChild(border);
        this.addHook(({ ht, hs, size, r, thickness }) => {
            border.setAttribute("d", `M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`); 
            border.setAttribute("stroke-width", thickness + 1);
        }, [ "size", "thickness" ]);

        const borderHead = makeSVGElement("rect");
        borderHead.classList.add("ui-gauge-arc__border-head");
        borderHead.setAttribute("x", "-.5");
        borderHead.setAttribute("height", ".5");
        outerGroup.appendChild(borderHead);
        this.addHook(({ hs, thickness }) => {
            borderHead.setAttribute("y", hs); 
            borderHead.setAttribute("width", thickness + 1);
        }, [ "size", "thickness" ]);

        const borderTail = makeSVGElement("rect");
        borderTail.classList.add("ui-gauge-arc__border-tail");
        borderTail.setAttribute("height", ".5");
        outerGroup.appendChild(borderTail);
        this.addHook(({ hs, size, thickness }) => {
            borderTail.setAttribute("x", (size - thickness - .5).toString()); 
            borderTail.setAttribute("y", hs); 
            borderTail.setAttribute("width", thickness + 1);
        }, [ "size", "thickness" ]);

        //inner group
        const innerGroup = makeSVGElement("g");
        this.addHook(({ maskID }) => {
            innerGroup.setAttribute("mask", `url(#${maskID})`);
        }, [ "id" ])
        outerGroup.appendChild(innerGroup);

        const rect = makeSVGElement("rect");
        rect.setAttribute("fill", "transparent");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        innerGroup.appendChild(rect);
        this.addHook(({ size }) => {
            innerGroup.setAttribute("width", size);
            innerGroup.setAttribute("height", size);
        }, [ "size" ])


        const bg = makeSVGElement("path");
        bg.classList.add("ui-gauge-arc__bg");
        innerGroup.appendChild(bg);
        this.addHook(({ ht, hs, r, size, thickness }) => {
            bg.setAttribute("d", `M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`);
            bg.setAttribute("stroke-width", `${thickness + 2}`);
        }, [ "size" ]);
        this.addHook(({ gradientID }) => {
            bg.setAttribute("stroke", `url(#${gradientID})`);
        }, [ "id" ]);


        const fg = makeSVGElement("path");
        fg.classList.add("ui-gauge-arc__fg");
        innerGroup.appendChild(fg);
        this.addHook(({ ht, hs, r, size, thickness, circumference, value, max, color }) => {
            fg.setAttribute("d", `M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`);
            fg.setAttribute("stroke", color);
            fg.setAttribute("stroke-width", `${thickness + 2}`);
            fg.setAttribute("stroke-dasharray", `${circumference}`);
            fg.setAttribute("stroke-dashoffset", Math.max(0, Math.min(circumference, (1 - value / max) * circumference)).toString());
        }, [ "size", "value", "max", "color" ]);

        const minText = makeSVGElement("text");
        minText.setAttribute("text-anchor", "middle");
        minText.setAttribute("dominant-baseline", "hanging");
        minText.innerHTML = "0";
        outerGroup.appendChild(minText);
        this.addHook(({ hs, ht }) => {
            minText.setAttribute("x", ht);
            minText.setAttribute("y", `${hs + 4}`);
        }, [ "size" ]);

        const maxText = makeSVGElement("text");
        maxText.setAttribute("text-anchor", "middle");
        maxText.setAttribute("dominant-baseline", "hanging");
        outerGroup.appendChild(maxText);
        this.addHook(({ hs, ht, size }) => {
            maxText.setAttribute("x", `${size - ht}`);
            maxText.setAttribute("y", `${hs + 4}`);
        }, [ "size" ]);
        this.addHook(({ max }) => {
            maxText.innerHTML = max;
        }, [ "max" ]);

        //setup gauge label
        const label = document.createElement("div");
        label.classList.add("ui-gauge-arc__label");
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

    update(options: Partial<ArcGaugeOptions> = {}) {
        const combinedOptions = { ...this.options, ...options };
        const { value, size, color, id, thickness, steps } = combinedOptions;

        //get the keys of changed option values
        const changed = Object.keys(options).filter(k => options[k] !== this.options[k])

        //if this is the first update or if there are changes
        if (this.initial || changed.length) {
            //precalculate various values
            const r = (size - thickness - 1) * .5;
            const circumference = Math.PI * r;
            const ht = thickness * .5;
            const hs = size * .5;
            const maskID = `mask-${id}`;
            const gradientID = `gradient-${id}`;

            const data = {
                ...combinedOptions,
                r,
                circumference,
                ht,
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