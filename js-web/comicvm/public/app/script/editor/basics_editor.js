/**
 * Returns the offset of the #image div.
 * css absolute positions are relative to this div.
 *
 * @param panel
 * @returns {{x: number, y: number}}
 */
function getImageDivOffset(offset) {
    var imageDiv = $('#image');

    return {
        x: imageDiv.offset().left + (offset ? offset.x : 0),
        y: imageDiv.offset().top + (offset ? offset.y : 0)
    };
}

/**
 * Returns the offset of the specified page relative to the #image div
 *
 * @param pageNr starting with 0 like panel.pageNr
 * @returns {{x: number, y: number}}
 */
function getStoryPageOffset(pageNr) {
    pageNr || (pageNr = 0);

    var storyPageOffset = { // css position (relative to #image) of the canvas' coordinate origin
        x: 24,
        y: 0 + r(pageNr * (getCanvasDim().h + 7))
    };

    return storyPageOffset;
}

function getImageDivDim(paintBackground) {
    var imgDiv = $('#image');
    return {
        w: imgDiv.width(),
        h: (paintBackground ? 1 : LayoutParser.getPageCount()) * (getCanvasDim().h + 7)
    };
}

function addOffset(dim, offset) {
    return {
        x: dim.x + (offset && offset.x ? offset.x : 0),
        y: dim.y + (offset && offset.y ? offset.y : 0),
        w: dim.w + (offset && offset.w ? offset.w : 0),
        h: dim.h + (offset && offset.h ? offset.h : 0)
    }
}

function subtractOffset(dim, offset) {
    return {
        x: dim.x - (offset && offset.x ? offset.x : 0),
        y: dim.y - (offset && offset.y ? offset.y : 0),
        w: dim.w,
        h: dim.h
    }
}

function grow(dim, delta) {
    return {
        x: dim.x - delta,
        y: dim.y - delta,
        w: dim.w + 2 * delta,
        h: dim.h + 2 * delta
    };
}

/**
 * Returns the *outer* distances between the edges of the specified dim to the edges of the container dim.
 * If the specified dim is completely overlapping the containerDim, left and top are negative numbers and right and bottom are positive numbers
 *
 * @param dim
 * @param containerDim
 * @returns {{left: number, right: number, top: number, bottom: number}}
 */
function getExtrusion(dim, containerDim) {
    return {
        left: dim.x - containerDim.x,
        right: (dim.x + dim.w) - (containerDim.x + containerDim.w),
        top: dim.y - containerDim.y,
        bottom: (dim.y + dim.h) - (containerDim.y + containerDim.h)
    }
}

function isIncluded(dim, containerDim) {
    return isIncludedX(dim, containerDim)
        && isIncludedY(dim, containerDim);
}

function isIncludedX(dim, containerDim) {
    return dim.x > containerDim.x
        && dim.x + dim.w < containerDim.x + containerDim.w
}

function isIncludedY(dim, containerDim) {
    return dim.y > containerDim.y
        && dim.y + dim.h < containerDim.y + containerDim.h;
}

function doesOverlap(dim1, dim2) {
    var top1 = dim1.y,
        top2 = dim2.y,
        bottom1 = dim1.y + dim1.h,
        bottom2 = dim2.y + dim2.h,
        left1 = dim1.x,
        left2 = dim2.x,
        right1 = dim1.x + dim1.w,
        right2 = dim2.x + dim2.w;

    function bothGt(a, b, reference) {
        return a > reference && b > reference
    }

    function bothLt(a, b, reference) {
        return a < reference && b < reference
    }

    function bothBeyond(a, b, reference) {
        return bothGt(a, b, reference) || bothLt(a, b, reference);
    }

    // assumtion: two squares are NOT overlapping, ONLY
    // IF both ends in each dimension of one square
    // are both greater or smaller than both ends in each dimension
    // of the other square. OTHERWISE they are overlapping.

    if (bothLt(top1, bottom1, top2) || bothGt(bottom1, top1, bottom2)
        || bothLt(left1, right1, left2) || bothGt(left1, right1, right2)) {
        return false;
    } else {
        return true;
    }
}


