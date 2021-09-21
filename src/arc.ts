import { AbstractGauge } from './gauge';
import { getColor, makeSVGElement, maybeScaleDefaults } from './helpers';
import './styles/arc.scss';

export interface ArcGaugeOptions {
    value: number, 
    max: number,
    size: number, 
    thickness: number, 
    label: string,
    title?: string,
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

export class ArcGauge extends AbstractGauge<ArcGaugeOptions> {

    constructor (element: HTMLElement, options: ArcGaugeOptions) {
        super(options, maybeScaleDefaults(defaultOptions, options.size));

        const wrapper = document.createElement("div");
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-arc");

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
            rect.setAttribute("width", size);
            rect.setAttribute("height", size);
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
        canvas.appendChild(label);
        this.addHook(({ value, label: lbl }) => {
            label.innerHTML = `${value} ${lbl}`;
        }, [ "value", "label" ])

        this.update();

        element.appendChild(wrapper);
    }

    protected updateData(combinedOptions: ArcGaugeOptions) {
        const { value, size, color, id, thickness, steps } = combinedOptions;
        //precalculate various values
        const r = (size - thickness - 1) * .5;
        const circumference = Math.PI * r;
        const ht = thickness * .5;
        const hs = size * .5;
        const maskID = `mask-${id}`;
        const gradientID = `gradient-${id}`;

        return {
            ...combinedOptions,
            r,
            circumference,
            ht,
            hs,
            maskID,
            gradientID,
            color: color || getColor(value, steps)
        };
    }
}