var LayoutRepaint = {

    newChange: function () {

        var proto = {
            addAll: addAll,
            addRest: addRest,
            addPage: addPage,
            addStrip: addStrip,
            addPanel: addPanel,
            addBackgroundPanels: addBackgroundPanels,
            hasChange: hasChange,
            addComment: addComment,
            toString: toString
        };

        return _.create(proto);

        function addAll() {
            this.all = true;
            return this;
        }

        function addRest() {
            this.rest = true;
            return this;
        }

        function addPage(pageNr) {
            this.pages || (this.pages = []);
            this.pages.push({pageNr: pageNr});
            return this;
        }

        function addStrip(pageNr, stripNr) {
            this.strips || (this.strips = []);
            this.strips.push({pageNr: pageNr, stripNr: stripNr});
            return this;
        }

        function addPanel(panelId, pageNr, stripNr) {
            this.panelIds || (this.panelIds = []);
            this.panelIds.push(panelId);
            this.pageNr = pageNr;
            this.stripNr = stripNr;
            return this;
        }

        /**
         * Adds all panelIds of all specified backgrounds
         */
        function addBackgroundPanels(qualifiers, layout) {
            this.panelIds || (this.panelIds = []);
            Array.isArray(qualifiers) || (qualifiers = [qualifiers]);
            for (var i = 0; i < qualifiers.length; i++) {
                var qualifier = qualifiers[i];
                var panelIds = LayoutParser.getBackgroundPanelIds(qualifier, layout);
                this.panelIds = panelIds.concat(this.panelIds);
            }
            return this;
        }

        function hasChange() {
            return this.all
                || (this.pages && this.pages.length > 0)
                || (this.strips && this.strips.length > 0)
                || (this.panelIds && this.panelIds.length > 0);
        }

        function addComment(comment) {
            this.comment || (this.comment = '');
            this.comment += (this.comment ? ', ' : 'LayoutRepaint: ') + comment;
            return this;
        }

        function toString() {
            return this.comment
                + (this.pages ? '\n' + json(this.pages) : '')
                + (this.strips ? '\n' + json(this.strips) : '');
        }
    },


    /**
     * Compares layout properties of old and new layout and collects panels to repaint.
     *
     * @param oldLayout
     * @param newLayout
     * @returns {all: boolean} or { panels: [panelIds] }
     */
    layoutChange: function (oldLayout, newLayout) {
        var change = LayoutRepaint.newChange();

        // repaint nothing if layout unchanged
        if (_.isEqual(oldLayout, newLayout)) {
            return {};
        }

        // repaint all if scene or layoutProperties changed
        if (!_.isEqual(oldLayout.scene, newLayout.scene)) {
            return change.addAll()
                .addComment('layout.scene changed');
        }
        if (!_.isEqual(oldLayout.panelProperties, newLayout.panelProperties)) {
            return change.addAll()
                .addComment('layout.layoutProperties changed');
        }

        // repaint panels of background that changed
        if (!_.isEqual(oldLayout.backgrounds, newLayout.backgrounds)) {
            if (!oldLayout.backgrounds) {
                change.addBackgroundPanels(Object.keys(newLayout.backgrounds), newLayout)
                    .addComment('layout.backgrounds was added');
            }
            else if (!newLayout.backgrounds) {
                change.addBackgroundPanels(Object.keys(oldLayout.backgrounds), oldLayout)
                    .addComment('layout.backgrounds was removed');
            }
            else if (!_.isEqual(Object.keys(oldLayout.backgrounds).sort(), Object.keys(newLayout.backgrounds).sort())) {
                var oldBackgroundKeys = Object.keys(oldLayout.backgrounds),
                    newBackgroundKeys = Object.keys(newLayout.backgrounds),
                    argsOld = [oldBackgroundKeys].concat(newBackgroundKeys),
                    argsNew = [newBackgroundKeys].concat(oldBackgroundKeys);
                change.addBackgroundPanels(_.without.apply(_, argsOld), oldLayout) // repaints all removed backgrounds
                    .addBackgroundPanels(_.without.apply(_, argsNew), newLayout)  // repaints all added backgrounds
                    .addComment('background was added or removed to layout.backgrounds');
            } else {
                // if we got here all bgr keys are equal
                for (var qualifier in oldLayout.backgrounds) {
                    if (!_.isEqual(oldLayout.backgrounds[qualifier], newLayout.backgrounds[qualifier])) {
                        change.addBackgroundPanels(qualifier, oldLayout)
                            .addComment('layout.backgrounds.' + qualifier + ' has changed');
                    }
                }
            }
        }

        change = checkPages(change, oldLayout, newLayout);

        if (!change.hasChange()) {
            change.all = true;
            log('No panels to repaint detected. Will repaint all');
        }

        return change;

        // private functions

        function checkPages(change, oldLayout, newLayout) {
            if (!_.isEqual(oldLayout.pages, newLayout.pages)) {
                // repaint all if number of pages changed
                if (!oldLayout.pages || !newLayout.pages || oldLayout.pages.length !== newLayout.pages.length) {
                    return change.addAll()
                        .addComment('The number of pages has changed');
                }
                else {
                    // check each page
                    for (var pageNr = 0; pageNr < oldLayout.pages.length; pageNr++) {
                        if (!_.isEqual(oldLayout.pages[pageNr], newLayout.pages[pageNr])) {
                            var oldPage = oldLayout.pages[pageNr],
                                newPage = newLayout.pages[pageNr];

                            if (Array.isArray(oldPage[0]) !== Array.isArray(newPage[0])) {
                                // repaint page if strip dimensions were added or removed
                                change.addPage(pageNr)
                                    .addComment('Strip dimensions were added or removed');
                            } else if (!Array.isArray(oldPage[0]) && !_.isEqual(oldPage[0], newPage[0])) {
                                // repaint page if strip dimensions have changed
                                change.addPage(pageNr)
                                    .addComment('Strip dimensions have changed');
                            } else {
                                change = checkStrips(change, oldPage, newPage, pageNr);
                                if (change.rest) {
                                    return change;
                                }
                            }
                        }
                    }
                }
            }
            return change;
        }

        function checkStrips(change, oldPage, newPage, pageNr) {
            // repaint all from here if number of strips has changed
            if (!oldPage || !newPage || oldPage.length !== newPage.length) {
                return change.addPage(pageNr)
                    .addRest()
                    .addComment('The number of strips has changed');
            }
            else {
                // check each strip in page
                for (var stripNr = 0; stripNr < oldPage.length; stripNr++) {
                    var oldStrip = oldPage[stripNr],
                        newStrip = newPage[stripNr];

                    if (Array.isArray(oldStrip[0]) !== Array.isArray(newStrip[0])) {
                        // panel dimensions were added or removed
                        change.addStrip(pageNr, stripNr)
                            .addComment('Panel dimensions were added or removed');
                    } else if (!Array.isArray(oldStrip[0]) && !_.isEqual(oldStrip[0], newStrip[0])) {
                        // panel dimensions have changed
                        change.addStrip(pageNr, stripNr)
                            .addComment('Panel dimensions have changed');
                    } else {
                        change = checkPanels(change, oldStrip, newStrip, pageNr, stripNr);
                        if (change.rest) {
                            return change;
                        }
                    }
                }
            }
            return change;
        }

        function checkPanels(change, oldStrip, newStrip, pageNr, stripNr) {
            // repaint all from here if number of panels has changed
            if (!oldStrip || !newStrip || oldStrip.length !== newStrip.length) {
                return change.addStrip(pageNr, stripNr)
                    .addRest()
                    .addComment('The number of panels has changed');
            }
            else {
                // check each panel in strip
                var panelIdOffset = LayoutParser.getStripPanelIds(pageNr, stripNr, oldLayout)[0];
                for (var p = 0; p < oldStrip.length; p++) {
                    var oldPanel = oldStrip[p],
                        newPanel = newStrip[p];

                    if (!_.isEqual(oldPanel, newPanel)) {
                        change = checkPanelProperties(change, oldPanel, newPanel, panelIdOffset + p, pageNr, stripNr);
                        if (change.rest) {
                            return change;
                        }
                    }
                }
            }
            return change;
        }

        function checkPanelProperties(change, oldPanel, newPanel, panelId, pageNr, stripNr) {
            for (var pp = 0; pp < Math.max(oldPanel.length, newPanel.length); pp++) {
                var oldPanelProperty = oldPanel[pp],
                    newPanelProperty = newPanel[pp];

                if (!_.isEqual(oldPanelProperty, newPanelProperty)) {
                    switch (oldLayout.panelProperties[pp]) {
                        case 'plotItemCount':
                            return change.addPanel(panelId, pageNr, stripNr)
                                .addRest()
                                .addComment('plotItemCount changed from ' + oldPanelProperty + ' to ' + newPanelProperty);
                        case 'bgrQualifier':
                            // repaint panels of old and new background
                            change.addBackgroundPanels([oldPanelProperty, newPanelProperty], newLayout)
                                .addComment('bgrQualifier changed from ' + oldPanelProperty + ' to ' + newPanelProperty);
                            break;
                        case 'characterQualifier':
                        case 'characterPosition':
                            change.addPanel(panelId, pageNr, stripNr)
                                .addComment(oldLayout.panelProperties[pp] + ' changed from ' + oldPanelProperty + ' to ' + newPanelProperty);
                            break;
                        case 'zoom':
                        case 'pan':
                            var bgrQualifier = LayoutParser.getPanelProperty(panelId, 'bgrQualifier');
                            change.addBackgroundPanels(bgrQualifier, newLayout)
                                .addComment(oldLayout.panelProperties[pp] + ' changed from ' + oldPanelProperty + ' to ' + newPanelProperty);
                    }
                }
            }
            return change;
        }
    }
};