var LayoutParser = {

    layout: null,  // the parsed layout object
    layoutUnchanged: null, // the initial state of the layout when it was parsed

    panels: [],  // the parsed Panel objects
    pagePanels: [],  // the Panel objects of each page
    backgroundPanels: {},  // the Panel objects of each background

    /**
     * Deletes all pages and panels
     */
    reset: function () {
        this.panels = [];
        this.pagePanels = [];
        this.backgroundPanels = {};
    },

    /**
     * Parses a layout JSON string and applies the layout object to this.layout
     *
     * @param jsonString: layout data structure as a JSON string
     */
    parse: function (jsonString) {
        if (!jsonString) {
            throw "jsonString is undefined or empty";
        }
        if (typeof jsonString !== 'string') {
            log(jsonString);
            throw "jsonString is not a string: " + jsonString;
        }

        this.layout = JSON.parse(jsonString.replace(/\'/g, '"'));
        this.layoutUnchanged = JSON.parse(jsonString.replace(/\'/g, '"'));

        if (!this.layout.panelProperties) {
            throw "Error: layout contains no 'panelProperties' declaration";
        }
        if (!this.layout.pages) {
            throw "Error: layout contains no 'pages' array";
        }
        if (!Array.isArray(this.layout.pages)) {
            throw "Error: layout.pages is no array";
        }
        if (this.layout.pages.length === 0) {
            log("layout.pages is empty");
        }

        return this.layout;
    },

    /**
     * @returns the original state of this.layout (without added default values or other changes through property accessors)
     */
    getLayoutUnchanged: function () {
        return this.layoutUnchanged;
    },

    getPageCount: function () {
        return this.layout.pages.length;
    },

    /**
     * @returns the specified layout as an object if the specified layout json string can be parsed
     */
    validateLayout: function (layout) {
        try {
            if (typeof layout === 'string') {
                return JSON.parse(layout);
            } else if (layout) {
                return layout;
            } else {
                log('Layout is not set');
            }
        } catch (e) {
            //log(layout);
            //log('Layout is not valid: ' + e);
            return undefined;
        }
    },

    /**
     *
     * @param scene
     * @param createPanels: if true new panels will be created, if false existing panels are updated
     */
    layoutScene: function (scene, createPanels) {
        if (createPanels) {
            this.reset();
        }
        var panelIndex = 0;
        for (var pageNr = 0; pageNr < this.layout.pages.length; pageNr++) {
            panelIndex = this.layoutPage(scene, pageNr, panelIndex, createPanels);
        }
    },

    layoutPage: function (scene, pageNr, panelIndex, createPanels) {
        if (createPanels) {
            this.pagePanels[pageNr] = [];
        }

        var strips = this.layout.pages[pageNr];
        var stripsCount = strips.length;
        if (stripsCount > 0) {
            var stripsOptions = {hStrips: null};
            if (!Array.isArray(strips[0])) { // the first array element may be an options object
                stripsOptions = strips[0];
                stripsCount--;
            }
            stripsOptions.dim = {
                y: 0,
                h: OPTIONS.PAGE.pageHeight / stripsCount
            };

            for (var stripNr = (strips.length - stripsCount); stripNr < strips.length; stripNr++) {
                panelIndex = this.layoutStrip(scene, pageNr, stripNr, panelIndex, createPanels, stripsOptions);
            }
        }
        return panelIndex;
    },

    layoutStrip: function (scene, pageNr, stripNr, panelIndex, createPanels, stripsOptions) {
        var strips = this.layout.pages[pageNr];
        var panels = strips[stripNr];
        var panelsCount = panels.length;
        if (panelsCount > 0) {
            var panelsOptions = {wPanels: null};
            if (!Array.isArray(panels[0])) { // the first array element may be an options object
                panelsOptions = panels[0];
                panelsCount--;
            }
            panelsOptions.dim = {
                x: 0,
                w: OPTIONS.PAGE.pageWidth / panelsCount
            };

            for (var panelNr = (panels.length - panelsCount); panelNr < panels.length; panelNr++) {

                // TODO extract function layoutPanel

                var panelContent = panels[panelNr];

                // calculate panel dimensions
                stripsOptions.dim.h = stripsOptions.hStrips ? OPTIONS.PAGE.pageHeight * stripsOptions.hStrips[stripNr - 1] : stripsOptions.dim.h;
                panelsOptions.dim.w = panelsOptions.wPanels ? OPTIONS.PAGE.pageWidth * panelsOptions.wPanels[panelNr - 1] : panelsOptions.dim.w;
                var panelDimensions = {
                    x: OPTIONS.PAGE.pagePadding.x + panelsOptions.dim.x,
                    y: OPTIONS.PAGE.pagePadding.y + stripsOptions.dim.y,
                    w: panelsOptions.dim.w - OPTIONS.PAGE.panelPadding.x,
                    h: stripsOptions.dim.h - OPTIONS.PAGE.panelPadding.y
                };
                panelsOptions.dim.x += panelsOptions.wPanels ? OPTIONS.PAGE.pageWidth * panelsOptions.wPanels[panelNr - 1] : panelsOptions.dim.w;

                // apply panel dimensions to panel
                var panel = this.panels ? this.panels[panelIndex] : null;
                if (createPanels || !panel) {
                    var panel = new Panel(panelIndex++, panelDimensions, scene);
                    this.panels.push(panel);
                    this.pagePanels[pageNr].push(panel);
                    var bgrQualifier = this.getPanelProperty(panel.id, 'bgrQualifier');
                    if (!this.backgroundPanels[bgrQualifier]) {
                        this.backgroundPanels[bgrQualifier] = [];
                    }
                    this.backgroundPanels[bgrQualifier].push(panel);
                }
                panel.pageNr = pageNr;
                panel.plotItemCount = Array.isArray(panelContent) ? panelContent[0] : panelContent;
            }

            stripsOptions.dim.y += stripsOptions.hStrips ? OPTIONS.PAGE.pageHeight * stripsOptions.hStrips[stripNr - 1] : stripsOptions.dim.h;
        }
        return panelIndex;
    },

    /**
     * Create the panels as specified in the layout.
     * The scene argument is assigned to each panel.
     *
     * @param scene: The scene this panels belong to
     * @returns {Array} The list of panels with panelProperties as defined in the layout and referencing the specified scene
     */
    createPanels: function (scene) {
        this.layoutScene(scene, true);
        return this.panels;
    },

    distributePlotItemsIntoPanels: function (plotItems) {
        var plotItemCount = 0;
        for (var i = 0; i < this.panels.length; i++) {
            var p = this.panels[i];
            p.setPlotItems(plotItems.slice(plotItemCount, plotItemCount + p.plotItemCount));
            plotItemCount += p.plotItemCount;
        }
    },

    getAllPanelIds: function (layout) {
        layout || (layout = this.layout);

        var result = [];
        for (var p = 0; p < layout.pages.length; p++) {
            result = result.concat(this.getPagePanelIds(p, layout));
        }
        return result;
    },

    /**
     * Iterates over all layout panels calling the specified callback for each one.
     *
     * @param callback: will be called for each panel with arguments panel, panelId, pageNr and stripNr.
     *                  To break from the iteration and return a value wrap it in an object
     *                  with the properties { exit: true, returnValue: return value }.
     *
     * @param layout: (optional) a layout on which to iterate over panels
     *
     * @returns the returnValue property of the callback's return value.
     */
    iterateLayoutPanels: function (callback, layout) {
        layout || (layout = this.layout);

        var panelId = 0;
        for (var pageNr = 0; pageNr < layout.pages.length; pageNr++) {
            var page = layout.pages[pageNr];
            for (var stripNr = 0; stripNr < page.length; stripNr++) {
                if (Array.isArray(page[stripNr])) {  // ignore hStrips
                    var strip = page[stripNr];
                    for (var panelNr = 0; panelNr < strip.length; panelNr++) {
                        if (Array.isArray(strip[panelNr])) {  // ignore wPanels
                            var panel = strip[panelNr];
                            var response = callback(panel, panelId, pageNr, stripNr);
                            if (response && response.exit) {
                                return response.returnValue;
                            }
                            panelId++;
                        }
                    }
                }
            }
        }
    },

    /**
     * @param pageNr: index in layout.pages
     * @param layout: (optional) layout to work on. If not set the LayoutParser.layout is used
     * @returns panelIds of all panels in the specified page
     */
    getPagePanelIds: function (pageNr, layout) {
        layout || (layout = this.layout);

        var result = [];

        this.iterateLayoutPanels(function (panel, panelId, currentPageNr) {
            if (pageNr === currentPageNr) {
                result.push(panelId);
            }
        }, layout);

        return result;
    },

    /**
     * @param pageNr: index in layout.pages
     * @param stripNr: index in layout.pages[pageNr]
     * @param layout: (optional) layout to work on. If not set the LayoutParser.layout is used
     * @returns panelIds of all panels in the specified strip
     */
    getStripPanelIds: function (pageNr, stripNr, layout) {
        layout || (layout = this.layout);

        var result = [];

        this.iterateLayoutPanels(function (panel, panelId, currentPageNr, currentStripNr) {
            if (pageNr === currentPageNr && stripNr === currentStripNr) {
                result.push(panelId);
            }
        }, layout);

        return result;
    },

    /**
     * @param bgrQualifier: background qualifier
     * @param layout: (optional) layout to work on. If not set the LayoutParser.layout is used
     * @returns panelIds of all panels with the specified background qualifier
     */
    getBackgroundPanelIds: function (bgrQualifier, layout) {
        layout || (layout = this.layout);

        var result = [];

        this.iterateLayoutPanels(function (panel, panelCount) {
            var currentBgrQualifier = LayoutParser.getPanelProperty(panelCount, 'bgrQualifier', layout);
            if (bgrQualifier === currentBgrQualifier) {
                result.push(panelCount);
            }
        }, layout);

        return result;
    },

    /**
     * @param pageNr: index in layout.pages
     * @param stripNr: index in layout.pages[pageNr]
     * @param panelId: the panel ID i.e. sequence number (not the index in layout.pages[pageNr][stripNr])
     * @param layout: (optional) layout to work on. If not set the LayoutParser.layout is used
     * @returns the remaining panels in the specified strip
     */
    getRemainingPanels: function (pageNr, stripNr, panelId, layout) {
        layout || (layout = this.layout);

        var result = [];

        this.iterateLayoutPanels(function (panel, currentPanelId, currentPageNr, currentStripNr) {
            if (panelId < currentPanelId && pageNr === currentPageNr && stripNr === currentStripNr) {
                result.push(currentPanelId);
            }
        }, layout);

        return result;
    },

    /**
     * @param pageNr: index in layout.pages
     * @param stripNr: index in layout.pages[pageNr]
     * @param layout: (optional) layout to work on. If not set the LayoutParser.layout is used
     * @returns the remaining strips in the specified page
     */
    getRemainingStrips: function (pageNr, stripNr, layout) {
        layout || (layout = this.layout);

        var result = [];

        this.iterateLayoutPanels(function (panel, currentPanelId, currentPageNr, currentStripNr) {
            if (pageNr === currentPageNr && stripNr < currentStripNr && result.indexOf(currentStripNr) < 0) {
                result.push(currentStripNr);
            }
        }, layout);

        return result;
    },

    /**
     * @param pageNr: index in layout.pages
     * @param layout: (optional) layout to work on. If not set the LayoutParser.layout is used
     * @returns the remaining pages in this scene
     */
    getRemainingPages: function (pageNr, layout) {
        layout || (layout = this.layout);

        if (pageNr < layout.pages.length) {
            return _.range(pageNr + 1, layout.pages.length);
        } else {
            return [];
        }
    },

    getBackgroundQualifiers: function () {
        return _.compact(_.map(this.backgroundPanels, function (panels, bgrQualifier) {
            return bgrQualifier !== '' ? bgrQualifier : undefined;
        }));
    },

    /**
     * @param panelId: the panel ID i.e. sequence number (not the index in layout.pages[pageNr][stripNr])
     * @returns the array element representing the specified panel from the layout.pages property
     */
    getPanelLayout: function (panelId, layout) {
        layout || (layout = this.layout);

        return this.iterateLayoutPanels(function (panel, panelCount) {
            if (panelCount === panelId) {
                return {exit: true, returnValue: panel};
            }
        }, layout);
    },

    getPanelObject: function (panelId) {
        return this.panels[panelId]
    },

    /**
     * Returns the array index of the specified propertyName
     */
    getPanelPropertyIndex: function (propertyName, layout) {
        layout || (layout = this.layout);

        return layout['panelProperties'].indexOf(propertyName); // TODO should be case insensitive!
    },

    getPanelProperty: function (panelId, propertyName, layout) {
        layout || (layout = this.layout);

        // get the panel configuration array from the layout file
        var panelLayout = this.getPanelLayout(panelId, layout);

        // get the corresponding array index of the specified propertyName
        var propertyIndex = this.getPanelPropertyIndex(propertyName, layout);

        // add the propertyName if it's not listed in panelProperties
        if (propertyIndex < 0) {
            layout['panelProperties'].push(propertyName);
            propertyIndex = layout['panelProperties'].length - 1;
        }

        if (panelLayout.length > propertyIndex) {

            // if the property is explicitly set to null in the layout file, set the value to default
            panelLayout[propertyIndex] || (panelLayout[propertyIndex] = OPTIONS.LAYOUT.defaultGet[propertyName]());

            return panelLayout[propertyIndex];
        } else {
            return OPTIONS.LAYOUT.defaultGet[propertyName]();
        }
    },

    /**
     *  The method getPanelProperty must be called before
     *  to make sure the property is present in layout['panelProperties'].
     */
    setPanelProperty: function (panelId, propertyName, propertyValue, layout) {
        layout || (layout = this.layout);

        // get the panel configuration array from the layout file
        var panelLayout = this.getPanelLayout(panelId, layout);

        // get the corresponding array index of the specified propertyName
        var propertyIndex = this.getPanelPropertyIndex(propertyName, layout);

        // check if old or new value differ from the default or is missing resp.
        var defaultValue = OPTIONS.LAYOUT.defaultGet[propertyName]();
        var oldValue = panelLayout[propertyIndex];
        if ((!_.isUndefined(propertyValue) && !_.isNull(propertyValue) && !_.isEqual(propertyValue, defaultValue))
            || (!_.isUndefined(oldValue) && !_.isNull(oldValue) && !_.isEqual(oldValue, defaultValue))) {

            // deep copy object values
            if (typeof propertyValue === 'object' && !Array.isArray(propertyValue)) {
                propertyValue = $.extend(true, {}, propertyValue);
            }

            // set the new value
            panelLayout[propertyIndex] = propertyValue;

            // add missing array elements
            this.addDefaults(panelLayout, layout);

            // remove trailing default values from array
            do {
                var lastPropertyValue = panelLayout[panelLayout.length - 1];
                var lastPropertyName = layout['panelProperties'][panelLayout.length - 1];
                var defaultValue = OPTIONS.LAYOUT.defaultGet[lastPropertyName]();
                if (_.isUndefined(lastPropertyValue) || _.isNull(lastPropertyValue) || _.isEqual(lastPropertyValue, defaultValue)) {
                    panelLayout.pop();
                } else {
                    break;
                }
            }
            while (panelLayout.length > 0)
        }
    },

    setBackground: function (bgrQualifier, bgr, layout) {
        layout || (layout = this.layout);

        if (typeof layout.backgrounds === 'undefined') {
            layout.backgrounds = {};
        }
        layout.backgrounds[bgrQualifier] = bgr;
    },

    getBackground: function (bgrQualifier, layout) {
        layout || (layout = this.layout);

        if (typeof layout.backgrounds === 'undefined') {
            return undefined;
        }
        return layout.backgrounds[bgrQualifier === 'DEFAULT' ? '' : bgrQualifier];
    },

    getBackgroundProperty: function (bgrQualifier, propertyName, layout) {
        layout || (layout = this.layout);

        if (propertyName === 'bgrQualifier') {
            throw "access to bgrQualifier in a background."
        }

        var bgr = this.getBackground(bgrQualifier, layout);
        if (typeof bgr === 'undefined') {
            bgr = {};
            this.setBackground(bgrQualifier, bgr, layout);
        }
        if (typeof bgr[propertyName] === 'undefined') {
            bgr[propertyName] = OPTIONS.LAYOUT.defaultGet[propertyName]();
        }
        return bgr[propertyName];
    },

    setBackgroundProperty: function (bgrQualifier, propertyName, propertyValue, layout) {
        layout || (layout = this.layout);

        var bgr = this.getBackground(bgrQualifier, layout);
        bgr[propertyName] = propertyValue;
    },

    getScene: function (layout) {
        layout || (layout = this.layout);

        return layout.scene;
    },

    getSceneProperty: function (propertyName, layout) {
        layout || (layout = this.layout);

        var layoutScene = this.getScene(layout);
        if (typeof layoutScene === 'undefined') {
            layout.scene = layoutScene = {};
        }
        if (typeof layoutScene[propertyName] === 'undefined') {
            layoutScene[propertyName] = OPTIONS.LAYOUT.defaultGet[propertyName]();
        }
        return layoutScene[propertyName];
    },

    setSceneProperty: function (propertyName, propertyValue, layout) {
        layout || (layout = this.layout);

        this.getScene(layout)[propertyName] = propertyValue;
    },

    propertyEquals: function (propertyName, p1, p2) {
        switch (propertyName) {
            case 'zoom':
                return Math.abs(p1 - p2) < 0.05;
            case 'pan':
                return p1 && p2 && Math.abs(p1[0] - p2[0]) < 0.05 && Math.abs(p1[1] - p2[1]) < 0.05;
        }
    },

    addDefaults: function (layoutPanel, layout) {
        layout || (layout = this.layout);

        for (var i = 0; i < layout.panelProperties.length; i++) {
            if (typeof layoutPanel[i] === 'undefined') {
                var propertyName = layout.panelProperties[i];
                var defaultValue = OPTIONS.LAYOUT.defaultGet[propertyName]();
                layoutPanel[i] = defaultValue;
            }
        }
    },

    removeDefaults: function (layoutFragment) {
        var result = {};
        for (var propertyName in layoutFragment) {
            var defaultGet = OPTIONS.LAYOUT.defaultGet[propertyName];
            if (typeof defaultGet() === 'object') {
                if (!defaultGet || !_.isEqual(defaultGet(), layoutFragment[propertyName])) {
                    result[propertyName] = layoutFragment[propertyName];
                }
            } else if (!defaultGet || defaultGet() !== layoutFragment[propertyName]) {
                result[propertyName] = layoutFragment[propertyName];
            }
        }
        return result;
    },

    /**
     * Cleans up the properties 'zoom' and 'pan' if they are close to their default values (+/- 0.05)
     *  - panel properties are set to default values
     *  - background and scene properties are deleted
     *
     * @param panel instance of Panel
     */
    cleanUpLayoutProperties: function (panel) {
        var properties = ['zoom', 'pan'];

        for (var i = 0; i < properties.length; i++) {
            var propertyName = properties[i];
            var propertyIndex = this.getPanelPropertyIndex(propertyName);

            var panelLayout = this.getPanelLayout(panel.id);
            if (panelLayout.length > propertyIndex && this.propertyEquals(propertyName, panelLayout[propertyIndex], OPTIONS.LAYOUT.defaultGet[propertyName]())) {
                panelLayout[propertyIndex] = OPTIONS.LAYOUT.defaultGet[propertyName]()
            }

            var bgr = this.getBackground(panel.layoutGet.bgrQualifier());
            if (bgr && this.propertyEquals(propertyName, bgr[propertyName], OPTIONS.LAYOUT.defaultGet[propertyName]())) {
                delete bgr[propertyName];
            }

            var layoutScene = this.getScene();
            if (layoutScene && this.propertyEquals(propertyName, layoutScene[propertyName], OPTIONS.LAYOUT.defaultGet[propertyName]())) {
                delete layoutScene[propertyName];
            }
        }
    },

    /**
     * Deletes character position properties which are close to their default values (+/- 0.05)
     *
     * @param characterPosition
     * @return true if any property has a non-default value, false if characterPosition is empty
     */
    cleanUpCharacterPosition: function (characterPosition) {
        var x = characterPosition.x;
        var y = characterPosition.y;
        var size = characterPosition.size;

        delete characterPosition.x;
        delete characterPosition.y;
        delete characterPosition.size;

        if (Math.abs(x) >= 0.05) {
            characterPosition.x = x;
        }
        if (Math.abs(y) >= 0.05) {
            characterPosition.y = y;
        }
        if (Math.abs(size) >= 1.05 || Math.abs(size) <= 0.95) {
            characterPosition.size = size;
        }

        return characterPosition.x || characterPosition.y || characterPosition.size;
    },

    serializeLayout: function (layout) {
        layout || (layout = this.layout);

        function serializePanel(panelConfig) {
            var result = '[ ';
            var separator = '';
            for (var property in layout['panelProperties']) {
                var propStr = serializeProperty(layout['panelProperties'][property], panelConfig[property]);
                result += propStr !== null ? separator + propStr : '';
                separator = ', ';
            }
            result += ' ]';
            return result;
        }

        function serializeProperty(name, value) {
            if (typeof value === 'undefined' || value === null) {
                return null;
            }
            switch (name) {
                case 'plotItemCount':
                case 'zoom':
                    return value;
                    break;
                case 'bgrQualifier':
                case 'characterQualifier':
                    return '"' + value + '"';
                    break;
                case 'pan':
                    return pimp(json(value));
                    break;
                case 'characterPosition':
                    return json(value, null, 2).replace(/\n/g, '\n      ');
            }
        }

        function pimp(jsonStr) {
            return jsonStr.replace(/,/g, ', ').replace(/:/g, ': ');
        }

        var indent = [
            '',
            '  ',
            '    ',
            '      '];
        var result = '';
        for (var section in layout) {
            result += '"' + section + '": ';
            switch (section) {
                case 'pages':
                    var pagesStr = '[\n';
                    for (var p = 0; p < layout['pages'].length; p++) {
                        var page = layout['pages'][p];
                        pagesStr += indent[1] + '[\n';
                        for (var s = 0; s < page.length; s++) {
                            if (!Array.isArray(page[s])) { // the first array element may be an options object
                                pagesStr += indent[2] + pimp(json(page[s])) + ',\n';
                                continue;
                            }
                            var strip = page[s];
                            pagesStr += indent[2] + '[\n';
                            for (var pnl = 0; pnl < strip.length; pnl++) {
                                if (!Array.isArray(strip[pnl])) { // the first array element may be an options object
                                    pagesStr += indent[3] + pimp(json(strip[pnl])) + ',\n';
                                    continue;
                                }
                                var panel = strip[pnl];
                                pagesStr += indent[3] + serializePanel(panel) + (pnl < strip.length - 1 ? ', ' : '') + '\n';
                            }
                            pagesStr += indent[2] + ']' + (s < page.length - 1 ? ', ' : '') + '\n';
                        }
                        pagesStr += indent[1] + ']' + (p < layout['pages'].length - 1 ? ', \n' : '\n');
                    }
                    pagesStr += ']';
                    result += pagesStr;
                    break;
                case 'panelProperties':
                case 'backgrounds':
                case 'scene':
                    result += json(layout[section], null, 2);
                    break;
            }
            result += ',\n';
        }
        return '{\n' + result.replace(/^/, '  ').replace(/,\n$/, '').replace(/\n/g, '\n  ') + '\n}';
    }
};