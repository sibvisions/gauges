const byteToHex = [];
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).slice(1));
}
function unsafeStringify(arr, offset = 0) {
    return (byteToHex[arr[offset + 0]] +
        byteToHex[arr[offset + 1]] +
        byteToHex[arr[offset + 2]] +
        byteToHex[arr[offset + 3]] +
        '-' +
        byteToHex[arr[offset + 4]] +
        byteToHex[arr[offset + 5]] +
        '-' +
        byteToHex[arr[offset + 6]] +
        byteToHex[arr[offset + 7]] +
        '-' +
        byteToHex[arr[offset + 8]] +
        byteToHex[arr[offset + 9]] +
        '-' +
        byteToHex[arr[offset + 10]] +
        byteToHex[arr[offset + 11]] +
        byteToHex[arr[offset + 12]] +
        byteToHex[arr[offset + 13]] +
        byteToHex[arr[offset + 14]] +
        byteToHex[arr[offset + 15]]).toLowerCase();
}

const rnds8 = new Uint8Array(16);
function rng() {
    return crypto.getRandomValues(rnds8);
}

function v4(options, buf, offset) {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return _v4(options);
}
function _v4(options, buf, offset) {
    options = options || {};
    const rnds = options.random ?? options.rng?.() ?? rng();
    if (rnds.length < 16) {
        throw new Error('Random bytes length must be >= 16');
    }
    rnds[6] = (rnds[6] & 0x0f) | 0x40;
    rnds[8] = (rnds[8] & 0x3f) | 0x80;
    return unsafeStringify(rnds);
}

/** Color for ok value. */
const colorOK = "var(--ui-gauge-color__ok)";
/** Color for warning value. */
const colorWarning = "var(--ui-gauge-color__warning)";
/** Color for error value. */
const colorError = "var(--ui-gauge-color__error)";
/** get the color based on the value and steps */
function getColor(value, steps) {
    if (!steps) {
        return colorOK;
    }
    if (value <= (steps[0] ?? Number.MIN_VALUE) || value >= (steps[3] ?? Number.MAX_VALUE)) {
        return colorError;
    }
    else if (value <= (steps[1] ?? Number.MIN_VALUE) || value >= (steps[2] ?? Number.MAX_VALUE)) {
        return colorWarning;
    }
    else {
        return colorOK;
    }
}
const xmlns = "http://www.w3.org/2000/svg";
function makeSVGElement(name) {
    return document.createElementNS(xmlns, name);
}
function maybeScaleDefaults(options, size, skip = []) {
    if (size && options.size && size != options.size) {
        const out = { ...options };
        const scale = size / options.size;
        for (let k in out) {
            if (!skip.includes(k) && typeof out[k] === "number") {
                //@ts-ignore
                out[k] *= scale;
            }
        }
        return out;
    }
    else {
        return options;
    }
}

class AbstractGauge {
    options;
    hooks = [];
    initial = true;
    constructor(options, defaultOptions) {
        this.options = {
            id: v4(),
            ...defaultOptions,
            ...options
        };
    }
    addHook(callback, keys) {
        this.hooks.push({
            callback,
            keys
        });
    }
    update(options = {}) {
        const combinedOptions = { ...this.options, ...options };
        //get the keys of changed option values
        const changed = Object.keys(options).filter(k => options[k] !== this.options[k]);
        //if this is the first update or if there are changes
        if (this.initial || changed.length) {
            const data = this.updateData(combinedOptions);
            this.hooks.forEach(h => {
                if (this.initial || h.keys.some(k => changed.includes(k))) {
                    h.callback(data);
                }
            });
            this.initial = false;
        }
        this.options = combinedOptions;
    }
}

