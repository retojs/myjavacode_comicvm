/**
 * This singleton object
 */
DragResize = {

    dragging: false,
    resizing: false,

    undo: {
        stack: [],
        redoStack: [],

        /**
         * push a layout property value before you change it.
         *
         * @param value
         * @param panel
         */
        push: function (value, panel) {
            this.stack.push({
                panel: panel,
                target: comicVM.Editor.editTarget,
                value: value
            });
            this.redoStack = [];
        },

        /**
         * Pop and apply the last layout property value from the stack.
         */
        pop: function () {
            if (this.stack.length === 0) {
                return;
            }
            var item = this.stack.pop();
            this.redoStack.push(item);

            // which property we are redoing can be derived from the value type.

            if (Array.isArray(item.value)) {
                injecting(comicVM.Editor, 'editTarget', item.target, function () {
                    DragResize.getOrSetProperty(item.panel, 'pan', item.value);
                });
            } else if (typeof item.value === 'number') {
                injecting(comicVM.Editor, 'editTarget', item.target, function () {
                    DragResize.getOrSetProperty(item.panel, 'zoom', item.value);
                });
            } else if (typeof item.value === 'object') {
                injecting(comicVM.Editor, 'editTarget', item.target, function () {
                    DragResize.getOrSetProperty(item.panel, 'characterPosition', item.value);
                });
            }
            comicVM.PanelPainter.repaintPanelsOfScene(item.panel.scene);
            return item;
        }
    },

    /**
     * Adds draggable functionality to a panel background
     *
     * @param panel
     * @param editorBgrElement
     * @param elementDim
     */
    draggableBackground: function (panel, editorBgrElement, elementDim) {

        var self = this;

        var initialPan,
            initialZoom;

        function onStart(event) {
            if (!comicVM.Editor.editTarget) return;

            initialPan = self.getOrSetProperty(panel, 'pan');
            initialZoom = self.getOrSetProperty(panel, 'zoom');
            if (event.shiftKey) {
                DragResize.undo.push(initialZoom, panel);  // push a layout property value before you change it...
            } else {
                DragResize.undo.push(initialPan, panel);
            }
        }

        editorBgrElement.draggable({
            drag: onDrag,
            start: onStart,
            stop: function (event, ui) {
                onDrag(event, ui);
                self.onStop(panel, editorBgrElement);
            }
        });

        function onDrag(event, ui) {
            if (!comicVM.Editor.editTarget) return;
            self.dragging = true;

            var delta = self.getDelta(panel, ui.position, elementDim);  // calc the distance in pixels the character was dragged
            delta.px = subtractOffset(delta.px, comicVM.EditorElements.border.bgr.offset);
            cssTranslate(editorBgrElement, -delta.px.x, -delta.px.y);  // undo the dragging with a css translation

            if (event.shiftKey) {
                updateZoom(delta);
            } else {
                updatePanning(delta);
            }

            PanelInfo.showCharacterPositions(panel);

            comicVM.PanelPainter.paintBackgroundWithAllPanels(panel); // recalculates character positions
            comicVM.EditorElements.updateEditorElementPositions(panel);
            self.setLayoutText(LayoutParser.layout);
        }

        function updatePanning(delta) {
            var panning = [0, 0];
            panning[0] = r(100 * (initialPan && initialPan[0] ? initialPan[0] + delta.x : delta.x)) / 100;
            panning[1] = r(100 * (initialPan && initialPan[1] ? initialPan[1] + delta.y : delta.y)) / 100;
            self.getOrSetProperty(panel, 'pan', panning);
        }

        function updateZoom(delta) {
            var resize = self.deltaForShiftResize(delta, panel);
            self.getOrSetProperty(panel, 'zoom', r(100 * initialZoom * resize) / 100);
        }
    },

    /**
     * Adds draggable functionality to a character boundung box
     *
     * @param panel
     * @param editorBBoxElement
     * @param elementDim
     */
    draggableBBox: function (panel, editorBBoxElement, elementDim) {

        var self = this;

        var initialCharacterPosition;

        function onStart() {
            if (!comicVM.Editor.editTarget) return;

            initialCharacterPosition = $.extend(true, {}, self.getCharacterPosition(panel)); // deep copy
            DragResize.undo.push(initialCharacterPosition, panel);
        }

        editorBBoxElement.draggable({
            containment: self.getPanelContainment(panel, editorBBoxElement),
            start: onStart,
            drag: onDrag,
            stop: function (event, ui) {
                onDrag(event, ui);
                self.onStop(panel, editorBBoxElement);
            }
        });

        function onDrag(event, ui) {
            if (!comicVM.Editor.editTarget) return;
            self.dragging = true;

            var delta = self.getDelta(panel, ui.position, elementDim);

            if (event.shiftKey) {

                var resizeFactor = self.deltaForShiftResize(delta, panel);
                self.updateCharacterPosition(panel, 'all', function (characterPosition) {
                    characterPosition.size = initialCharacterPosition.size ? initialCharacterPosition.size * resizeFactor : resizeFactor;
                });

                // compensate for dragging with css translation
                panel.recalcPositions();
                var bbox = editorBBoxElement.type === comicVM.EditorElements.TYPE_BBOX_ACTIVE ? panel.getActingCharactersBBox() : panel.getCharactersPanelBBox();
                var offset = {
                    x: bbox.x - elementDim.x,
                    y: bbox.y - elementDim.y
                };
                cssTranslate(editorBBoxElement, -delta.px.x + offset.x, -delta.px.y + offset.y);

            } else {

                self.updateCharacterPosition(panel, 'all', function (characterPosition) {
                    characterPosition.x = initialCharacterPosition && initialCharacterPosition.x ? initialCharacterPosition.x + delta.x : delta.x;
                    characterPosition.y = initialCharacterPosition && initialCharacterPosition.y ? initialCharacterPosition.y + delta.y : delta.y;
                });
            }

            self.editorElementChanged(panel);
        }
    },

    /**
     * Adds draggable functionality to a character
     *
     * @param panel
     * @param editorCharElem
     * @param elementDim
     * @param characterName
     */
    draggableResizableCharacter: function (panel, editorCharElem, elementDim, characterName) {

        var self = this;

        var initialCharacterPosition,
            initialOthersActiveBBox;

        var overlayCtx;

        function onStart() {
            if (!comicVM.Editor.editTarget) return;

            initialCharacterPosition = $.extend(true, {}, self.getCharacterPosition(panel)); // deep copy
            initialOthersActiveBBox = panel.getOtherActingCharactersCurrentBBox(characterName);
            DragResize.undo.push(initialCharacterPosition, panel);
        }

        editorCharElem.draggable({
            containment: self.getPanelContainment(panel, editorCharElem),
            start: onStart,
            drag: onDrag,
            stop: function (event, ui) {
                onDrag(event, ui);
                self.onStop(panel, editorCharElem);
            }
        });

        editorCharElem.resizable({
            aspectRatio: true,
            handles: 'n, e, s, w, ne, se, sw, nw',
            start: onStart,
            resize: onResize,
            stop: function (event, ui) {
                onResize(event, ui);
                self.onStop(panel, editorCharElem);
            }
        });

        /**
         * Moves BBox in relation to the specified moving editor element to simulate the natural comic-vm positioning,
         * i.e. such that the bounding box of elem and bbox is aligned to the center of the container dim.
         *
         * @param elemDim
         * @param bboxDim
         * @returns {*}
         */
        function adjustBBoxToDrag(elemDim, bboxDim, containerDim) {
            var adjustedBBoxDim = {
                x: bboxDim.x,
                y: bboxDim.y,
                w: bboxDim.w,
                h: bboxDim.h
            };
            var extrusion = getExtrusion(elemDim, bboxDim);

            // if elemDim is included it does not affect the bounding box
            // otherwise compensate the elemDims extrusion out of the bbox of the remaining characters.

            if (!isIncludedX(elemDim, bboxDim)) {
                if (extrusion.left < 0 && -extrusion.left > extrusion.right) {  // adjust the larger of two extrusions (left or right)
                    adjustedBBoxDim.x -= extrusion.left;
                } else {
                    adjustedBBoxDim.x -= extrusion.right;
                }
            }
            if (!isIncludedY(elemDim, bboxDim)) {
                if (extrusion.top < 0 && -extrusion.top > extrusion.bottom) {  // adjust the larger of two extrusions (top or bottom)
                    adjustedBBoxDim.y -= extrusion.top;
                } else {
                    adjustedBBoxDim.y -= extrusion.bottom;
                }
            }

            return adjustedBBoxDim;
        }

        function onDrag(event, ui) {
            if (!comicVM.Editor.editTarget) return;
            self.dragging = true;

            overlayCtx = EditorPaintStrategy.newSceneOverlay(panel.scene).ctx;

            var delta = self.getDelta(panel, ui.position, elementDim);
            var characterName = editorCharElem.data('characterName');

            if (editorCharElem.type === comicVM.EditorElements.TYPE_CHARACTER_ACTINGDOUBLE && panel.actingCharacterList.length > 1) {
                if (OPTIONS.EDITOR.debug.adjustActiveDoubles) {

                    // If we're moving active character doubles, calculating the correct delta is a bit more complicated.
                    //
                    // Problem:
                    //  What delta results in a new character position where the active character double is at the current mouse position?
                    //  Individual positions in Scene and Background are relative to the characters' bounding box aligned in the center of the panel
                    //  To calculate the inverse transformation is not trivial since it depends on every individual character position.
                    //
                    // Invariant:
                    //  the bounding box of all active characters equals
                    //  the bounding box of a single character c and
                    //  the bounding box of the remaining active characters.

                    var othersNeutralBBox = panel.getOtherActingCharactersBBox(characterName);

                    var newElementDim = addOffset(elementDim, delta.px);
                    var offsetAdjustedPanelDim = addOffset(panel.dim, getCenterDistance(othersNeutralBBox, panel.dim));
                    var dragAdjustedOthersBBox = adjustBBoxToDrag(newElementDim, othersNeutralBBox, offsetAdjustedPanelDim);

                    // setPanelPositionCss($(OPTIONS.PAINTER.HELPER_CSS_ID), dragAdjustedOthersBBox, panel.pageNr);

                    var deltaBBox = getCenterDistance(dragAdjustedOthersBBox, initialOthersActiveBBox);
                    var deltaElem = getCenterDistance(newElementDim, elementDim);

                    delta.px = {
                        x: deltaElem.x - deltaBBox.x,
                        y: deltaElem.y - deltaBBox.y
                    };
                    var characterSize = panel.bgr.defaults.characterWidth * panel.getZoom();
                    delta.x = delta.px.x / characterSize;
                    delta.y = delta.px.y / characterSize;
                }
            }

            var initialPos = initialCharacterPosition[characterName];
            self.updateCharacterPosition(panel, characterName, function (characterPosition) {
                characterPosition.x = (initialPos && initialPos.x ? initialPos.x : 0) + delta.x;
                characterPosition.y = (initialPos && initialPos.y ? initialPos.y : 0) + delta.y;
            });

            self.editorElementChanged(panel);
        }

        function onResize(event, ui) {
            if (!comicVM.Editor.editTarget) return;
            self.resizing = true;

            var characterName = editorCharElem.data('characterName');

            self.updateCharacterPosition(panel, characterName, function (characterPosition) {
                var resizeDelta = self.deltaForResizeByCorner(editorCharElem, elementDim, panel);
                var initialPos = initialCharacterPosition[characterName];
                characterPosition.size = (initialPos && initialPos.size ? initialPos.size : 1) * resizeDelta;
            });

            self.editorElementChanged(panel);
        }
    },

    onStop: function (panel, editorElem) {
        this.dragging = false;
        this.resizing = false;

        // notify angular of layout changes (will trigger repaint)
        var angularScope = angular.element('body').scope();
        if (angularScope) {
            angularScope.$apply(function () {
                angular.element('#layoutContent').scope().silentLayoutEdited = true;
                angularScope.content.source.layout = LayoutParser.serializeLayout();
            });
        }

        comicVM.PanelPainter.repaint(panel, editorElem);
    },

    /**
     * Sets the containment option for all draggables
     */
    setContainment: function () { // sets containment for all character elements
        if (!this.dragging) {
            comicVM.EditorElements.applyToEach(function ($e, panel) {
                if ($e.type === comicVM.EditorElements.TYPE_CHARACTER) {
                    $e.draggable('option', 'containment', DragResize.getPanelContainment(panel, $e));
                }
            });
        }
    },

    getCharacterPosition: function (panel) {
        return this.getOrSetProperty(panel, 'characterPosition');
    },

    setCharacterPosition: function (panel, pos) {
        return this.getOrSetProperty(panel, 'characterPosition', pos);
    },

    updateCharacterPosition: function (panel, characterName, updateCallback) {
        var characterPosition = this.getCharacterPosition(panel);
        if (!characterName || characterName.toLowerCase() === 'all') {
            updateCallback(characterPosition);
        } else {
            characterPosition[characterName] = (characterPosition[characterName] || {});
            updateCallback(characterPosition[characterName]);
        }
        this.setCharacterPosition(panel, characterPosition);
    },

    editorElementChanged: function (panel) {

        // 1. update panel painting
        if (comicVM.Editor.editTarget !== comicVM.Editor.id.PANEL) {
            comicVM.PanelPainter.paintBackgroundWithAllPanels(panel); // show impact on background image
        } else {
            panel.recalcPositions();
            panel.bgr.fitBackground(panel.scene);
            panel.getCharactersPanelPositions();
        }

        // 2. set new positions
        comicVM.EditorElements.updateEditorElementPositions(panel);

        // 3. round & clean up positions before updating layout file
        var characterPosition = this.getCharacterPosition(panel);
        this.roundPosition(characterPosition);
        for (var name in characterPosition) {
            if (typeof characterPosition[name] === 'object') {
                this.roundPosition(characterPosition[name]);
                if (!LayoutParser.cleanUpCharacterPosition(characterPosition[name])) {
                    delete characterPosition[name];
                }
            }
        }

        // 4. set and show the characters at their new positions
        this.getOrSetProperty(panel, 'characterPosition', characterPosition);
        this.setLayoutText(LayoutParser.layout);
        PanelInfo.showCharacterPositions(panel);
    },

    roundPosition: function (pos) {
        pos.x = (typeof pos.x !== 'undefined') ? r(100 * pos.x) / 100 : pos.x;
        pos.y = (typeof pos.y !== 'undefined') ? r(100 * pos.y) / 100 : pos.y;
        pos.size = (typeof pos.size !== 'undefined') ? r(100 * pos.size) / 100 : pos.size;
    },

    getPanelContainment: function (panel, element) {
        var cssPos = panelPos2MousePos(panel.dim, panel.pageNr);
        var dimWithBorders = comicVM.EditorElements.getDimIncludingBorders({
            w: element.width(),
            h: element.height()
        }, {width: 2});
        return [
            r(cssPos.x - dimWithBorders.w),
            r(cssPos.y - dimWithBorders.h),
            r(cssPos.x + panel.dim.w),
            r(cssPos.y + panel.dim.h)
        ];
    },

    /**
     * Returns the offset between new and old position measured in characterSize and in Pixels (property px in result object)
     */
    getDelta: function (panel, dragPos, initialPos) {
        var deltaPx = this.getDeltaPx(dragPos, initialPos, panel.pageNr);
        var characterSize = panel.bgr.defaults.characterWidth * panel.getZoom();
        return {
            x: deltaPx.x / characterSize,
            y: deltaPx.y / characterSize,
            px: deltaPx
        }
    },

    getDeltaPx: function (dragPos, initialPos, pageNr) {
        var dragPanelPos = cssDim2PanelDim(dragPos, pageNr);
        return {
            x: dragPanelPos.x - initialPos.x,
            y: dragPanelPos.y - initialPos.y
        };
    },

    /**
     * Calculates a resize factor for an editor element that was resized by dragging it while pressing the shift key.
     *
     * @param delta
     * @param panel
     * @returns {number}
     */
    deltaForShiftResize: function (delta, panel) {
        var factor = (1 + (Math.abs(delta.px.y) / panel.dim.h * 2));  // set the vertical distance in relation to the panel height
        if (delta.y < 0) {
            factor = 1 / factor; // dragging upwards shrinks the size, dragging downwards increases it
        }
        return factor;
    },

    /**
     * Calculates a resize factor for an editor element that was resized by dragging one of its corners.
     *
     * @param editorCharElem
     * @param elementDim
     * @param panel
     * @returns {number}
     */
    deltaForResizeByCorner: function (editorCharElem, elementDim, panel) {
        var newDim = elemDim2PanelDim(editorCharElem[0], panel.pageNr, comicVM.EditorElements.getBorder(editorCharElem).width);
        return newDim.w / elementDim.w;
    },

    setLayoutText: function (layout) {
        if (LayoutParser.validateLayout(layout)) {
            $('#layoutContent').val(LayoutParser.serializeLayout(layout));
        }
    },

    getOrSetProperty: function (panel, propertyName, propertyValue) {
        switch (comicVM.Editor.editTarget) {
            case comicVM.Editor.id.PANEL:
                if (propertyValue) {
                    LayoutParser.setPanelProperty(panel.id, propertyName, propertyValue);
                } else {
                    return LayoutParser.getPanelProperty(panel.id, propertyName);
                }
                break;
            case comicVM.Editor.id.BGR:
                if (propertyValue) {
                    LayoutParser.setBackgroundProperty(panel.layoutGet.bgrQualifier(), propertyName, propertyValue);
                } else {
                    return LayoutParser.getBackgroundProperty(panel.layoutGet.bgrQualifier(), propertyName);
                }
                break;
            case comicVM.Editor.id.SCENE:
                if (propertyValue) {
                    LayoutParser.setSceneProperty(propertyName, propertyValue);
                } else {
                    return LayoutParser.getSceneProperty(propertyName);
                }
                break;
        }
        LayoutParser.cleanUpLayoutProperties(panel);
    }
};