/**
 * Created by reto on 31.12.2013.
 */

var canvas = null;
var overlayCanvas = null;

var tempCanvas = null;  // tempCanvas is set in function usingCanvas
var tempOverlayCanvas = null;

/**
 * Replaces the canvas for the execution of this function
 *
 * @param canvas
 * @param callback
 */
function usingCanvas(canvas, callback) {
    tempCanvas = canvas;
    callback();
    tempCanvas = null;
}

function usingOverlayCanvas(canvas, callback) {
    tempOverlayCanvas = canvas;
    callback();
    tempOverlayCanvas = null;
}

var canvasElements = [];

function clearCanvasElements() {
    canvasElements = [];
}

function getCanvasIdForPage(pageNr) {
    return "canvas-page-" + pageNr;
}

function getCanvasForPage(pageNr) {
    return $('#' + getCanvasIdForPage(pageNr));
}

function newCanvas(pageNr) {
    setCanvas(pageNr, $('<canvas></canvas>'));
    initCanvasSize(getCanvasDim());
    clearCanvas('#fff');
}

function setCanvas(pageNr, newCanvas) {
    if (newCanvas || !getCanvasForPage(pageNr)[0]) {
        canvas = newCanvas || $('<canvas></canvas>');
        canvas.attr('id', getCanvasIdForPage(pageNr));
        //canvas.attr('title', 'This is the canvas for page ' + pageNr + ' the PanelPainter is painting on');
        canvas.css({
            display: 'none',
            zIndex: OPTIONS.Z_INDEX.Painter.canvas
        });
        $('#image').append(canvas);
        canvasElements.push(canvas);
    } else {
        canvas = getCanvasForPage(pageNr);
    }
}

function getCanvas() {
    if (!canvas || canvas.length === 0) {
        throw "no canvas defined";
    }
    return tempCanvas ? tempCanvas : canvas[0];  // tempCanvas is set in function usingCanvas
}

function getCtx() {
    // TODO https://www.html5rocks.com/en/tutorials/canvas/imagefilters/
    var ctx = getCanvas().getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    return ctx;
}

function getOverlayCanvas() {
    if (!overlayCanvas) {
        overlayCanvas = $('<canvas></canvas>');
    }
    return tempOverlayCanvas ? tempOverlayCanvas : overlayCanvas[0];
}

function getOverlayCtx() {
    return getOverlayCanvas().getContext('2d');
}

/**
 *  fillStyle: if not set the canvas will be transparent
 */
function clearCanvas(fillStyle, canvas) {
    canvas || (canvas = getCanvas());
    if (fillStyle) {
        getCtx().fillStyle = fillStyle;
        getCtx().fillRect(0, 0, canvas.width, canvas.height);
    } else {
        var w = canvas.width;
        canvas.width = 0;
        canvas.width = w;
    }
}

function getCanvasDim() {
    var options = OPTIONS.PAGE;
    return {
        w: options.scale * (options.pageWidth + 2 * options.pagePadding.x),
        h: options.scale * (options.pageHeight + 2 * options.pagePadding.y)
    }
}

function initCanvasSize(canvasDim) {
    $(getCanvas()).attr("width", canvasDim.w);
    $(getCanvas()).attr("height", canvasDim.h);
    $(getOverlayCanvas()).attr("width", $(getCanvas()).attr("width"));
    $(getOverlayCanvas()).attr("height", $(getCanvas()).attr("height"));
}

/**
 * @deprecated: no Base64, bad performance
 */
function paintCanvasToImage(imgId) {
    var imgElem = $('#' + imgId);
    if (!imgElem[0]) {
        imgElem = $('<img />');
        imgElem.attr('id', imgId);
        imgElem.appendTo('#image');
        $('#image').append("<br/>");
    }
    var img = getCanvas().toDataURL("image/png");
    imgElem.attr('src', img);
    imgElem.css({
        zIndex: OPTIONS.Z_INDEX.Painter.image
    })
}

/**
 * puts the canvas directly into the page, no Base64 encoding
 */
