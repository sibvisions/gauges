/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

function __spreadArray(to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
}

// Unique ID creation requires a high quality random # generator. In the browser we therefore
// require the crypto API and do not support built-in fallback to lower quality random number
// generators (like Math.random()).
var getRandomValues;
var rnds8 = new Uint8Array(16);
function rng() {
  // lazy load so that environments that need to polyfill have a chance to do so
  if (!getRandomValues) {
    // getRandomValues needs to be invoked in a context where "this" is a Crypto implementation. Also,
    // find the complete implementation of crypto (msCrypto) on IE11.
    getRandomValues = typeof crypto !== 'undefined' && crypto.getRandomValues && crypto.getRandomValues.bind(crypto) || typeof msCrypto !== 'undefined' && typeof msCrypto.getRandomValues === 'function' && msCrypto.getRandomValues.bind(msCrypto);

    if (!getRandomValues) {
      throw new Error('crypto.getRandomValues() not supported. See https://github.com/uuidjs/uuid#getrandomvalues-not-supported');
    }
  }

  return getRandomValues(rnds8);
}

var REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|00000000-0000-0000-0000-000000000000)$/i;

function validate(uuid) {
  return typeof uuid === 'string' && REGEX.test(uuid);
}

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */

var byteToHex = [];

for (var i = 0; i < 256; ++i) {
  byteToHex.push((i + 0x100).toString(16).substr(1));
}

function stringify(arr) {
  var offset = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0;
  // Note: Be careful editing this code!  It's been tuned for performance
  // and works in ways you may not expect. See https://github.com/uuidjs/uuid/pull/434
  var uuid = (byteToHex[arr[offset + 0]] + byteToHex[arr[offset + 1]] + byteToHex[arr[offset + 2]] + byteToHex[arr[offset + 3]] + '-' + byteToHex[arr[offset + 4]] + byteToHex[arr[offset + 5]] + '-' + byteToHex[arr[offset + 6]] + byteToHex[arr[offset + 7]] + '-' + byteToHex[arr[offset + 8]] + byteToHex[arr[offset + 9]] + '-' + byteToHex[arr[offset + 10]] + byteToHex[arr[offset + 11]] + byteToHex[arr[offset + 12]] + byteToHex[arr[offset + 13]] + byteToHex[arr[offset + 14]] + byteToHex[arr[offset + 15]]).toLowerCase(); // Consistency check for valid UUID.  If this throws, it's likely due to one
  // of the following:
  // - One or more input array values don't map to a hex octet (leading to
  // "undefined" in the uuid)
  // - Invalid input values for the RFC `version` or `variant` fields

  if (!validate(uuid)) {
    throw TypeError('Stringified UUID is invalid');
  }

  return uuid;
}

function v4(options, buf, offset) {
  options = options || {};
  var rnds = options.random || (options.rng || rng)(); // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`

  rnds[6] = rnds[6] & 0x0f | 0x40;
  rnds[8] = rnds[8] & 0x3f | 0x80; // Copy bytes to buffer, if provided

  if (buf) {
    offset = offset || 0;

    for (var i = 0; i < 16; ++i) {
      buf[offset + i] = rnds[i];
    }

    return buf;
  }

  return stringify(rnds);
}

