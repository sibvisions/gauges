import { AbstractGauge } from './gauge';
import { getColor, makeSVGElement, maybeScaleDefaults } from './helpers';
import './styles/meter.scss';

export interface MeterGaugeOptions {
    value: number,
    min?: number,
    max: number,
    label: string,
    size?: number,
    width?: number,
    height?: number,
    thickness?: number,
    title?: string,
    ticks?: number,
    subTicks?: number,
    circle?: number,
    color?: string,
    steps?: [number, number, number, number],
    id?: string,
    tickLabelsInside?: boolean,
    tickLabelOffset?: number,
    hideValue?: boolean,
    formatValue?: (value: number) => string,
}

const defaultOptions:Partial<MeterGaugeOptions> = {
    value: 0, 
    min: 0,
    max: 10,
    size: 100, 
    thickness: 4,
    ticks: 5,
    subTicks: 4,
    circle: .25,
    tickLabelsInside: false,
}

export class MeterGauge extends AbstractGauge<MeterGaugeOptions> {
    protected wrapper: HTMLDivElement;

    constructor (element: HTMLElement, options: MeterGaugeOptions) {
        super(options, maybeScaleDefaults(defaultOptions, options.size, ["ticks", "subTicks", "circle", "min", "max", "value"]));

        const wrapper = document.createElement("div");
        this.wrapper = wrapper;
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-meter");
        this.addHook(({ width, height }) => {
            wrapper.style.width = width ? `${width}px` : null;
            wrapper.style.height = height ? `${height}px` : null;
        }, [ "width", "height" ]);

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
        this.addHook(({ size, circle, tickLabelsInside, tickLabelOffset, sizeScale }) => {
             //XXX: the 1.2 factor is a magic number
            svg.setAttribute("viewBox", `0 0 ${size} ${circle < .5 ? size * Math.min(1, circle * 1.2) + (tickLabelsInside ? 0 : 2 * (tickLabelOffset || 5 * sizeScale)) : size}`);
        }, [ "size", "tickLabelOffset" ])

        //various defs
        const defs = makeSVGElement("defs");

        //setup marker
        const marker = makeSVGElement("marker");
        marker.setAttribute("markerUnits", "userSpaceOnUse");
        marker.setAttribute("orient", "auto");
        defs.appendChild(marker);
        this.addHook(({ markerID }) => {
            marker.setAttribute("id", markerID);
        }, [ "id" ])
        this.addHook(({ tickSize, thickness }) => {
            marker.setAttribute("viewBox", `0 0 ${tickSize} ${thickness}`);
            marker.setAttribute("refX", `${tickSize * .5}`);
            marker.setAttribute("refY", `${thickness * .5}`);
            marker.setAttribute("markerWidth", tickSize);
            marker.setAttribute("markerHeight", thickness.toString());
        }, [ "thickness" ])

        const markerRect = makeSVGElement("rect");
        markerRect.setAttribute("x", "0");
        markerRect.setAttribute("y", "0");
        marker.appendChild(markerRect);
        this.addHook(({ tickSize, thickness }) => {
            markerRect.setAttribute("width", `${tickSize}`);
            markerRect.setAttribute("height", `${thickness}`);
        }, [ "thickness" ])

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
        this.addHook(({ leftScale, bottomScale, rightScale, ir, arcFlag, thickness }) => {
            maskPath.setAttribute("d", `M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`); 
            maskPath.setAttribute("stroke-width", `${thickness - 1}`);
        }, [ "size", "thickness" ])
        mask.appendChild(maskPath);
        defs.appendChild(mask);    
        svg.appendChild(defs);

        //tick shift group
        const tickShiftGroup = makeSVGElement("g");
        svg.appendChild(tickShiftGroup);
        this.addHook(({ tickLabelsInside, tickLabelOffset, sizeScale }) => {
            tickShiftGroup.setAttribute("transform", `translate(0 ${tickLabelsInside ? 0 :  2 * (tickLabelOffset || 5 * sizeScale)})`); 
        }, [ "tickLabelsInside", "tickLabelOffset", "size" ])

        //bg 
        const bg = makeSVGElement("circle"); 
        bg.classList.add("ui-gauge-meter__bg");
        bg.setAttribute("stroke-width", ".5");
        bg.setAttribute("stroke", "var(--ui-gauge-color__border)");
        tickShiftGroup.appendChild(bg);
        this.addHook(({ hs }) => {
            bg.setAttribute("cx", `${hs}`);
            bg.setAttribute("cy", `${hs}`);
            bg.setAttribute("r", `${hs - .25}`);
        }, [ "size" ])
        this.addHook(({ gradientID }) => {
            bg.setAttribute("fill", `url(#${gradientID})`);
        }, [ "id" ])
        this.addHook(({ circle }) => {
            bg.setAttribute("visibility", circle > .5 ? "" : "hidden");
        }, [ "circle" ])

        //scale
        const scaleGroup = makeSVGElement("g");
        tickShiftGroup.appendChild(scaleGroup);
        this.addHook(({ maskID }) => {
            scaleGroup.setAttribute("fill", `url(#${maskID})`);
        }, [ "id" ])
        this.addHook(({ steps }) => {
            scaleGroup.setAttribute("visibility", steps ? "" : "hidden");
        }, [ "steps" ])

        const scaleOK = makeSVGElement("path");
        scaleOK.classList.add("ui-gauge-meter__scale");
        scaleOK.classList.add("ui-gauge-meter__scale--ok");
        scaleGroup.appendChild(scaleOK);
        this.addHook(({ leftScale, bottomScale, ir, arcFlag, rightScale, thickness }) => {
            scaleOK.setAttribute("d", `M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`);
            scaleOK.setAttribute("stroke-width", thickness.toString());
        }, [ "size", "thickness", "circle" ])

        const scaleWarning = makeSVGElement("path");
        scaleWarning.classList.add("ui-gauge-meter__scale");
        scaleWarning.classList.add("ui-gauge-meter__scale--warning");
        scaleGroup.appendChild(scaleWarning);
        this.addHook(({ leftScale, bottomScale, ir, arcFlag, rightScale, thickness, innerCircumference, steps, min, max }) => {
            if(!steps || steps.length < 3 || typeof steps[1] !== "number" || typeof steps[2] !== "number") { return }
            scaleWarning.setAttribute("d", `M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`);
            scaleWarning.setAttribute("stroke-width", thickness.toString());
            scaleWarning.setAttribute("stroke-dasharray", `${innerCircumference * (steps[1] - min) / (max - min)} ${innerCircumference * (steps[2] - steps[1]) / (max - min)} ${innerCircumference}`);
        }, [ "size", "thickness", "circle", "steps", "min", "max" ])

        const scaleError = makeSVGElement("path");
        scaleError.classList.add("ui-gauge-meter__scale");
        scaleError.classList.add("ui-gauge-meter__scale--error");
        scaleGroup.appendChild(scaleError);
        this.addHook(({ leftScale, bottomScale, ir, arcFlag, rightScale, thickness, innerCircumference, steps, min, max }) => {
            if(!steps || steps.length < 4 || typeof steps[0] !== "number" && typeof steps[3] !== "number") { return }
            scaleError.setAttribute("d", `M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`);
            scaleError.setAttribute("stroke-width", thickness.toString());
            scaleError.setAttribute("stroke-dasharray", `${innerCircumference * (steps[0] - min) / (max - min)} ${innerCircumference * ((steps[3] ?? max) - steps[0]) / (max - min)} ${innerCircumference}`);
        }, [ "size", "thickness", "circle", "steps", "min", "max" ])

        //ticks
        const ticks = makeSVGElement("path");
        ticks.classList.add("ui-gauge-meter__ticks");
        tickShiftGroup.appendChild(ticks);
        this.addHook(({ markerID }) => {
            ticks.setAttribute("marker-start", `url(#${markerID})`);
            ticks.setAttribute("marker-end", `url(#${markerID})`);
        }, [ "id" ])
        this.addHook(({ ht, inset, bottom, r, arcFlag, size, thickness, tickSize, dasharray }) => {
            ticks.setAttribute("d", `M ${ht + inset} ${bottom} A ${r} ${r} 0 ${arcFlag} 1 ${size - ht - inset} ${bottom}`);
            ticks.setAttribute("stroke-width", `${thickness}`);
            ticks.setAttribute("stroke-dashoffset", `${tickSize * .5}`);
            ticks.setAttribute("stroke-dasharray", `${dasharray.join(' ')}`);
        }, [ "size", "thickness", "ticks", "circle" ])

        //subticks
        const subTicks = makeSVGElement("path");
        subTicks.classList.add("ui-gauge-meter__subticks");
        tickShiftGroup.appendChild(subTicks);
        this.addHook(({ ht, tinset, bottomTicks, tr, arcFlag, size, thickness, tickSize, subDasharray }) => {
            subTicks.setAttribute("d", `M ${ht + tinset - thickness * .25} ${bottomTicks} A ${tr} ${tr} 0 ${arcFlag} 1 ${size - ht - tinset + thickness * .25} ${bottomTicks}`);
            subTicks.setAttribute("stroke-width", `${ht}`);
            subTicks.setAttribute("stroke-dashoffset", `${tickSize * .5}`);
            subTicks.setAttribute("stroke-dasharray", `${subDasharray.join(' ')}`);
            subTicks.setAttribute("visibility", subDasharray.length ? "" : "hidden");
        }, [ "size", "thickness", "ticks", "subTicks", "circle" ])


        //tick labels
        const tickLabels = [];
        const tickLabelGroup = makeSVGElement("g");
        tickShiftGroup.appendChild(tickLabelGroup);
        this.addHook(({ ticks, circle, hs, tlr, min, max }) => {
            tickLabels.forEach(tl => {
                tl.remove();
            });
            tickLabels.length = 0;

            [...Array(ticks).fill(null).map((v,i) => i)].map((i, idx) => {
                const a = idx * Math.PI * 2 * circle / (ticks - 1) + Math.PI * .5 + (1 - circle) * Math.PI;
                const x = parseFloat((hs + Math.cos(a) * tlr).toFixed(4));
                const y = parseFloat((hs + Math.sin(a) * tlr).toFixed(4));
                
                const tl = makeSVGElement("text");
                tl.classList.add("ui-gauge-meter__ticklabel");
                tl.setAttribute("x", `${x}`);
                tl.setAttribute("y", `${y}`);
                tl.innerHTML = (min + idx * (max - min) / (ticks - 1)).toFixed(1).replace(/[,.]0$/, '');
                tickLabels.push(tl);
                tickLabelGroup.appendChild(tl);
            });
        }, ["ticks", "min", "max", "size", "tlr"])

        //label
        const label = makeSVGElement("text");
        label.classList.add("ui-gauge-meter__label");
        tickShiftGroup.appendChild(label);
        this.addHook(({ label: lbl }) => {
            label.innerHTML = lbl;
        }, [ "label" ])
        this.addHook(({ size, hs, circle }) => {
            label.setAttribute("x", hs);
            label.setAttribute("y", `${size * Math.min(.4, circle)}`);
        }, [ "size", "circle" ])

        //needle
        const needleGroup = makeSVGElement("g");
        needleGroup.classList.add("ui-gauge-meter__needle");
        tickShiftGroup.appendChild(needleGroup);
        this.addHook(({ hs, needleRotation }) => {
            needleGroup.setAttribute("style", `transform: rotate(${needleRotation}deg); transform-origin: ${hs}px ${hs}px;`);
        }, [ "size", "value", "min", "max", "circle" ])

        const needle = makeSVGElement("path");
        needleGroup.appendChild(needle);
        this.addHook(({ hs, needleLength }) => {
            needle.setAttribute("d", `m ${hs - 1.5} ${hs + 6}, 1.5 -${needleLength}, 1.5 ${needleLength}z`);
        }, [ "size", "thickness" ])

        const dot = makeSVGElement("circle");
        dot.setAttribute("r", "4");
        needleGroup.appendChild(dot);
        this.addHook(({ hs }) => {
            dot.setAttribute("cx", hs);
            dot.setAttribute("cy", hs);
        }, [ "size" ])

        //setup gauge value
        const value = document.createElement("div");
        value.classList.add("ui-gauge-meter__value");
        canvas.appendChild(value);
        this.addHook(({ value: v, hideValue, formatValue }) => {
            if (hideValue) {
                value.style.visibility = "hidden";
            } else {
                value.style.visibility = null;
                value.innerHTML = formatValue ? formatValue(v) : v.toString();
            }
        }, [ "value" ])

        this.update();

        element.appendChild(wrapper);
    }