const defaultOptions$3 = {
    value: 0,
    min: 0,
    max: 10,
    size: 100,
    thickness: 20,
};
class RingGauge extends AbstractGauge {
    constructor(element, options) {
        super(options, maybeScaleDefaults(defaultOptions$3, options.size, ["min", "max", "value"]));
        const wrapper = document.createElement("div");
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-ring");
        this.addHook(({ width, height }) => {
            wrapper.style.width = width ? `${width}px` : null;
            wrapper.style.height = height ? `${height}px` : null;
        }, ["width", "height"]);
        const canvas = document.createElement("div");
        canvas.classList.add("ui-gauge__canvas");
        wrapper.appendChild(canvas);
        //setup title
        const title = document.createElement("div");
        title.classList.add("ui-gauge__title");
        this.addHook(({ title: t }) => {
            title.innerHTML = t;
            if (t) {
                wrapper.prepend(title);
            }
            else {
                title.remove();
            }
        }, ["title"]);
        //setup svg element
        const svg = makeSVGElement("svg");
        canvas.appendChild(svg);
        this.addHook(({ size }) => {
            svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        }, ["size"]);
        //various defs
        const defs = makeSVGElement("defs");
        //setup gradient
        const gradient = makeSVGElement("linearGradient");
        gradient.setAttribute("gradientTransform", "rotate(90)");
        this.addHook(({ gradientID }) => {
            gradient.setAttribute("id", gradientID);
        }, ["id"]);
        gradient.innerHTML = `
            <stop offset="0%" stop-color="var(--ui-gauge-gradient__top)" />
            <stop offset="100%" stop-color="var(--ui-gauge-gradient__bottom)" />
        `;
        defs.appendChild(gradient);
        //setup mask
        const mask = makeSVGElement("mask");
        this.addHook(({ maskID }) => {
            mask.setAttribute("id", maskID);
        }, ["id"]);
        const maskCircle = makeSVGElement("circle");
        maskCircle.setAttribute("stroke", "#fff");
        maskCircle.setAttribute("fill", "none");
        this.addHook(({ hs, r, thickness }) => {
            maskCircle.setAttribute("cx", hs);
            maskCircle.setAttribute("cy", hs);
            maskCircle.setAttribute("r", r);
            maskCircle.setAttribute("stroke-width", thickness.toString());
        }, ["size", "thickness"]);
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
            border.setAttribute("stroke-width", (thickness + 1).toString());
        }, ["size", "thickness"]);
        svg.appendChild(border);
        //group
        const group = makeSVGElement("g");
        this.addHook(({ maskID }) => {
            group.setAttribute("mask", `url(#${maskID})`);
        }, ["id"]);
        svg.appendChild(group);
        //fill rect
        const rect = makeSVGElement("rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("fill", "transparent");
        this.addHook(({ size }) => {
            rect.setAttribute("width", size.toString());
            rect.setAttribute("height", size.toString());
        }, ["size"]);
        group.appendChild(rect);
        //background
        const bg = makeSVGElement("circle");
        bg.classList.add("ui-gauge-ring__bg");
        group.appendChild(bg);
        this.addHook(({ hs, r, thickness }) => {
            bg.setAttribute("cx", hs);
            bg.setAttribute("cy", hs);
            bg.setAttribute("r", r);
            bg.setAttribute("stroke-width", (thickness + 2).toString());
        }, ["size", "thickness"]);
        this.addHook(({ gradientID }) => {
            bg.setAttribute("stroke", `url(#${gradientID})`);
        }, ["id"]);
        //foreground
        const fg = makeSVGElement("circle");
        fg.classList.add("ui-gauge-ring__fg");
        group.appendChild(fg);
        this.addHook(({ hs, r, thickness, circumference, value, min, max, color }) => {
            fg.setAttribute("cx", hs);
            fg.setAttribute("cy", hs);
            fg.setAttribute("r", r);
            fg.setAttribute("transform", `rotate(-90 ${hs} ${hs})`);
            fg.setAttribute("stroke", color);
            fg.setAttribute("stroke-width", (thickness + 2).toString());
            fg.setAttribute("stroke-dasharray", circumference);
            fg.setAttribute("stroke-dashoffset", Math.max(0, Math.min(circumference, (1 - (value - min) / (max - min)) * circumference)).toString());
        }, ["size", "thickness", "value", "min", "max", "color"]);
        //setup gauge label
        const label = document.createElement("div");
        label.classList.add("ui-gauge-ring__label");
        canvas.appendChild(label);
        this.addHook(({ value, hideValue, formatValue, label: lbl }) => {
            label.innerHTML = hideValue ? lbl : `${formatValue ? formatValue(value) : value} ${lbl}`;
        }, ["value", "label"]);
        this.update();
        element.appendChild(wrapper);
    }
    updateData(combinedOptions) {
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

const defaultOptions$2 = {
    value: 0,
    min: 0,
    max: 10,
    size: 100,
    thickness: 20,
};
class ArcGauge extends AbstractGauge {
    constructor(element, options) {
        super(options, maybeScaleDefaults(defaultOptions$2, options.size, ["min", "max", "value"]));
        const wrapper = document.createElement("div");
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-arc");
        this.addHook(({ width, height }) => {
            wrapper.style.width = width ? `${width}px` : null;
            wrapper.style.height = height ? `${height}px` : null;
        }, ["width", "height"]);
        const canvas = document.createElement("div");
        canvas.classList.add("ui-gauge__canvas");
        wrapper.appendChild(canvas);
        //setup title
        const title = document.createElement("div");
        title.classList.add("ui-gauge__title");
        this.addHook(({ title: t }) => {
            title.innerHTML = t;
            if (t) {
                wrapper.prepend(title);
            }
            else {
                title.remove();
            }
        }, ["title"]);
        //setup svg element
        const svg = makeSVGElement("svg");
        canvas.appendChild(svg);
        this.addHook(({ size }) => {
            svg.setAttribute("viewBox", `0 0 ${size} ${size}`);
        }, ["size"]);
        //various defs
        const defs = makeSVGElement("defs");
        //setup gradient
        const gradient = makeSVGElement("linearGradient");
        gradient.setAttribute("gradientTransform", "rotate(90)");
        this.addHook(({ gradientID }) => {
            gradient.setAttribute("id", gradientID);
        }, ["id"]);
        gradient.innerHTML = `
            <stop offset="0%" stop-color="var(--ui-gauge-gradient__top)" />
            <stop offset="100%" stop-color="var(--ui-gauge-gradient__bottom)" />
        `;
        defs.appendChild(gradient);
        //setup mask
        const mask = makeSVGElement("mask");
        this.addHook(({ maskID }) => {
            mask.setAttribute("id", maskID);
        }, ["id"]);
        const maskPath = makeSVGElement("path");
        maskPath.setAttribute("stroke", "#fff");
        maskPath.setAttribute("fill", "none");
        this.addHook(({ ht, hs, size, r, thickness }) => {
            maskPath.setAttribute("d", `M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`);
            maskPath.setAttribute("stroke-width", thickness.toString());
        }, ["size", "thickness"]);
        mask.appendChild(maskPath);
        defs.appendChild(mask);
        svg.appendChild(defs);
        //outer group
        const outerGroup = makeSVGElement("g");
        this.addHook(({ size }) => {
            outerGroup.setAttribute("transform", `translate(0 ${size * .25})`);
        }, ["size"]);
        svg.appendChild(outerGroup);
        //border
        const border = makeSVGElement("path");
        border.classList.add("ui-gauge-arc__border");
        outerGroup.appendChild(border);
        this.addHook(({ ht, hs, size, r, thickness }) => {
            border.setAttribute("d", `M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`);
            border.setAttribute("stroke-width", (thickness + 1).toString());
        }, ["size", "thickness"]);
        const borderHead = makeSVGElement("rect");
        borderHead.classList.add("ui-gauge-arc__border-head");
        borderHead.setAttribute("x", "-.5");
        borderHead.setAttribute("height", ".5");
        outerGroup.appendChild(borderHead);
        this.addHook(({ hs, thickness }) => {
            borderHead.setAttribute("y", hs);
            borderHead.setAttribute("width", (thickness + 1).toString());
        }, ["size", "thickness"]);
        const borderTail = makeSVGElement("rect");
        borderTail.classList.add("ui-gauge-arc__border-tail");
        borderTail.setAttribute("height", ".5");
        outerGroup.appendChild(borderTail);
        this.addHook(({ hs, size, thickness }) => {
            borderTail.setAttribute("x", (size - thickness - .5).toString());
            borderTail.setAttribute("y", hs);
            borderTail.setAttribute("width", (thickness + 1).toString());
        }, ["size", "thickness"]);
        //inner group
        const innerGroup = makeSVGElement("g");
        this.addHook(({ maskID }) => {
            innerGroup.setAttribute("mask", `url(#${maskID})`);
        }, ["id"]);
        outerGroup.appendChild(innerGroup);
        const rect = makeSVGElement("rect");
        rect.setAttribute("fill", "transparent");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        innerGroup.appendChild(rect);
        this.addHook(({ size }) => {
            rect.setAttribute("width", size.toString());
            rect.setAttribute("height", size.toString());
        }, ["size"]);
        const bg = makeSVGElement("path");
        bg.classList.add("ui-gauge-arc__bg");
        innerGroup.appendChild(bg);
        this.addHook(({ ht, hs, r, size, thickness }) => {
            bg.setAttribute("d", `M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`);
            bg.setAttribute("stroke-width", `${thickness + 2}`);
        }, ["size"]);
        this.addHook(({ gradientID }) => {
            bg.setAttribute("stroke", `url(#${gradientID})`);
        }, ["id"]);
        const fg = makeSVGElement("path");
        fg.classList.add("ui-gauge-arc__fg");
        innerGroup.appendChild(fg);
        this.addHook(({ ht, hs, r, size, thickness, circumference, value, min, max, color }) => {
            fg.setAttribute("d", `M ${ht} ${hs} A ${r} ${r} 0 0 1 ${size - ht} ${hs}`);
            fg.setAttribute("stroke", color);
            fg.setAttribute("stroke-width", `${thickness + 2}`);
            fg.setAttribute("stroke-dasharray", `${circumference}`);
            fg.setAttribute("stroke-dashoffset", Math.max(0, Math.min(circumference, (1 - (value - min) / (max - min)) * circumference)).toString());
        }, ["size", "value", "min", "max", "color"]);
        const minText = makeSVGElement("text");
        minText.setAttribute("text-anchor", "middle");
        minText.setAttribute("dominant-baseline", "hanging");
        outerGroup.appendChild(minText);
        this.addHook(({ hs, ht }) => {
            minText.setAttribute("x", ht);
            minText.setAttribute("y", `${hs + 4}`);
        }, ["size"]);
        this.addHook(({ min }) => {
            minText.innerHTML = min.toString();
        }, ["min"]);
        const maxText = makeSVGElement("text");
        maxText.setAttribute("text-anchor", "middle");
        maxText.setAttribute("dominant-baseline", "hanging");
        outerGroup.appendChild(maxText);
        this.addHook(({ hs, ht, size }) => {
            maxText.setAttribute("x", `${size - ht}`);
            maxText.setAttribute("y", `${hs + 4}`);
        }, ["size"]);
        this.addHook(({ max }) => {
            maxText.innerHTML = max.toString();
        }, ["max"]);
        //setup gauge label
        const label = document.createElement("div");
        label.classList.add("ui-gauge-arc__label");
        canvas.appendChild(label);
        this.addHook(({ value, hideValue, formatValue, label: lbl }) => {
            label.innerHTML = hideValue ? lbl : `${formatValue ? formatValue(value) : value} ${lbl}`;
        }, ["value", "label"]);
        this.update();
        element.appendChild(wrapper);
    }
    updateData(combinedOptions) {
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

const defaultOptions$1 = {
    value: 0,
    min: 0,
    max: 10,
    size: 100,
    thickness: 4,
    ticks: 5,
    subTicks: 4,
    circle: .25,
    tickLabelsInside: false,
};
class MeterGauge extends AbstractGauge {
    wrapper;
    constructor(element, options) {
        super(options, maybeScaleDefaults(defaultOptions$1, options.size, ["ticks", "subTicks", "circle", "min", "max", "value"]));
        const wrapper = document.createElement("div");
        this.wrapper = wrapper;
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-meter");
        this.addHook(({ width, height }) => {
            wrapper.style.width = width ? `${width}px` : null;
            wrapper.style.height = height ? `${height}px` : null;
        }, ["width", "height"]);
        const canvas = document.createElement("div");
        canvas.classList.add("ui-gauge__canvas");
        wrapper.appendChild(canvas);
        //setup title
        const title = document.createElement("div");
        title.classList.add("ui-gauge__title");
        this.addHook(({ title: t }) => {
            title.innerHTML = t;
            if (t) {
                wrapper.prepend(title);
            }
            else {
                title.remove();
            }
        }, ["title"]);
        //setup svg element
        const svg = makeSVGElement("svg");
        canvas.appendChild(svg);
        this.addHook(({ size, circle, tickLabelsInside, tickLabelOffset, sizeScale }) => {
            //XXX: the 1.2 factor is a magic number
            svg.setAttribute("viewBox", `0 0 ${size} ${circle < .5 ? size * Math.min(1, circle * 1.2) + (tickLabelsInside ? 0 : 2 * (tickLabelOffset || 5 * sizeScale)) : size}`);
        }, ["size", "tickLabelOffset"]);
        //various defs
        const defs = makeSVGElement("defs");
        //setup marker
        const marker = makeSVGElement("marker");
        marker.setAttribute("markerUnits", "userSpaceOnUse");
        marker.setAttribute("orient", "auto");
        defs.appendChild(marker);
        this.addHook(({ markerID }) => {
            marker.setAttribute("id", markerID);
        }, ["id"]);
        this.addHook(({ tickSize, thickness }) => {
            marker.setAttribute("viewBox", `0 0 ${tickSize} ${thickness}`);
            marker.setAttribute("refX", `${tickSize * .5}`);
            marker.setAttribute("refY", `${thickness * .5}`);
            marker.setAttribute("markerWidth", tickSize);
            marker.setAttribute("markerHeight", thickness.toString());
        }, ["thickness"]);
        const markerRect = makeSVGElement("rect");
        markerRect.setAttribute("x", "0");
        markerRect.setAttribute("y", "0");
        marker.appendChild(markerRect);
        this.addHook(({ tickSize, thickness }) => {
            markerRect.setAttribute("width", `${tickSize}`);
            markerRect.setAttribute("height", `${thickness}`);
        }, ["thickness"]);
        //setup gradient
        const gradient = makeSVGElement("linearGradient");
        gradient.setAttribute("gradientTransform", "rotate(90)");
        this.addHook(({ gradientID }) => {
            gradient.setAttribute("id", gradientID);
        }, ["id"]);
        gradient.innerHTML = `
            <stop offset="0%" stop-color="var(--ui-gauge-gradient__top)" />
            <stop offset="100%" stop-color="var(--ui-gauge-gradient__bottom)" />
        `;
        defs.appendChild(gradient);
        //setup mask
        const mask = makeSVGElement("mask");
        this.addHook(({ maskID }) => {
            mask.setAttribute("id", maskID);
        }, ["id"]);
        const maskPath = makeSVGElement("path");
        maskPath.setAttribute("stroke", "#fff");
        maskPath.setAttribute("fill", "none");
        this.addHook(({ leftScale, bottomScale, rightScale, ir, arcFlag, thickness }) => {
            maskPath.setAttribute("d", `M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`);
            maskPath.setAttribute("stroke-width", `${thickness - 1}`);
        }, ["size", "thickness"]);
        mask.appendChild(maskPath);
        defs.appendChild(mask);
        svg.appendChild(defs);
        //tick shift group
        const tickShiftGroup = makeSVGElement("g");
        svg.appendChild(tickShiftGroup);
        this.addHook(({ tickLabelsInside, tickLabelOffset, sizeScale }) => {
            tickShiftGroup.setAttribute("transform", `translate(0 ${tickLabelsInside ? 0 : 2 * (tickLabelOffset || 5 * sizeScale)})`);
        }, ["tickLabelsInside", "tickLabelOffset", "size"]);
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
        }, ["size"]);
        this.addHook(({ gradientID }) => {
            bg.setAttribute("fill", `url(#${gradientID})`);
        }, ["id"]);
        this.addHook(({ circle }) => {
            bg.setAttribute("visibility", circle > .5 ? "" : "hidden");
        }, ["circle"]);
        //scale
        const scaleGroup = makeSVGElement("g");
        tickShiftGroup.appendChild(scaleGroup);
        this.addHook(({ maskID }) => {
            scaleGroup.setAttribute("fill", `url(#${maskID})`);
        }, ["id"]);
        this.addHook(({ steps }) => {
            scaleGroup.setAttribute("visibility", steps ? "" : "hidden");
        }, ["steps"]);
        const scaleOK = makeSVGElement("path");
        scaleOK.classList.add("ui-gauge-meter__scale");
        scaleOK.classList.add("ui-gauge-meter__scale--ok");
        scaleGroup.appendChild(scaleOK);
        this.addHook(({ leftScale, bottomScale, ir, arcFlag, rightScale, thickness }) => {
            scaleOK.setAttribute("d", `M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`);
            scaleOK.setAttribute("stroke-width", thickness.toString());
        }, ["size", "thickness", "circle"]);
        const scaleWarning = makeSVGElement("path");
        scaleWarning.classList.add("ui-gauge-meter__scale");
        scaleWarning.classList.add("ui-gauge-meter__scale--warning");
        scaleGroup.appendChild(scaleWarning);
        this.addHook(({ leftScale, bottomScale, ir, arcFlag, rightScale, thickness, innerCircumference, steps, min, max }) => {
            if (!steps || steps.length < 3 || typeof steps[1] !== "number" || typeof steps[2] !== "number") {
                return;
            }
            scaleWarning.setAttribute("d", `M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`);
            scaleWarning.setAttribute("stroke-width", thickness.toString());
            scaleWarning.setAttribute("stroke-dasharray", `${innerCircumference * (steps[1] - min) / (max - min)} ${innerCircumference * (steps[2] - steps[1]) / (max - min)} ${innerCircumference}`);
        }, ["size", "thickness", "circle", "steps", "min", "max"]);
        const scaleError = makeSVGElement("path");
        scaleError.classList.add("ui-gauge-meter__scale");
        scaleError.classList.add("ui-gauge-meter__scale--error");
        scaleGroup.appendChild(scaleError);
        this.addHook(({ leftScale, bottomScale, ir, arcFlag, rightScale, thickness, innerCircumference, steps, min, max }) => {
            if (!steps || steps.length < 4 || typeof steps[0] !== "number" && typeof steps[3] !== "number") {
                return;
            }
            scaleError.setAttribute("d", `M ${leftScale} ${bottomScale} A ${ir} ${ir} 0 ${arcFlag} 1 ${rightScale} ${bottomScale}`);
            scaleError.setAttribute("stroke-width", thickness.toString());
            scaleError.setAttribute("stroke-dasharray", `${innerCircumference * (steps[0] - min) / (max - min)} ${innerCircumference * ((steps[3] ?? max) - steps[0]) / (max - min)} ${innerCircumference}`);
        }, ["size", "thickness", "circle", "steps", "min", "max"]);
        //ticks
        const ticks = makeSVGElement("path");
        ticks.classList.add("ui-gauge-meter__ticks");
        tickShiftGroup.appendChild(ticks);
        this.addHook(({ markerID }) => {
            ticks.setAttribute("marker-start", `url(#${markerID})`);
            ticks.setAttribute("marker-end", `url(#${markerID})`);
        }, ["id"]);
        this.addHook(({ ht, inset, bottom, r, arcFlag, size, thickness, tickSize, dasharray }) => {
            ticks.setAttribute("d", `M ${ht + inset} ${bottom} A ${r} ${r} 0 ${arcFlag} 1 ${size - ht - inset} ${bottom}`);
            ticks.setAttribute("stroke-width", `${thickness}`);
            ticks.setAttribute("stroke-dashoffset", `${tickSize * .5}`);
            ticks.setAttribute("stroke-dasharray", `${dasharray.join(' ')}`);
        }, ["size", "thickness", "ticks", "circle"]);
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
        }, ["size", "thickness", "ticks", "subTicks", "circle"]);
        //tick labels
        const tickLabels = [];
        const tickLabelGroup = makeSVGElement("g");
        tickShiftGroup.appendChild(tickLabelGroup);
        this.addHook(({ ticks, circle, hs, tlr, min, max }) => {
            tickLabels.forEach(tl => {
                tl.remove();
            });
            tickLabels.length = 0;
            [...Array(ticks).fill(null).map((v, i) => i)].map((i, idx) => {
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
        }, ["ticks", "min", "max", "size", "tlr"]);
        //label
        const label = makeSVGElement("text");
        label.classList.add("ui-gauge-meter__label");
        tickShiftGroup.appendChild(label);
        this.addHook(({ label: lbl }) => {
            label.innerHTML = lbl;
        }, ["label"]);
        this.addHook(({ size, hs, circle }) => {
            label.setAttribute("x", hs);
            label.setAttribute("y", `${size * Math.min(.4, circle)}`);
        }, ["size", "circle"]);
        //needle
        const needleGroup = makeSVGElement("g");
        needleGroup.classList.add("ui-gauge-meter__needle");
        tickShiftGroup.appendChild(needleGroup);
        this.addHook(({ hs, needleRotation }) => {
            needleGroup.setAttribute("style", `transform: rotate(${needleRotation}deg); transform-origin: ${hs}px ${hs}px;`);
        }, ["size", "value", "min", "max", "circle"]);
        const needle = makeSVGElement("path");
        needleGroup.appendChild(needle);
        this.addHook(({ hs, needleLength }) => {
            needle.setAttribute("d", `m ${hs - 1.5} ${hs + 6}, 1.5 -${needleLength}, 1.5 ${needleLength}z`);
        }, ["size", "thickness"]);
        const dot = makeSVGElement("circle");
        dot.setAttribute("r", "4");
        needleGroup.appendChild(dot);
        this.addHook(({ hs }) => {
            dot.setAttribute("cx", hs);
            dot.setAttribute("cy", hs);
        }, ["size"]);
        //setup gauge value
        const value = document.createElement("div");
        value.classList.add("ui-gauge-meter__value");
        canvas.appendChild(value);
        this.addHook(({ value: v, hideValue, formatValue }) => {
            if (hideValue) {
                value.style.visibility = "hidden";
            }
            else {
                value.style.visibility = null;
                value.innerHTML = formatValue ? formatValue(v) : v.toString();
            }
        }, ["value"]);
        this.update();
        element.appendChild(wrapper);
    }
    updateData(combinedOptions) {
        const { value, size, color, id, thickness, steps, tickLabelsInside, circle, min, max, ticks, subTicks, tickLabelOffset } = combinedOptions;
        const sizeScale = size / 100;
        //precalculate various values
        const r = (size - thickness) * .5;
        const tr = r + thickness * .25;
        const ir = r - thickness - 2;
        const tlr = r + (tickLabelOffset || ((tickLabelsInside ? -10 : 5) * sizeScale));
        const circumference = 2 * Math.PI * r * circle;
        const tickCircumference = 2 * Math.PI * tr * circle;
        const innerCircumference = 2 * Math.PI * ir * circle;
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
        let subDasharray = [];
        if (subTicks > 0) {
            const tickSegment = ((tickCircumference / (ticks - 1) - tickSize) - subTicks * subTickSize) / (subTicks + 1);
            subDasharray = [0, tickSize + tickSegment];
            for (let i = 0; i < subTicks; i++) {
                subDasharray.push(subTickSize, tickSegment);
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

const defaultOptions = {
    ticks: 11,
    subTicks: 3,
    circle: .75,
    tickLabelsInside: true,
};
class SpeedometerGauge extends MeterGauge {
    constructor(element, options) {
        super(element, {
            ...defaultOptions,
            ...options
        });
        this.wrapper.classList.add("ui-gauge-meter--speed");
    }
}

export { ArcGauge, MeterGauge, RingGauge, SpeedometerGauge };