/** Color for ok value. */
var colorOK = "var(--ui-gauge-color__ok)";
/** Color for warning value. */
var colorWarning = "var(--ui-gauge-color__warning)";
/** Color for error value. */
var colorError = "var(--ui-gauge-color__error)";
/** get the color based on the value and steps */
function getColor(value, steps) {
    var _a, _b, _c, _d;
    if (!steps) {
        return colorOK;
    }
    if (value <= ((_a = steps[0]) !== null && _a !== void 0 ? _a : Number.MIN_VALUE) || value >= ((_b = steps[3]) !== null && _b !== void 0 ? _b : Number.MAX_VALUE)) {
        return colorError;
    }
    else if (value <= ((_c = steps[1]) !== null && _c !== void 0 ? _c : Number.MIN_VALUE) || value >= ((_d = steps[2]) !== null && _d !== void 0 ? _d : Number.MAX_VALUE)) {
        return colorWarning;
    }
    else {
        return colorOK;
    }
}
var xmlns = "http://www.w3.org/2000/svg";
function makeSVGElement(name) {
    return document.createElementNS(xmlns, name);
}
function maybeScaleDefaults(options, size, skip) {
    if (skip === void 0) { skip = []; }
    if (size && options.size && size != options.size) {
        var out = __assign({}, options);
        var scale = size / options.size;
        for (var k in out) {
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

var AbstractGauge = /** @class */ (function () {
    function AbstractGauge(options, defaultOptions) {
        this.hooks = [];
        this.initial = true;
        this.options = __assign(__assign({ id: v4() }, defaultOptions), options);
    }
    AbstractGauge.prototype.addHook = function (callback, keys) {
        this.hooks.push({
            callback: callback,
            keys: keys
        });
    };
    AbstractGauge.prototype.update = function (options) {
        var _this = this;
        if (options === void 0) { options = {}; }
        var combinedOptions = __assign(__assign({}, this.options), options);
        //get the keys of changed option values
        var changed = Object.keys(options).filter(function (k) { return options[k] !== _this.options[k]; });
        //if this is the first update or if there are changes
        if (this.initial || changed.length) {
            var data_1 = this.updateData(combinedOptions);
            this.hooks.forEach(function (h) {
                if (_this.initial || h.keys.some(function (k) { return changed.includes(k); })) {
                    h.callback(data_1);
                }
            });
            this.initial = false;
        }
        this.options = combinedOptions;
    };
    return AbstractGauge;
}());

var defaultOptions$3 = {
    value: 0,
    min: 0,
    max: 10,
    size: 100,
    thickness: 20
};
var RingGauge = /** @class */ (function (_super) {
    __extends(RingGauge, _super);
    function RingGauge(element, options) {
        var _this = _super.call(this, options, maybeScaleDefaults(defaultOptions$3, options.size, ["min", "max", "value"])) || this;
        var wrapper = document.createElement("div");
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-ring");
        _this.addHook(function (_a) {
            var width = _a.width, height = _a.height;
            wrapper.style.width = width ? width + "px" : null;
            wrapper.style.height = height ? height + "px" : null;
        }, ["width", "height"]);
        var canvas = document.createElement("div");
        canvas.classList.add("ui-gauge__canvas");
        wrapper.appendChild(canvas);
        //setup title
        var title = document.createElement("div");
        title.classList.add("ui-gauge__title");
        _this.addHook(function (_a) {
            var t = _a.title;
            title.innerHTML = t;
            if (t) {
                wrapper.prepend(title);
            }
            else {
                title.remove();
            }
        }, ["title"]);
        //setup svg element
        var svg = makeSVGElement("svg");
        canvas.appendChild(svg);
        _this.addHook(function (_a) {
            var size = _a.size;
            svg.setAttribute("viewBox", "0 0 " + size + " " + size);
        }, ["size"]);
        //various defs
        var defs = makeSVGElement("defs");
        //setup gradient
        var gradient = makeSVGElement("linearGradient");
        gradient.setAttribute("gradientTransform", "rotate(90)");
        _this.addHook(function (_a) {
            var gradientID = _a.gradientID;
            gradient.setAttribute("id", gradientID);
        }, ["id"]);
        gradient.innerHTML = "\n            <stop offset=\"0%\" stop-color=\"var(--ui-gauge-gradient__top)\" />\n            <stop offset=\"100%\" stop-color=\"var(--ui-gauge-gradient__bottom)\" />\n        ";
        defs.appendChild(gradient);
        //setup mask
        var mask = makeSVGElement("mask");
        _this.addHook(function (_a) {
            var maskID = _a.maskID;
            mask.setAttribute("id", maskID);
        }, ["id"]);
        var maskCircle = makeSVGElement("circle");
        maskCircle.setAttribute("stroke", "#fff");
        maskCircle.setAttribute("fill", "none");
        _this.addHook(function (_a) {
            var hs = _a.hs, r = _a.r, thickness = _a.thickness;
            maskCircle.setAttribute("cx", hs);
            maskCircle.setAttribute("cy", hs);
            maskCircle.setAttribute("r", r);
            maskCircle.setAttribute("stroke-width", thickness.toString());
        }, ["size", "thickness"]);
        mask.appendChild(maskCircle);
        defs.appendChild(mask);
        svg.appendChild(defs);
        //setup border
        var border = makeSVGElement("circle");
        border.classList.add("ui-gauge-ring__border");
        _this.addHook(function (_a) {
            var hs = _a.hs, r = _a.r, thickness = _a.thickness;
            border.setAttribute("cx", hs);
            border.setAttribute("cy", hs);
            border.setAttribute("r", r);
            border.setAttribute("stroke-width", (thickness + 1).toString());
        }, ["size", "thickness"]);
        svg.appendChild(border);
        //group
        var group = makeSVGElement("g");
        _this.addHook(function (_a) {
            var maskID = _a.maskID;
            group.setAttribute("mask", "url(#" + maskID + ")");
        }, ["id"]);
        svg.appendChild(group);
        //fill rect
        var rect = makeSVGElement("rect");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        rect.setAttribute("fill", "transparent");
        _this.addHook(function (_a) {
            var size = _a.size;
            rect.setAttribute("width", size.toString());
            rect.setAttribute("height", size.toString());
        }, ["size"]);
        group.appendChild(rect);
        //background
        var bg = makeSVGElement("circle");
        bg.classList.add("ui-gauge-ring__bg");
        group.appendChild(bg);
        _this.addHook(function (_a) {
            var hs = _a.hs, r = _a.r, thickness = _a.thickness;
            bg.setAttribute("cx", hs);
            bg.setAttribute("cy", hs);
            bg.setAttribute("r", r);
            bg.setAttribute("stroke-width", (thickness + 2).toString());
        }, ["size", "thickness"]);
        _this.addHook(function (_a) {
            var gradientID = _a.gradientID;
            bg.setAttribute("stroke", "url(#" + gradientID + ")");
        }, ["id"]);
        //foreground
        var fg = makeSVGElement("circle");
        fg.classList.add("ui-gauge-ring__fg");
        group.appendChild(fg);
        _this.addHook(function (_a) {
            var hs = _a.hs, r = _a.r, thickness = _a.thickness, circumference = _a.circumference, value = _a.value, min = _a.min, max = _a.max, color = _a.color;
            fg.setAttribute("cx", hs);
            fg.setAttribute("cy", hs);
            fg.setAttribute("r", r);
            fg.setAttribute("transform", "rotate(-90 " + hs + " " + hs + ")");
            fg.setAttribute("stroke", color);
            fg.setAttribute("stroke-width", (thickness + 2).toString());
            fg.setAttribute("stroke-dasharray", circumference);
            fg.setAttribute("stroke-dashoffset", Math.max(0, Math.min(circumference, (1 - (value - min) / (max - min)) * circumference)).toString());
        }, ["size", "thickness", "value", "min", "max", "color"]);
        //setup gauge label
        var label = document.createElement("div");
        label.classList.add("ui-gauge-ring__label");
        canvas.appendChild(label);
        _this.addHook(function (_a) {
            var value = _a.value, hideValue = _a.hideValue, formatValue = _a.formatValue, lbl = _a.label;
            label.innerHTML = hideValue ? lbl : (formatValue ? formatValue(value) : value) + " " + lbl;
        }, ["value", "label"]);
        _this.update();
        element.appendChild(wrapper);
        return _this;
    }
    RingGauge.prototype.updateData = function (combinedOptions) {
        var value = combinedOptions.value, size = combinedOptions.size, color = combinedOptions.color, id = combinedOptions.id, thickness = combinedOptions.thickness, steps = combinedOptions.steps;
        //precalculate various values
        var r = (size - thickness - 1) * .5;
        var circumference = 2 * Math.PI * r;
        var hs = size * .5;
        var maskID = "mask-" + id;
        var gradientID = "gradient-" + id;
        return __assign(__assign({}, combinedOptions), { r: r, circumference: circumference, hs: hs, maskID: maskID, gradientID: gradientID, color: color || getColor(value, steps) });
    };
    return RingGauge;
}(AbstractGauge));

var defaultOptions$2 = {
    value: 0,
    min: 0,
    max: 10,
    size: 100,
    thickness: 20
};
var ArcGauge = /** @class */ (function (_super) {
    __extends(ArcGauge, _super);
    function ArcGauge(element, options) {
        var _this = _super.call(this, options, maybeScaleDefaults(defaultOptions$2, options.size, ["min", "max", "value"])) || this;
        var wrapper = document.createElement("div");
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-arc");
        _this.addHook(function (_a) {
            var width = _a.width, height = _a.height;
            wrapper.style.width = width ? width + "px" : null;
            wrapper.style.height = height ? height + "px" : null;
        }, ["width", "height"]);
        var canvas = document.createElement("div");
        canvas.classList.add("ui-gauge__canvas");
        wrapper.appendChild(canvas);
        //setup title
        var title = document.createElement("div");
        title.classList.add("ui-gauge__title");
        _this.addHook(function (_a) {
            var t = _a.title;
            title.innerHTML = t;
            if (t) {
                wrapper.prepend(title);
            }
            else {
                title.remove();
            }
        }, ["title"]);
        //setup svg element
        var svg = makeSVGElement("svg");
        canvas.appendChild(svg);
        _this.addHook(function (_a) {
            var size = _a.size;
            svg.setAttribute("viewBox", "0 0 " + size + " " + size);
        }, ["size"]);
        //various defs
        var defs = makeSVGElement("defs");
        //setup gradient
        var gradient = makeSVGElement("linearGradient");
        gradient.setAttribute("gradientTransform", "rotate(90)");
        _this.addHook(function (_a) {
            var gradientID = _a.gradientID;
            gradient.setAttribute("id", gradientID);
        }, ["id"]);
        gradient.innerHTML = "\n            <stop offset=\"0%\" stop-color=\"var(--ui-gauge-gradient__top)\" />\n            <stop offset=\"100%\" stop-color=\"var(--ui-gauge-gradient__bottom)\" />\n        ";
        defs.appendChild(gradient);
        //setup mask
        var mask = makeSVGElement("mask");
        _this.addHook(function (_a) {
            var maskID = _a.maskID;
            mask.setAttribute("id", maskID);
        }, ["id"]);
        var maskPath = makeSVGElement("path");
        maskPath.setAttribute("stroke", "#fff");
        maskPath.setAttribute("fill", "none");
        _this.addHook(function (_a) {
            var ht = _a.ht, hs = _a.hs, size = _a.size, r = _a.r, thickness = _a.thickness;
            maskPath.setAttribute("d", "M " + ht + " " + hs + " A " + r + " " + r + " 0 0 1 " + (size - ht) + " " + hs);
            maskPath.setAttribute("stroke-width", thickness.toString());
        }, ["size", "thickness"]);
        mask.appendChild(maskPath);
        defs.appendChild(mask);
        svg.appendChild(defs);
        //outer group
        var outerGroup = makeSVGElement("g");
        _this.addHook(function (_a) {
            var size = _a.size;
            outerGroup.setAttribute("transform", "translate(0 " + size * .25 + ")");
        }, ["size"]);
        svg.appendChild(outerGroup);
        //border
        var border = makeSVGElement("path");
        border.classList.add("ui-gauge-arc__border");
        outerGroup.appendChild(border);
        _this.addHook(function (_a) {
            var ht = _a.ht, hs = _a.hs, size = _a.size, r = _a.r, thickness = _a.thickness;
            border.setAttribute("d", "M " + ht + " " + hs + " A " + r + " " + r + " 0 0 1 " + (size - ht) + " " + hs);
            border.setAttribute("stroke-width", (thickness + 1).toString());
        }, ["size", "thickness"]);
        var borderHead = makeSVGElement("rect");
        borderHead.classList.add("ui-gauge-arc__border-head");
        borderHead.setAttribute("x", "-.5");
        borderHead.setAttribute("height", ".5");
        outerGroup.appendChild(borderHead);
        _this.addHook(function (_a) {
            var hs = _a.hs, thickness = _a.thickness;
            borderHead.setAttribute("y", hs);
            borderHead.setAttribute("width", (thickness + 1).toString());
        }, ["size", "thickness"]);
        var borderTail = makeSVGElement("rect");
        borderTail.classList.add("ui-gauge-arc__border-tail");
        borderTail.setAttribute("height", ".5");
        outerGroup.appendChild(borderTail);
        _this.addHook(function (_a) {
            var hs = _a.hs, size = _a.size, thickness = _a.thickness;
            borderTail.setAttribute("x", (size - thickness - .5).toString());
            borderTail.setAttribute("y", hs);
            borderTail.setAttribute("width", (thickness + 1).toString());
        }, ["size", "thickness"]);
        //inner group
        var innerGroup = makeSVGElement("g");
        _this.addHook(function (_a) {
            var maskID = _a.maskID;
            innerGroup.setAttribute("mask", "url(#" + maskID + ")");
        }, ["id"]);
        outerGroup.appendChild(innerGroup);
        var rect = makeSVGElement("rect");
        rect.setAttribute("fill", "transparent");
        rect.setAttribute("x", "0");
        rect.setAttribute("y", "0");
        innerGroup.appendChild(rect);
        _this.addHook(function (_a) {
            var size = _a.size;
            rect.setAttribute("width", size.toString());
            rect.setAttribute("height", size.toString());
        }, ["size"]);
        var bg = makeSVGElement("path");
        bg.classList.add("ui-gauge-arc__bg");
        innerGroup.appendChild(bg);
        _this.addHook(function (_a) {
            var ht = _a.ht, hs = _a.hs, r = _a.r, size = _a.size, thickness = _a.thickness;
            bg.setAttribute("d", "M " + ht + " " + hs + " A " + r + " " + r + " 0 0 1 " + (size - ht) + " " + hs);
            bg.setAttribute("stroke-width", "" + (thickness + 2));
        }, ["size"]);
        _this.addHook(function (_a) {
            var gradientID = _a.gradientID;
            bg.setAttribute("stroke", "url(#" + gradientID + ")");
        }, ["id"]);
        var fg = makeSVGElement("path");
        fg.classList.add("ui-gauge-arc__fg");
        innerGroup.appendChild(fg);
        _this.addHook(function (_a) {
            var ht = _a.ht, hs = _a.hs, r = _a.r, size = _a.size, thickness = _a.thickness, circumference = _a.circumference, value = _a.value, min = _a.min, max = _a.max, color = _a.color;
            fg.setAttribute("d", "M " + ht + " " + hs + " A " + r + " " + r + " 0 0 1 " + (size - ht) + " " + hs);
            fg.setAttribute("stroke", color);
            fg.setAttribute("stroke-width", "" + (thickness + 2));
            fg.setAttribute("stroke-dasharray", "" + circumference);
            fg.setAttribute("stroke-dashoffset", Math.max(0, Math.min(circumference, (1 - (value - min) / (max - min)) * circumference)).toString());
        }, ["size", "value", "min", "max", "color"]);
        var minText = makeSVGElement("text");
        minText.setAttribute("text-anchor", "middle");
        minText.setAttribute("dominant-baseline", "hanging");
        outerGroup.appendChild(minText);
        _this.addHook(function (_a) {
            var hs = _a.hs, ht = _a.ht;
            minText.setAttribute("x", ht);
            minText.setAttribute("y", "" + (hs + 4));
        }, ["size"]);
        _this.addHook(function (_a) {
            var min = _a.min;
            minText.innerHTML = min.toString();
        }, ["min"]);
        var maxText = makeSVGElement("text");
        maxText.setAttribute("text-anchor", "middle");
        maxText.setAttribute("dominant-baseline", "hanging");
        outerGroup.appendChild(maxText);
        _this.addHook(function (_a) {
            var hs = _a.hs, ht = _a.ht, size = _a.size;
            maxText.setAttribute("x", "" + (size - ht));
            maxText.setAttribute("y", "" + (hs + 4));
        }, ["size"]);
        _this.addHook(function (_a) {
            var max = _a.max;
            maxText.innerHTML = max.toString();
        }, ["max"]);
        //setup gauge label
        var label = document.createElement("div");
        label.classList.add("ui-gauge-arc__label");
        canvas.appendChild(label);
        _this.addHook(function (_a) {
            var value = _a.value, hideValue = _a.hideValue, formatValue = _a.formatValue, lbl = _a.label;
            label.innerHTML = hideValue ? lbl : (formatValue ? formatValue(value) : value) + " " + lbl;
        }, ["value", "label"]);
        _this.update();
        element.appendChild(wrapper);
        return _this;
    }
    ArcGauge.prototype.updateData = function (combinedOptions) {
        var value = combinedOptions.value, size = combinedOptions.size, color = combinedOptions.color, id = combinedOptions.id, thickness = combinedOptions.thickness, steps = combinedOptions.steps;
        //precalculate various values
        var r = (size - thickness - 1) * .5;
        var circumference = Math.PI * r;
        var ht = thickness * .5;
        var hs = size * .5;
        var maskID = "mask-" + id;
        var gradientID = "gradient-" + id;
        return __assign(__assign({}, combinedOptions), { r: r, circumference: circumference, ht: ht, hs: hs, maskID: maskID, gradientID: gradientID, color: color || getColor(value, steps) });
    };
    return ArcGauge;
}(AbstractGauge));

var defaultOptions$1 = {
    value: 0,
    min: 0,
    max: 10,
    size: 100,
    thickness: 4,
    ticks: 5,
    subTicks: 4,
    circle: .25,
    tickLabelsInside: false
};
var MeterGauge = /** @class */ (function (_super) {
    __extends(MeterGauge, _super);
    function MeterGauge(element, options) {
        var _this = _super.call(this, options, maybeScaleDefaults(defaultOptions$1, options.size, ["ticks", "subTicks", "circle", "min", "max", "value"])) || this;
        var wrapper = document.createElement("div");
        _this.wrapper = wrapper;
        wrapper.classList.add("ui-gauge");
        wrapper.classList.add("ui-gauge-meter");
        _this.addHook(function (_a) {
            var width = _a.width, height = _a.height;
            wrapper.style.width = width ? width + "px" : null;
            wrapper.style.height = height ? height + "px" : null;
        }, ["width", "height"]);
        var canvas = document.createElement("div");
        canvas.classList.add("ui-gauge__canvas");
        wrapper.appendChild(canvas);
        //setup title
        var title = document.createElement("div");
        title.classList.add("ui-gauge__title");
        _this.addHook(function (_a) {
            var t = _a.title;
            title.innerHTML = t;
            if (t) {
                wrapper.prepend(title);
            }
            else {
                title.remove();
            }
        }, ["title"]);
        //setup svg element
        var svg = makeSVGElement("svg");
        canvas.appendChild(svg);
        _this.addHook(function (_a) {
            var size = _a.size, circle = _a.circle, tickLabelsInside = _a.tickLabelsInside, tickLabelOffset = _a.tickLabelOffset, sizeScale = _a.sizeScale;
            //XXX: the 1.2 factor is a magic number
            svg.setAttribute("viewBox", "0 0 " + size + " " + (circle < .5 ? size * Math.min(1, circle * 1.2) + (tickLabelsInside ? 0 : 2 * (tickLabelOffset || 5 * sizeScale)) : size));
        }, ["size", "tickLabelOffset"]);
        //various defs
        var defs = makeSVGElement("defs");
        //setup marker
        var marker = makeSVGElement("marker");
        marker.setAttribute("markerUnits", "userSpaceOnUse");
        marker.setAttribute("orient", "auto");
        defs.appendChild(marker);
        _this.addHook(function (_a) {
            var markerID = _a.markerID;
            marker.setAttribute("id", markerID);
        }, ["id"]);
        _this.addHook(function (_a) {
            var tickSize = _a.tickSize, thickness = _a.thickness;
            marker.setAttribute("viewBox", "0 0 " + tickSize + " " + thickness);
            marker.setAttribute("refX", "" + tickSize * .5);
            marker.setAttribute("refY", "" + thickness * .5);
            marker.setAttribute("markerWidth", tickSize);
            marker.setAttribute("markerHeight", thickness.toString());
        }, ["thickness"]);
        var markerRect = makeSVGElement("rect");
        markerRect.setAttribute("x", "0");
        markerRect.setAttribute("y", "0");
        marker.appendChild(markerRect);
        _this.addHook(function (_a) {
            var tickSize = _a.tickSize, thickness = _a.thickness;
            markerRect.setAttribute("width", "" + tickSize);
            markerRect.setAttribute("height", "" + thickness);
        }, ["thickness"]);
        //setup gradient
        var gradient = makeSVGElement("linearGradient");
        gradient.setAttribute("gradientTransform", "rotate(90)");
        _this.addHook(function (_a) {
            var gradientID = _a.gradientID;
            gradient.setAttribute("id", gradientID);
        }, ["id"]);
        gradient.innerHTML = "\n            <stop offset=\"0%\" stop-color=\"var(--ui-gauge-gradient__top)\" />\n            <stop offset=\"100%\" stop-color=\"var(--ui-gauge-gradient__bottom)\" />\n        ";
        defs.appendChild(gradient);
        //setup mask
        var mask = makeSVGElement("mask");
        _this.addHook(function (_a) {
            var maskID = _a.maskID;
            mask.setAttribute("id", maskID);
        }, ["id"]);
        var maskPath = makeSVGElement("path");
        maskPath.setAttribute("stroke", "#fff");
        maskPath.setAttribute("fill", "none");
        _this.addHook(function (_a) {
            var leftScale = _a.leftScale, bottomScale = _a.bottomScale, rightScale = _a.rightScale, ir = _a.ir, arcFlag = _a.arcFlag, thickness = _a.thickness;
            maskPath.setAttribute("d", "M " + leftScale + " " + bottomScale + " A " + ir + " " + ir + " 0 " + arcFlag + " 1 " + rightScale + " " + bottomScale);
            maskPath.setAttribute("stroke-width", "" + (thickness - 1));
        }, ["size", "thickness"]);
        mask.appendChild(maskPath);
        defs.appendChild(mask);
        svg.appendChild(defs);
        //tick shift group
        var tickShiftGroup = makeSVGElement("g");
        svg.appendChild(tickShiftGroup);
        _this.addHook(function (_a) {
            var tickLabelsInside = _a.tickLabelsInside, tickLabelOffset = _a.tickLabelOffset, sizeScale = _a.sizeScale;
            tickShiftGroup.setAttribute("transform", "translate(0 " + (tickLabelsInside ? 0 : 2 * (tickLabelOffset || 5 * sizeScale)) + ")");
        }, ["tickLabelsInside", "tickLabelOffset", "size"]);
        //bg 
        var bg = makeSVGElement("circle");
        bg.classList.add("ui-gauge-meter__bg");
        bg.setAttribute("stroke-width", ".5");
        bg.setAttribute("stroke", "var(--ui-gauge-color__border)");
        tickShiftGroup.appendChild(bg);
        _this.addHook(function (_a) {
            var hs = _a.hs;
            bg.setAttribute("cx", "" + hs);
            bg.setAttribute("cy", "" + hs);
            bg.setAttribute("r", "" + (hs - .25));
        }, ["size"]);
        _this.addHook(function (_a) {
            var gradientID = _a.gradientID;
            bg.setAttribute("fill", "url(#" + gradientID + ")");
        }, ["id"]);
        _this.addHook(function (_a) {
            var circle = _a.circle;
            bg.setAttribute("visibility", circle > .5 ? "" : "hidden");
        }, ["circle"]);
        //scale
        var scaleGroup = makeSVGElement("g");
        tickShiftGroup.appendChild(scaleGroup);
        _this.addHook(function (_a) {
            var maskID = _a.maskID;
            scaleGroup.setAttribute("fill", "url(#" + maskID + ")");
        }, ["id"]);
        _this.addHook(function (_a) {
            var steps = _a.steps;
            scaleGroup.setAttribute("visibility", steps ? "" : "hidden");
        }, ["steps"]);
        var scaleOK = makeSVGElement("path");
        scaleOK.classList.add("ui-gauge-meter__scale");
        scaleOK.classList.add("ui-gauge-meter__scale--ok");
        scaleGroup.appendChild(scaleOK);
        _this.addHook(function (_a) {
            var leftScale = _a.leftScale, bottomScale = _a.bottomScale, ir = _a.ir, arcFlag = _a.arcFlag, rightScale = _a.rightScale, thickness = _a.thickness;
            scaleOK.setAttribute("d", "M " + leftScale + " " + bottomScale + " A " + ir + " " + ir + " 0 " + arcFlag + " 1 " + rightScale + " " + bottomScale);
            scaleOK.setAttribute("stroke-width", thickness.toString());
        }, ["size", "thickness", "circle"]);
        var scaleWarning = makeSVGElement("path");
        scaleWarning.classList.add("ui-gauge-meter__scale");
        scaleWarning.classList.add("ui-gauge-meter__scale--warning");
        scaleGroup.appendChild(scaleWarning);
        _this.addHook(function (_a) {
            var leftScale = _a.leftScale, bottomScale = _a.bottomScale, ir = _a.ir, arcFlag = _a.arcFlag, rightScale = _a.rightScale, thickness = _a.thickness, innerCircumference = _a.innerCircumference, steps = _a.steps, min = _a.min, max = _a.max;
            if (!steps || steps.length < 3 || typeof steps[1] !== "number" || typeof steps[2] !== "number") {
                return;
            }
            scaleWarning.setAttribute("d", "M " + leftScale + " " + bottomScale + " A " + ir + " " + ir + " 0 " + arcFlag + " 1 " + rightScale + " " + bottomScale);
            scaleWarning.setAttribute("stroke-width", thickness.toString());
            scaleWarning.setAttribute("stroke-dasharray", innerCircumference * (steps[1] - min) / (max - min) + " " + innerCircumference * (steps[2] - steps[1]) / (max - min) + " " + innerCircumference);
        }, ["size", "thickness", "circle", "steps", "min", "max"]);
        var scaleError = makeSVGElement("path");
        scaleError.classList.add("ui-gauge-meter__scale");
        scaleError.classList.add("ui-gauge-meter__scale--error");
        scaleGroup.appendChild(scaleError);
        _this.addHook(function (_a) {
            var _b;
            var leftScale = _a.leftScale, bottomScale = _a.bottomScale, ir = _a.ir, arcFlag = _a.arcFlag, rightScale = _a.rightScale, thickness = _a.thickness, innerCircumference = _a.innerCircumference, steps = _a.steps, min = _a.min, max = _a.max;
            if (!steps || steps.length < 4 || typeof steps[0] !== "number" && typeof steps[3] !== "number") {
                return;
            }
            scaleError.setAttribute("d", "M " + leftScale + " " + bottomScale + " A " + ir + " " + ir + " 0 " + arcFlag + " 1 " + rightScale + " " + bottomScale);
            scaleError.setAttribute("stroke-width", thickness.toString());
            scaleError.setAttribute("stroke-dasharray", innerCircumference * (steps[0] - min) / (max - min) + " " + innerCircumference * (((_b = steps[3]) !== null && _b !== void 0 ? _b : max) - steps[0]) / (max - min) + " " + innerCircumference);
        }, ["size", "thickness", "circle", "steps", "min", "max"]);
        //ticks
        var ticks = makeSVGElement("path");
        ticks.classList.add("ui-gauge-meter__ticks");
        tickShiftGroup.appendChild(ticks);
        _this.addHook(function (_a) {
            var markerID = _a.markerID;
            ticks.setAttribute("marker-start", "url(#" + markerID + ")");
            ticks.setAttribute("marker-end", "url(#" + markerID + ")");
        }, ["id"]);
        _this.addHook(function (_a) {
            var ht = _a.ht, inset = _a.inset, bottom = _a.bottom, r = _a.r, arcFlag = _a.arcFlag, size = _a.size, thickness = _a.thickness, tickSize = _a.tickSize, dasharray = _a.dasharray;
            ticks.setAttribute("d", "M " + (ht + inset) + " " + bottom + " A " + r + " " + r + " 0 " + arcFlag + " 1 " + (size - ht - inset) + " " + bottom);
            ticks.setAttribute("stroke-width", "" + thickness);
            ticks.setAttribute("stroke-dashoffset", "" + tickSize * .5);
            ticks.setAttribute("stroke-dasharray", "" + dasharray.join(' '));
        }, ["size", "thickness", "ticks", "circle"]);
        //subticks
        var subTicks = makeSVGElement("path");
        subTicks.classList.add("ui-gauge-meter__subticks");
        tickShiftGroup.appendChild(subTicks);
        _this.addHook(function (_a) {
            var ht = _a.ht, tinset = _a.tinset, bottomTicks = _a.bottomTicks, tr = _a.tr, arcFlag = _a.arcFlag, size = _a.size, thickness = _a.thickness, tickSize = _a.tickSize, subDasharray = _a.subDasharray;
            subTicks.setAttribute("d", "M " + (ht + tinset - thickness * .25) + " " + bottomTicks + " A " + tr + " " + tr + " 0 " + arcFlag + " 1 " + (size - ht - tinset + thickness * .25) + " " + bottomTicks);
            subTicks.setAttribute("stroke-width", "" + ht);
            subTicks.setAttribute("stroke-dashoffset", "" + tickSize * .5);
            subTicks.setAttribute("stroke-dasharray", "" + subDasharray.join(' '));
            subTicks.setAttribute("visibility", subDasharray.length ? "" : "hidden");
        }, ["size", "thickness", "ticks", "subTicks", "circle"]);
        //tick labels
        var tickLabels = [];
        var tickLabelGroup = makeSVGElement("g");
        tickShiftGroup.appendChild(tickLabelGroup);
        _this.addHook(function (_a) {
            var ticks = _a.ticks, circle = _a.circle, hs = _a.hs, tlr = _a.tlr, min = _a.min, max = _a.max;
            tickLabels.forEach(function (tl) {
                tl.remove();
            });
            tickLabels.length = 0;
            __spreadArray([], Array(ticks).fill(null).map(function (v, i) { return i; }), true).map(function (i, idx) {
                var a = idx * Math.PI * 2 * circle / (ticks - 1) + Math.PI * .5 + (1 - circle) * Math.PI;
                var x = parseFloat((hs + Math.cos(a) * tlr).toFixed(4));
                var y = parseFloat((hs + Math.sin(a) * tlr).toFixed(4));
                var tl = makeSVGElement("text");
                tl.classList.add("ui-gauge-meter__ticklabel");
                tl.setAttribute("x", "" + x);
                tl.setAttribute("y", "" + y);
                tl.innerHTML = (min + idx * (max - min) / (ticks - 1)).toFixed(1).replace(/[,.]0$/, '');
                tickLabels.push(tl);
                tickLabelGroup.appendChild(tl);
            });
        }, ["ticks", "min", "max", "size", "tlr"]);
        //label
        var label = makeSVGElement("text");
        label.classList.add("ui-gauge-meter__label");
        tickShiftGroup.appendChild(label);
        _this.addHook(function (_a) {
            var lbl = _a.label;
            label.innerHTML = lbl;
        }, ["label"]);
        _this.addHook(function (_a) {
            var size = _a.size, hs = _a.hs, circle = _a.circle;
            label.setAttribute("x", hs);
            label.setAttribute("y", "" + size * Math.min(.4, circle));
        }, ["size", "circle"]);
        //needle
        var needleGroup = makeSVGElement("g");
        needleGroup.classList.add("ui-gauge-meter__needle");
        tickShiftGroup.appendChild(needleGroup);
        _this.addHook(function (_a) {
            var hs = _a.hs, needleRotation = _a.needleRotation;
            needleGroup.setAttribute("style", "transform: rotate(" + needleRotation + "deg); transform-origin: " + hs + "px " + hs + "px;");
        }, ["size", "value", "min", "max", "circle"]);
        var needle = makeSVGElement("path");
        needleGroup.appendChild(needle);
        _this.addHook(function (_a) {
            var hs = _a.hs, needleLength = _a.needleLength;
            needle.setAttribute("d", "m " + (hs - 1.5) + " " + (hs + 6) + ", 1.5 -" + needleLength + ", 1.5 " + needleLength + "z");
        }, ["size", "thickness"]);
        var dot = makeSVGElement("circle");
        dot.setAttribute("r", "4");
        needleGroup.appendChild(dot);
        _this.addHook(function (_a) {
            var hs = _a.hs;
            dot.setAttribute("cx", hs);
            dot.setAttribute("cy", hs);
        }, ["size"]);
        //setup gauge value
        var value = document.createElement("div");
        value.classList.add("ui-gauge-meter__value");
        canvas.appendChild(value);
        _this.addHook(function (_a) {
            var v = _a.value, hideValue = _a.hideValue, formatValue = _a.formatValue;
            if (hideValue) {
                value.style.visibility = "hidden";
            }
            else {
                value.style.visibility = null;
                value.innerHTML = formatValue ? formatValue(v) : v.toString();
            }
        }, ["value"]);
        _this.update();
        element.appendChild(wrapper);
        return _this;
    }
    MeterGauge.prototype.updateData = function (combinedOptions) {
        var value = combinedOptions.value, size = combinedOptions.size, color = combinedOptions.color, id = combinedOptions.id, thickness = combinedOptions.thickness, steps = combinedOptions.steps, tickLabelsInside = combinedOptions.tickLabelsInside, circle = combinedOptions.circle, min = combinedOptions.min, max = combinedOptions.max, ticks = combinedOptions.ticks, subTicks = combinedOptions.subTicks, tickLabelOffset = combinedOptions.tickLabelOffset;
        var sizeScale = size / 100;
        //precalculate various values
        var r = (size - thickness) * .5;
        var tr = r + thickness * .25;
        var ir = r - thickness - 2;
        var tlr = r + (tickLabelOffset || ((tickLabelsInside ? -10 : 5) * sizeScale));
        var circumference = 2 * Math.PI * r * circle;
        var tickCircumference = 2 * Math.PI * tr * circle;
        var innerCircumference = 2 * Math.PI * ir * circle;
        var ht = thickness * .5;
        var hs = size * .5;
        var sin = (1 - Math.sin(Math.PI * circle));
        var inset = sin * r;
        var iinset = sin * ir;
        var tinset = sin * tr;
        var tickSize = 1;
        var subTickSize = .5;
        var needleLength = hs + thickness;
        var needleRotation = 360 * circle * (value - min) / (max - min) - 180 * circle;
        var dasharray = [tickSize, circumference / (ticks - 1) - tickSize];
        var subDasharray = [];
        if (subTicks > 0) {
            var tickSegment = ((tickCircumference / (ticks - 1) - tickSize) - subTicks * subTickSize) / (subTicks + 1);
            subDasharray = [0, tickSize + tickSegment];
            for (var i = 0; i < subTicks; i++) {
                subDasharray.push(subTickSize, tickSegment);
            }
        }
        var maskID = "mask-" + id;
        var markerID = "end-" + id;
        var gradientID = "gradient-" + id;
        var height = Math.sqrt(r * r - Math.pow(r - inset, 2));
        var bottom = (circle >= .5 ? r + height : r - height) + thickness * .5;
        var leftScale = ht + thickness + 2 + iinset;
        var rightScale = size - ht - thickness - 2 - iinset;
        var scaleHeight = Math.sqrt(ir * ir - Math.pow(ir - iinset, 2));
        var bottomScale = (circle >= .5 ? ir + scaleHeight : ir - scaleHeight) + thickness + thickness * .5 + 2;
        var ticksHeight = Math.sqrt(tr * tr - Math.pow(tr - tinset, 2));
        var bottomTicks = (circle >= .5 ? tr + ticksHeight : tr - ticksHeight) + thickness * .25;
        var arcFlag = circle >= .5 ? 1 : 0;
        return __assign(__assign({}, combinedOptions), { r: r, tr: tr, ir: ir, tlr: tlr, circumference: circumference, tickCircumference: tickCircumference, innerCircumference: innerCircumference, hs: hs, ht: ht, inset: inset, iinset: iinset, tinset: tinset, tickSize: tickSize, subTickSize: subTickSize, needleLength: needleLength, needleRotation: needleRotation, dasharray: dasharray, subDasharray: subDasharray, bottom: bottom, leftScale: leftScale, rightScale: rightScale, bottomScale: bottomScale, ticksHeight: ticksHeight, bottomTicks: bottomTicks, arcFlag: arcFlag, maskID: maskID, markerID: markerID, gradientID: gradientID, sizeScale: sizeScale, color: color || getColor(value, steps) });
    };
    return MeterGauge;
}(AbstractGauge));

var defaultOptions = {
    ticks: 11,
    subTicks: 3,
    circle: .75,
    tickLabelsInside: true
};
var SpeedometerGauge = /** @class */ (function (_super) {
    __extends(SpeedometerGauge, _super);
    function SpeedometerGauge(element, options) {
        var _this = _super.call(this, element, __assign(__assign({}, defaultOptions), options)) || this;
        _this.wrapper.classList.add("ui-gauge-meter--speed");
        return _this;
    }
    return SpeedometerGauge;
}(MeterGauge));

export { ArcGauge, MeterGauge, RingGauge, SpeedometerGauge };