function displayCanvas(canvasId) {
    canvas.css({
        display: 'inline'
    });
}


function paintOverlay() {
    var overlay = getOverlayCanvas();
    getCtx().drawImage(
        overlay,
        0,
        0,
        overlay.width,
        overlay.height
    );
}


function drawImageYellowIf(img, dim, isYellow, ctx) {
    ctx || (ctx = getCtx());

    if (isYellow) {

        var tmpCtx = getOverlayCtx(),
            canvasDimBakup = {
                w: tmpCtx.canvas.width,
                h: tmpCtx.canvas.height
            };

        tmpCtx.canvas.width = dim.w;
        tmpCtx.canvas.height = dim.h;

        tmpCtx.drawImage(img, 0, 0, dim.w, dim.h);

        var imageData = tmpCtx.getImageData(0, 0, dim.w, dim.h);

        tmpCtx.putImageData(yellowfy(imageData), 0, 0);

        ctx.drawImage(
            tmpCtx.canvas,
            dim.x,
            dim.y,
            dim.w,
            dim.h
        );

        tmpCtx.canvas.width = canvasDimBakup.w;
        tmpCtx.canvas.height = canvasDimBakup.h;

    } else {
        ctx.drawImage(
            img,
            dim.x,
            dim.y,
            dim.w,
            dim.h
        );
    }

    function yellowfy(imageData) {
        var r, g, b,
            brightness,
            isYellow,
            data = imageData.data;

        for (var i = 0; i < data.length; i += 4) {
            r = i;
            g = i + 1;
            b = i + 2;
            brightness = data[r] + data[g] + data[b];

            isYellow = brightness < 192;  // 3 * 64

            data[r] = 255;
            data[g] = 255;
            if (isYellow) {
                data[b] = 0; // darker -> yellow,
            }
            else {
                data[b] = 255; // lighter -> white
            }
        }
        return imageData;
    }
}

/**
 * Calls the specified callback with the specified object where the specified property value is replaced by the specified value.
 *
 * example:
 *
 *      var obj = {x: 99};
 *      injecting(obj, "x", 100, function(obj) {
 *          alert(obj.x);
 *      });
 *
 *      will alert "100".
 *
 * @param object
 * @param property
 * @param replaceValue
 * @param callback
 */
function injecting(object, property, replaceValue, callback) {
    var orig = object[property];
    object[property] = replaceValue;
    callback(object);
    object[property] = orig;
}

/**
 * Converts a pos object into the corresponding dim object
 *
 * @param pos: {x:num, y:num, size:num}
 * @param dim {x:num, y:num, w:num, h:num}
 */
function pos2dim(pos) {
    if (udef(pos.size) && !udef(pos.w)) {
        return pos
    }
    return {
        x: pos.x,
        y: pos.y,
        w: pos.size,
        h: pos.size
    };
}

/**
 * Returns the specified number if it is defined and not NaN.
 * Otherwise returns 0 or the specified neutreal element.
 *
 * @param number
 * @returns {number}
 */
function n0(number, ne) {
    return (typeof number === 'undefined' || isNaN(number)) ? (ne ? ne : 0 ) : number;
}

function udef(x) {
    return typeof x === 'undefined';
}

/**
 * Shorthand for Math.round(x)
 */
function r(x) {
    return Math.round(x);
}

function line(from, to, strokeStyle, ctx) {
    ctx || (ctx = getCtx());
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.save();
    ctx.strokeStyle = strokeStyle ? strokeStyle : ctx.strokeStyle;
    ctx.stroke();
    ctx.restore();
}

/**
 * Rounds all values and draws a rectangle.
 * If strokeStyle is set, the border is drawn with it.
 * If fillStyle is set, the inside is filled with it.
 */
function rect(x, y, w, h, strokeStyle, fillStyle, ctx) {
    ctx || (ctx = getCtx());
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    ctx.restore();
}

function rectFromDim(dim, strokeStyle, fillStyle, ctx) {
    rect(dim.x, dim.y, dim.w, dim.h, strokeStyle, fillStyle, ctx);
}

