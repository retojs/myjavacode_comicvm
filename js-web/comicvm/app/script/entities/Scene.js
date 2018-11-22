/**
 * A scene contains a plot and a layout.
 * Scene.setup() parses the plot and layouts it as specified in the layout
 * Scene.paint() paints the layouted planels
 */

var Scene = function (plot, layoutJson) {
    this.change(plot, layoutJson);
};

/**
 * Just sets the specified plot and layout.json and initializes scene.backgrounds
 *
 * @param plot
 * @param layoutJson
 * @returns {Scene}
 */
Scene.prototype.change = function (plot, layoutJson) {

    this.ID = new Date();  // $watch this ID

    this.plot = plot ? plot : this.plot;
    this.layoutJson = layoutJson ? layoutJson : this.layoutJson;

    this.backgrounds = undefined;  // initialized in getBackgrounds()
    this.backgroundQualifiers = undefined;

    this.layoutGet = {
        characterQualifier: function () {
            return getLayoutProperty('characterQualifier');
        },
        characterPosition: function () {
            return getLayoutProperty('characterPosition');
        },
        zoom: function () {
            return getLayoutProperty('zoom');
        },
        pan: function () {
            return getLayoutProperty('pan');
        }
    };

    function getLayoutProperty(propertyName) {
        return LayoutParser.getSceneProperty(propertyName);
    }

    return this;
};

/**
 * Parses plot and layout, creates the panels and the background objects.
 */
Scene.prototype.setup = function () {
    this.setupSource();
    this.setupPanels();
    this.setupBackgrounds();
};

/**
 * parses plot and layout.
 */
Scene.prototype.setupSource = function () {
    PlotParser.parse(this.plot);
    LayoutParser.parse(this.layoutJson);
};

/**
 * Distribute the plot items across the panels on the pages
 */
Scene.prototype.setupPanels = function () {
    LayoutParser.createPanels(this);
    LayoutParser.distributePlotItemsIntoPanels(PlotParser.parsed.plotItems);
};

/**
 * applies a new layout to an unchanged plot
 *
 * @param layoutJson
 */
Scene.prototype.setupNewLayout = function (layoutJson) {
    LayoutParser.parse(layoutJson);
    this.setupPanels();
    this.setupBackgrounds();
    this.fitBackgrounds();
};

Scene.prototype.getPanelIds = function () {
    return _.map(LayoutParser.panels, 'id');
};

Scene.prototype.setupBackgroundQualifiers = function () {
    var backgroundQualifiers = this.backgroundQualifiers = [];

    _.each(LayoutParser.panels, function (panel) {
        var qualifier = panel.layoutGet.bgrQualifier() ? panel.layoutGet.bgrQualifier() : OPTIONS.PAINTER.qualifier.DEFAULT_BGR;
        if (backgroundQualifiers.indexOf(qualifier) < 0) {
            backgroundQualifiers.push(qualifier);
        }
    });
};

Scene.prototype.getBackgroundQualifiers = function () {
    this.backgroundQualifiers || this.setupBackgroundQualifiers();
    return this.backgroundQualifiers;
};

Scene.prototype.setupBackgrounds = function () {
    var backgrounds = this.backgrounds = {};

    _.each(LayoutParser.panels, function (panel) {
        var qualifier = panel.layoutGet.bgrQualifier() ? panel.layoutGet.bgrQualifier() : OPTIONS.PAINTER.qualifier.DEFAULT_BGR;
        var bgr = backgrounds[qualifier];
        if (!bgr) {
            bgr = new Bgr(qualifier);
            backgrounds[qualifier] = bgr;
        }
        panel.bgr = bgr;
        bgr.panels.all.push(panel);
    });
};

/**
 * Returns a Bgr object for each backgrounds used in this scene,
 * i.e. an object with the image source paths as property keys and Bgr objects as values
 *
 * Note: the empty qualifier is converted to OPTIONS.PAINTER.qualifier.DEFAULT_BGR
 */
Scene.prototype.getBackgrounds = function () {
    this.backgrounds || this.setupBackgrounds();
    return this.backgrounds;
};

Scene.prototype.getBackground = function (qualifier) {
    var backgrounds = this.getBackgrounds();
    return backgrounds[(qualifier === '') ? OPTIONS.PAINTER.qualifier.DEFAULT_BGR : qualifier];
};

Scene.prototype.fitBackgrounds = function () {
    var self = this;
    var backgrounds = this.getBackgrounds();
    for (var qualifier in backgrounds) {
        backgrounds[qualifier].fitBackground(self);
    }
};

Scene.prototype.hide = function () {
    $('#image').html('');
    clearCanvasElements();
};

