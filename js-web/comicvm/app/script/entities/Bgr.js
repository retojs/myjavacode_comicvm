/**
 * Created by reto on 01.08.2014.
 */

var Bgr = function (qualifier) {

    this.qualifier = qualifier;

    this.layoutGet = {
        reverse: function () {
            return getLayoutProperty(qualifier, 'reverse');
        },
        characterPosition: function () {
            return getLayoutProperty(qualifier, 'characterPosition');
        },
        characterQualifier: function () {
            return getLayoutProperty(qualifier, 'characterQualifier');
        },
        zoom: function () {
            return getLayoutProperty(qualifier, 'zoom');
        },
        pan: function () {
            return getLayoutProperty(qualifier, 'pan');
        }
    };

    function getLayoutProperty(bgrQualifier, propertyName) {
        return LayoutParser.getBackgroundProperty(bgrQualifier, propertyName);
    }

    this.panels = {
        all: [],
        smallestCharacter: {
            panel: null,
            widthPerCharacter: 0
        },

        bbox: null,
        bboxPanelDim: {}
    };

    this.defaults = {
        characterWidth: 0,
        characterPos: {
            x: 0,
            y: 0
        },
        bgrDim: {
            w: 0,
            h: 0
        }
    };
};

/**
 * Defaults:
 *  - by default the characters' positions are identical in all panels.
 *  - by default all characters have the same size in all panels of the same background.
 *  - by default in each frame all acting characters are visible.
 *  - therefore the default character size is defined by the panels' sizes and the space needed for all acting characters in a frame.
 *
 * The default character size is calculated as follows:
 *  - put all characters to their default positions:
 *      on a line with gaps as wide as a character (in the order specified in the plot after the keyword 'Characters:')
 *  - for each panel of the same background:
 *      - take those characters who are acting in the current panel (and all the characters inbetween, not changing the character positions).
 *      - and fit this part of the character group into the panel such that the distance to the panel frame is exactly one character width.
 *  -> the default (ideal) character size is the smallest of all panels,
 *     since this size fulfills all the requirements defined by the default rules above.
 *
 * This method returns the panel with the least space per visible character (distributed horizontally by default)
 *
 * @param scene
 * @returns {panel: Panel, widthPerCharacter: number}
 */
Bgr.prototype.getSmallestCharacterPanel = function (scene) {
    if (!this.panels.smallestCharacter.panel) {
        var smallest = {
            panel: null,
            widthPerCharacter: Infinity
        };
        $.each(this.panels.all, function (i, panel) {
            var characters = PlotParser.getCharacterNamesSlice(panel.getActingCharacterNames());
            if (panel.getActingCharacterNames().length === 0) {
                characters = PlotParser.getCharacterNames();
            }
            var widthPerCharacter = panel.dim.w / (2 * characters.length + 1); // allocate space for gaps between characters, too
            if (smallest === null || (smallest.widthPerCharacter > widthPerCharacter)) {
                smallest = {
                    panel: panel,
                    widthPerCharacter: widthPerCharacter
                };
            }
        });
        if (smallest.widthPerCharacter == Infinity) {
            smallest.widthPerCharacter = 42;
        }
        this.panels.smallestCharacter = smallest;
    }
    return this.panels.smallestCharacter;
};

// class properties and methods

Bgr.images = {};

Bgr.resetImages = function () {
    Bgr.images = {};
};

Bgr.getBgrImageTags = function (bgrQualifier) {
    return PlotParser.getPlace().split('.').concat(bgrQualifier.split('.')).concat([tagStore.TYPE_BACKGROUND]);
};

Bgr.getBgrImage = function (bgrQualifier) {
    Bgr.images || (Bgr.resetImages());

    var key = PlotParser.getPlace() + '.' + bgrQualifier;

    if (!Bgr.images[key]) {
        var searchTags = this.getBgrImageTags(bgrQualifier);
        Bgr.images[key] = tagStore.getBestMatch(searchTags);
    }
    return Bgr.images[key];
};

/**
 * Returns the dimensions of this background image when fitted to the bounding box of all panels with this background.
 *
 * Idea: The panel must be completely contained inside the background image.
 *       So if the proportion of the background image is _wider_ than the proportion of the panel: fit their _heights_ and the background width will be larger than the panel width.
 *       otherwise: fit their _width_
 *
 * @param panel: the panel that needs to be covered by the background
 * @returns {w: number, h: number, area: function}
 */
Bgr.prototype.getBgrDimensions = function (dim) {
    var img = Bgr.getBgrImage(this.qualifier === 'DEFAULT' ? '' : this.qualifier),
        bgrDim = getImageDimensions(img, dim);

    return {
        w: bgrDim.w,
        h: bgrDim.h,
        area: function () {
            return this.w * this.h
        }
    };
};

/**
 * Calculates the bounding box of all panels that use this background
 * to determine the background image size and position for each panel.
 *
 * *note:* images have to be loaded for this to work.
 *
 * @param scene
 */
Bgr.prototype.fitBackground = function (scene) {

    // 1. calculate bgr.defaults.characterWidth. We need this value to calculate characters bounding box.
    var smallest = this.getSmallestCharacterPanel(scene);
    this.defaults.characterWidth = smallest.widthPerCharacter;

    // 2.a calculate bounding box of all panels relative to the characters' bounding box
    var boundingBox = this.getPanelsBBox();

    // 2.b the bounding box is the area the background image needs to cover completely, so we can derive size and position of the background from it.
    this.defaults.bgrDim = this.getBgrDimensions({
        w: boundingBox.w,
        h: boundingBox.h
    });
    alignCentered(this.defaults.bgrDim, boundingBox);
    this.defaults.characterPos = {
        x: this.defaults.bgrDim.x,
        y: this.defaults.bgrDim.y
    }
};

/**
 * Calculates bounding box of all panels of a background relative to the characters' bounding box
 *
 * @param bgr
 * @returns {{x: number, y: number, w: number, h: number}}
 */
Bgr.prototype.getPanelsBBox = function () {

    var boundingBox = {};
    this.panels.bboxPanelDim = {};

    var self = this;
    $.each(this.panels.all, function (i, panel) {

        var charactersBBox = panel.getCharactersBackgroundBBox(),
            panelDim = {
                x: (panel.dim.x - charactersBBox.x) / panel.getZoom(), // normalize to default zoom
                y: (panel.dim.y - charactersBBox.y) / panel.getZoom(),
                w: panel.dim.w / panel.getZoom(),
                h: panel.dim.h / panel.getZoom()
            };

        self.panels.bboxPanelDim[panel.id] = panelDim;

        boundingBox = {
            x1: !boundingBox.x1 || boundingBox.x1 > panelDim.x ? panelDim.x : boundingBox.x1,
            y1: !boundingBox.y1 || boundingBox.y1 > panelDim.y ? panelDim.y : boundingBox.y1,
            x2: !boundingBox.x2 || boundingBox.x2 < panelDim.x + panelDim.w ? panelDim.x + panelDim.w : boundingBox.x2,
            y2: !boundingBox.y2 || boundingBox.y2 < panelDim.y + panelDim.h ? panelDim.y + panelDim.h : boundingBox.y2
        }
    });
    this.panels.bbox = {
        x: boundingBox.x1,
        y: boundingBox.y1,
        w: boundingBox.x2 - boundingBox.x1,
        h: boundingBox.y2 - boundingBox.y1
    };
    return this.panels.bbox;
};