/**
 * Draws a rounded rectangle using the current state of the canvas.
 * If you omit the last three params, it will paint a rectangle
 * outline with a 5 pixel border radius
 * @param {Number} x The top left x coordinate
 * @param {Number} y The top left y coordinate
 * @param {Number} w The width of the rectangle
 * @param {Number} h The height of the rectangle
 * @param {Number} radius The corner radius. Defaults to 5;
 * @param {Boolean} fillStyle decides whether to fill the rectangle, too
 * @param {Boolean} strokeStyle decides whether to stroke the rectangle, too
 */
function roundRect(x, y, w, h, radiusX, radiusY, strokeStyle, fillStyle, ctx) {
    ctx || (ctx = getCtx());
    if (typeof radius === "undefined") {
        radius = 5;
    }
    ctx.beginPath();
    ctx.moveTo(x + radiusX, y);
    ctx.lineTo(x + w - radiusX, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radiusY);
    ctx.lineTo(x + w, y + h - radiusY);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radiusX, y + h);
    ctx.lineTo(x + radiusX, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radiusY);
    ctx.lineTo(x, y + radiusY);
    ctx.quadraticCurveTo(x, y, x + radiusX, y);
    ctx.closePath();
    ctx.save();
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    ctx.restore();
}

function circle(x, y, r, strokeStyle, fillStyle, ctx) {
    ctx || (ctx = getCtx());
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.stroke();
    }
    if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
    }
    ctx.restore();
}

/**
 * Fits the size of an image such that it covers the specified dim completely and keeps its proportions.
 *
 * @param img
 * @param dim
 * @returns {{w: number, h: number}}
 */
function getImageDimensions(img, dim) {
    if (!img) {
        return dim
    }

    var proportionDim = dim.w / dim.h;
    var proportionImg = img.width / img.height;
    var imgScale = 1;
    if (proportionImg > proportionDim) { // i.e. bgr is wider than panel
        imgScale = dim.h / img.height;
    } else {
        imgScale = dim.w / img.width;
    }
    return {
        x: dim.x,
        y: dim.y,
        w: img.width * imgScale,
        h: img.height * imgScale
    };
}

function getCenter(dim) {
    return {
        x: dim.x + dim.w / 2,
        y: dim.y + dim.h / 2
    };
}

/**
 * Returns the vector that leads from the center of dimStart to the center of dimEnd
 *
 * @param dimEnd
 * @param dimStart
 * @returns {{x: number, y: number}}
 */
function getCenterDistance(dimEnd, dimStart) {
    var end = getCenter(dimEnd);
    var start = getCenter(dimStart);
    return {
        x: end.x - start.x,
        y: end.y - start.y
    }
}

/**
 * Same as getCenterDistance, but ignores width and height, just calculates the difference between x and y coordinates
 *
 * @param dimEnd
 * @param dimStart
 */
function getDistance(dimEnd, dimStart) {
    return {
        x: dimEnd.x - dimStart.x,
        y: dimEnd.y - dimStart.y
    }
}

/**
 * Aligns dimToAlign centered to dimRef,
 * i.e. dimToAlign.x and dimToAlign.y are calculated according to dimRef.
 *
 * @param dim1
 * @param dim2
 */
function alignCentered(dimToAlign, dimRef) {
    var padding = {
        w: (dimToAlign.w - dimRef.w) / 2,
        h: (dimToAlign.h - dimRef.h) / 2
    };
    dimToAlign.x = dimRef.x - padding.w;
    dimToAlign.y = dimRef.y - padding.h;
};

/**
 * Generates a regexp string of OR options from the specified array
 */
function array2ORRegExp(values, prefix, wrapInParenthesis) {
    prefix = prefix || '';
    var result = "";
    var operator = "";
    $.each(values, function (i, value) {
        result += operator + prefix + value;
        operator = "|";
    });
    return wrapInParenthesis ? "(" + result + ")" : result;
}