    protected updateData(combinedOptions: MeterGaugeOptions) {
        const { value, size, color, id, thickness, steps, tickLabelsInside, circle, min, max, ticks, subTicks, tickLabelOffset } = combinedOptions;

        const sizeScale = size / 100;
        //precalculate various values
        const r = (size - thickness) * .5;
        const tr = r + thickness * .25;
        const ir = r - thickness - 2;
        const tlr = r + (tickLabelOffset || ((tickLabelsInside ? -10 : 5) * sizeScale));
        const circumference = 2 * Math.PI * r * circle;
        const tickCircumference = 2 * Math.PI * tr * circle;
        const innerCircumference =  2 * Math.PI * ir * circle;
        const ht = thickness * .5;
        const hs = size * .5;
        const sin = (1 - Math.sin(Math.PI * circle));
        const inset = sin * r;
        const iinset = sin * ir;
        const tinset = sin * tr;
    
        const tickSize = 1;
        const subTickSize = .5;
        const needleLength = hs + thickness;
        const needleRotation = 360 * circle * (value - min) / (max - min) - 180 * circle;
    
        let dasharray = [tickSize, circumference / (ticks - 1) - tickSize];
        let subDasharray: number[] = [];
    
        if (subTicks > 0) {
            const tickSegment = ((tickCircumference / (ticks - 1) - tickSize) - subTicks * subTickSize) / (subTicks + 1);
            subDasharray = [0, tickSize + tickSegment];
            for (let i = 0; i < subTicks; i++) {
                subDasharray.push(subTickSize, tickSegment)
            }
        }
    
        const maskID = `mask-${id}`;
        const markerID = `end-${id}`;
        const gradientID = `gradient-${id}`;
    
        const height = Math.sqrt(r * r - Math.pow(r - inset, 2));
        const bottom = (circle >= .5 ? r + height : r - height) + thickness * .5;
        const leftScale = ht + thickness + 2 + iinset;
        const rightScale = size - ht - thickness - 2 - iinset;
        const scaleHeight = Math.sqrt(ir * ir - Math.pow(ir - iinset, 2));
        const bottomScale = (circle >= .5 ? ir + scaleHeight : ir - scaleHeight) + thickness + thickness * .5 + 2;
    
        const ticksHeight = Math.sqrt(tr * tr - Math.pow(tr - tinset, 2));
        const bottomTicks = (circle >= .5 ? tr + ticksHeight : tr - ticksHeight) + thickness * .25;
    
        const arcFlag = circle >= .5 ? 1 : 0;

        return {
            ...combinedOptions,
            r,
            tr,
            ir,
            tlr,
            circumference,
            tickCircumference,
            innerCircumference,
            hs,
            ht,
            inset,
            iinset,
            tinset,
            tickSize,
            subTickSize,
            needleLength,
            needleRotation,
            dasharray,
            subDasharray,
            bottom,
            leftScale,
            rightScale,
            bottomScale,
            ticksHeight,
            bottomTicks,
            arcFlag,
            maskID,
            markerID,
            gradientID,
            sizeScale,
            color: color || getColor(value, steps)
        };
    }
}