function panelPos2MousePos(panelPos, pageNr) {
    if (typeof pageNr === 'undefined') {
        throw "pageNr missing";
    }
    var offsetImgDiv = getImageDivOffset();
    var offsetPage = getStoryPageOffset(pageNr);
    return addOffset(addOffset(panelPos, offsetImgDiv), offsetPage);
}

function mousePos2CssPos(pageX, pageY) {
    var offset = getImageDivOffset(); // css position is relative to first parent with non-static position, i.e. the #image div
    return subtractOffset({x: pageX, y: pageY}, offset);
}

function panelPos2CssPos(pos, pageNr) {
    if (typeof pageNr === 'undefined') {
        throw "pageNr missing";
    }

    return dim2css(addOffset(pos2dim(pos), offset));
}

function dim2css(dim) {
    return {
        left: dim.x,
        top: dim.y,
        width: dim.w,
        height: dim.h
    };
}
/**
 * Transforms a CSS position (position:absolute relative to the #image div) into panel coordinates
 *
 * @param panel
 * @param cssPos {{left: number, top: number}}
 * @returns {{x: number, y: number}}
 */
function cssDim2PanelDim(cssPos, pageNr) {
    if (typeof pageNr === 'undefined') {
        throw "pageNr missing";
    }
    var offsetPage = getStoryPageOffset(pageNr);
    return {
        x: cssPos.left - offsetPage.x,
        y: cssPos.top - offsetPage.y,
        w: cssPos.width,
        h: cssPos.height
    };
}

function css2dim(elem) {
    var pos = parseCssPosition(elem);
    return {
        x: pos.left,
        y: pos.top,
        w: pos.width,
        h: pos.height
    };
}

/**
 * parses string values "npx" into numbers n for properties left, top, width and height
 *
 * @param elem
 * @returns {{left: Number, top: Number, width: Number, height: Number}}
 */
function parseCssPosition(elem) {
    return {
        left: parseFloat($(elem).css("left").replace("px", "")),
        top: parseFloat($(elem).css("top").replace("px", "")),
        width: $(elem).width(),
        height: $(elem).height()
    };
}

function setCssPosition(elem, cssDim, pageNr) {
    if (!udef(cssDim.x) && udef(cssDim.left)) {
        cssDim = panelPos2CssPos(cssDim, pageNr);
    }
    $(elem).css({
        position: "absolute",
        left: cssDim.left,
        top: cssDim.top,
        width: cssDim.width,
        height: cssDim.height
    });
}

function elemDim2PanelDim(elem, pageNr, borderWidth) {
    borderWidth || (borderWidth = 0);
    var cssPos = parseCssPosition(elem);
    cssPos.width += 2 * borderWidth;
    cssPos.height += 2 * borderWidth;
    return cssDim2PanelDim(cssPos, pageNr);
}

/**
 * Transforms the specified panel dimensions into CSS position properties and applies them on the specified DOM element
 *
 * @param panel
 * @param dim {{x: number, y:number, w: number, h: number}}
 * @returns {css string}
 */
function setPanelPositionCss(elem, dim, pageNr) {
    var offset = getStoryPageOffset(pageNr);
    dim || (dim = {x: 0, y: 0, w: 0, h: 0});
    var css = {
        position: "absolute",
        left: r(offset.x + dim.x),
        top: r(offset.y + dim.y),
        width: r(dim.w),
        height: r(dim.h)
    };
    if (css.width > 800) {
        //console.log("element too large " + JSON.stringify(dim));
    } else {
        $(elem).css(css);
    }
}

function cssTranslateToDim(elem, dim) {
    var pos = css2dim(elem);
    var scale = { // check out what happens if you exchange the code! :)
        x: dim.w / pos.w,
        //x: pos.w / dim.w,
        y: dim.h / pos.h
        //y: pos.h / dim.h
    };

    var translateCss = " translate(" + (dim.x - pos.x) + "px, " + (dim.y - pos.y) + "px) ",
        scaleCss = " scale(" + scale.x + ", " + scale.y + ") ";

    $(elem).css("transform", translateCss + scaleCss);
}

function cssTranslate(e, dx, dy) {
    $(e).css("transform", " translate(" + dx + "px, " + dy + "px)");
}

function setAttrWidthHeight($e, dim) {
    $e.attr('width', dim.w);
    $e.attr('height', dim.h);
}

function hasSize(e) {
    return (e.w && e.h) || e.size;
}