Scene.prototype.paint = function () {

    this.hide();

    comicVM.PanelPainter.beforePaintScene(this);

    for (var pageNr = 0; pageNr < LayoutParser.getPageCount(); pageNr++) {

        newCanvas(pageNr);
        getCtx().save();

        if (false) { // draw page border
            getCtx().setLineDash([1, 2]);

            rect(0, 0,
                OPTIONS.PAGE.pageWidth + OPTIONS.PAGE.pagePadding.x * 2,
                OPTIONS.PAGE.pageHeight + OPTIONS.PAGE.pagePadding.y * 2,
                '#bbb', null, getCtx());

            getCtx().restore();
        }

        for (var i = 0; i < LayoutParser.pagePanels[pageNr].length; i++) {
            comicVM.PanelPainter.paint(LayoutParser.pagePanels[pageNr][i]);
        }

        clearCanvas(null, getOverlayCanvas());
        paintOverlay();

        getCtx().restore();

        // paint page number if there is more than one (currently disabled)
        if (false && LayoutParser.getPageCount() > 1) {
            m = getCtx().measureText("" + (pageNr + 1));
            getCtx().fillStyle = OPTIONS.PAGE.colorPageNr;
            getCtx().fillText(
                "" + (pageNr + 1),
                OPTIONS.PAGE.pagePadding.x + OPTIONS.PAGE.pageWidth - m.width - OPTIONS.PAGE.panelPadding.x,
                OPTIONS.PAGE.pagePadding.y + OPTIONS.PAGE.pageHeight + 10);
        }

        displayCanvas();
    }
};

Scene.prototype.repaintSinglePage = function (pageNr) {
    log('repainting page ' + pageNr); // TODO unit test

    var panelIds = LayoutParser.getPagePanelIds(pageNr);

    setCanvas(pageNr);
    clearCanvas("#fff");

    this.repaintPanels(panelIds);
};

Scene.prototype.repaintSingleStrip = function (pageNr, stripNr) {
    log('repainting strip page ' + pageNr + ', strip ' + stripNr); // TODO unit test

    var panelIds = LayoutParser.getStripPanelIds(pageNr, stripNr);

    setCanvas(pageNr);

    var panelDim = LayoutParser.panels[panelIds[0]].dim,
        canvasDim = getCanvasDim();

    var stripDim = {
        x: 0,
        y: panelDim.y - comicVM.PanelPainter.options.style.lineWidth,
        w: canvasDim.w,
        h: panelDim.h + comicVM.PanelPainter.options.style.lineWidth * 2
    };
    rectFromDim(stripDim, "#fff", "#fff");

    this.repaintPanels(panelIds);
};

Scene.prototype.repaintSinglePanel = function (panel) {
    log('repainting panel ' + panel.id); // TODO unit test

    setCanvas(panel.pageNr);

    rectFromDim(panel.dim, "#fff", "#fff");
    comicVM.PanelPainter.paint(panel);

    clearCanvas(null, getOverlayCanvas());
    paintOverlay();

    getCtx().restore();

    displayCanvas();
};

Scene.prototype.repaintPanels = function (panelIds) {
    for (var i = 0; i < panelIds.length; i++) {
        var panel = LayoutParser.panels[panelIds[i]];
        if (panel) {
            this.repaintSinglePanel(panel);
        }
    }
};

/**
 * @returns the names of all images used in this scene or in the specified panels
 */
Scene.prototype.getImageNames = function (panelIds) {
    panelIds || (panelIds = _.range(0, LayoutParser.panels.length));

    var imageNames = [];

    for (var i = 0; i < panelIds.length; i++) {
        var panel = LayoutParser.getPanelObject(panelIds[i]);

        // add background image
        var backgroundImage = panel.getBgrImg();
        if (typeof backgroundImage !== 'string') {
            throw "Scene.getImageNames: image element instead of string returned for panel " + panelId + ": " + panel.getBgrImg().src;
        }
        if (imageNames.indexOf(backgroundImage) < 0) {
            imageNames.push(backgroundImage);
        }

        // add character images
        for (var name in panel.allCharacterList) {
            if (name === 'all' && !panel.hasSingleImageQualifier()) {  // character all is only needed for panels with singleImageQualifier
                continue;
            }
            var characterImage = panel.getCharacterImage(name);
            if (typeof characterImage !== 'string') {
                throw "Scene.getImageNames: image element instead of string returned for character " + name + " in panel " + panel.id + ": " + characterImage.src;
            }
            if (imageNames.indexOf(characterImage) < 0) {
                imageNames.push(characterImage);
            }
        }
    }

    return imageNames;
};

Scene.prototype.resetImages = function (panelIds) {
    panelIds || (panelIds = _.range(0, LayoutParser.panels.length));

    for (var i = 0; i < panelIds.length; i++) {
        var panel = LayoutParser.getPanelObject(panelIds[i]);
        panel.resetImages();
    }

    Bgr.resetImages();
    for (var i = 0; i < this.backgrounds; i++) {
        delete this.backgrounds[i].img;
    }
};