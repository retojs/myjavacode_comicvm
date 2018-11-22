/**
 * The Singleton containing the editable (jQuery-) elements of the editor
 *
 */

;var comicVM = comicVM || {};

comicVM.EditorElements = {

    TYPE_CHARACTER: 'TYPE_CHARACTER',
    TYPE_CHARACTER_ACTINGDOUBLE: 'TYPE_CHARACTER_ACTINGDOUBLE',
    TYPE_BBOX: 'TYPE_BBOX',
    TYPE_BBOX_ACTIVE: 'TYPE_BBOX_ACTIVE',
    TYPE_BACKGROUND: 'TYPE_BACKGROUND',

    ACTIVE_DOUBLE_SUFFIX: '-active',

    /**
     * Calls the specified callback function for each editor element or - if a panel is specified - for each editor element of that panel.
     *
     * @param callback
     * @param panel
     */
    applyToEach: function (callback, panel) {
        for (panelId in this.editorElements) {
            if (!panel || panel.id == panelId) {
                for (var i = 0; i < this.editorElements[panelId].length; i++) {
                    callback(this.editorElements[panelId][i], panel ? panel : LayoutParser.getPanelObject(panelId));
                }
            }
        }
    },

    border: {
        char: {
            box: {
                width: 2,
                style: 'solid',
                color: 'rgba(0, 192, 255, 1.0)',
                colorHover: '#66f',

                active: {
                    width: 2,
                    style: 'solid',
                    color: 'rgb(255, 99, 0)',
                    fill: 'rgb(255, 99, 0)',
                    colorHover: 'rgb(255, 99, 0)',

                    double: {
                        width: 2,
                        style: 'dotted',
                        color: 'rgba(255, 99, 0, 0.5)',
						fill: 'rgb(255, 99, 0)',
                        colorHover: 'rgba(255, 99, 0, 0.5)'
                    }
                }
            },
            bitmap: {
                width: 1,
                style: 'dashed',
                radius: 3,
                color: 'rgba(0, 0, 0, 0.2)',
                colorHover: 'rgba(0, 0, 0, 0.2)'
            }
        },
        bbox: {
            width: 0,
            style: 'solid',
            fill: 'rgba(0, 255, 255, 0.1)',
            color: 'none',
            colorHover: 'rgba(00, 100, 255, 0.1)',

            active: {
                width: 0,
                style: 'solid',
                fill: 'rgba(255, 99, 0, 0.2)',
                color: 'none',
                colorHover: 'rgba(255, 99, 0, 0.2)'
            }
        },
        bgr: {
            width: 4,
            offset: {x: -2, y: -1, w: 2, h: 2},
            style: 'solid',
            color: 'rgba(0, 255, 99, 0.5)',
            colorHover: 'rgba(0, 255, 99, 0.5)'
        }
    },

    getBorder: function ($e) {
        switch ($e.type) {
            case this.TYPE_BACKGROUND:
                return this.border.bgr;
                break;
            case this.TYPE_BBOX:
                return this.border.bbox;
                break;
            case this.TYPE_BBOX_ACTIVE:
                return this.border.bbox.active;
                break;
            case this.TYPE_CHARACTER:
                return this.border.char.box;
                break;
            case this.TYPE_CHARACTER_ACTINGDOUBLE:
                return this.border.char.box.active.double;
                break;
        }
    },

    mouseOverPanel: null,

    /**
     * Enables and disables the draggable functionality for editor element according to the new edit target.
     * for edit target PANEL:
     *  - types bbox, character are enabled
     *
     * @param editTarget
     */
    editTargetChanged: function (editTarget) {
        comicVM.EditorElements.applyToEach(function ($e, panel) {
            if ($e.hasClass('ui-draggable')) {
                if (!editTarget) {
                    $e.draggable('disable');
                    if ($e.type === comicVM.EditorElements.TYPE_CHARACTER) {
                        $e.resizable('disable');
                    }
                } else {
                    switch ($e.type) {
                        case comicVM.EditorElements.TYPE_BACKGROUND:
                            break;
                        case comicVM.EditorElements.TYPE_BBOX:
                            if (editTarget === comicVM.Editor.id.PANEL) {
                                $e.draggable('enable');
                                $e.css('z-index', OPTIONS.Z_INDEX.Editor.bbox.enabled);
                            } else {
                                $e.draggable('disable');
                                $e.css('z-index', OPTIONS.Z_INDEX.Editor.bbox.disabled);
                            }
                            break;
                        case comicVM.EditorElements.TYPE_BBOX_ACTIVE:
                            if (editTarget === comicVM.Editor.id.PANEL) {
                                $e.draggable('disable');
                                $e.css('z-index', OPTIONS.Z_INDEX.Editor.bbox.active.disabled);
                            } else {
                                $e.draggable('enable');
                                $e.css('z-index', OPTIONS.Z_INDEX.Editor.bbox.active.enabled);
                            }
                            break;
                        case comicVM.EditorElements.TYPE_CHARACTER:
                            if (editTarget === comicVM.Editor.id.PANEL) {
                                $e.draggable('enable');
                                $e.resizable('enable');
                                $e.css('z-index', OPTIONS.Z_INDEX.Editor.character.enabled);
                                $e.css('border-style', 'solid');
                            } else {
                                if (panel.isActingCharacter($e.data('characterName'))) {
                                    $e.css('border-style', 'dotted');
                                    $e.draggable('disable');
                                    $e.resizable('disable');
                                    $e.css('z-index', OPTIONS.Z_INDEX.Editor.character.active.disabled);
                                } else {
                                    $e.draggable('enable');
                                    $e.resizable('enable');
                                    $e.css('z-index', OPTIONS.Z_INDEX.Editor.character.active.enabled);
                                }
                            }
                            break;
                        case comicVM.EditorElements.TYPE_CHARACTER_ACTINGDOUBLE:
                            if (editTarget === comicVM.Editor.id.PANEL) {
                                $e.draggable('disable');
                                $e.resizable('disable');
                                $e.css('z-index', OPTIONS.Z_INDEX.Editor.character.active.disabled);
                                $e.css('border-style', 'dotted');
                            } else {
                                $e.css('border-style', 'solid');
                                if (panel.actingCharacterList.length > 1) {
                                    $e.draggable('enable');
                                    $e.resizable('enable');
                                    $e.css('z-index', OPTIONS.Z_INDEX.Editor.character.active.enabled);
                                } else { // single active double can't be moved since they make up the complete bbox which is always in the center
                                    $e.draggable('disable');
                                    $e.resizable('disable');
                                    $e.css('z-index', OPTIONS.Z_INDEX.Editor.character.active.disabled);
                                }
                            }
                            break;
                    }
                }
            }
        });
    },


    /**
     * contains the draggable und resizable (jQuery-) elements per panel.
     *
     * { panelId: [elem, elem, ...], panelId: [...], ... }
     */
    editorElements: {},

    addEditorElement: function (panel, element, type) {
        element.type = type;
        if (!this.editorElements[panel.id]) {
            this.editorElements[panel.id] = [];
        }
        this.editorElements[panel.id].push(element);
    },

    /**
     * removes editor elements (all, those of a single panel or a list of panels)
     * @param panel: can be a panel object, an array of panel objects or an array of panel ids
     * @param pageNr
     */
    removeEditorElements: function (panel, pageNr) {

        var self = this;

        function removePanelElements(panelId) {
            if (self.editorElements[panelId]) {
                for (var i in self.editorElements[panelId]) {
                    self.editorElements[panelId][i].remove();
                }
                delete self.editorElements[panelId];
            }
        }

        if (panel) {
            if (Array.isArray(panel)) {
                for (var i = 0; i < panel.length; i++) {
                    if (typeof panel[i] === 'number') {
                        removePanelElements(panel[i]);
                    } else {
                        removePanelElements(panel[i].id);
                    }
                }
            } else {
                removePanelElements(panel.id);
            }
        } else {
            for (var panelId in this.editorElements) {
                if (isNaN(pageNr) || pageNr == LayoutParser.getPanelObject(panelId).pageNr) {
                    removePanelElements(panelId);
                }
            }
        }
    },

    hasEditorElements: function () {
        return this.editorElements.length > 0;
    },

    createEditorElement: function (panel, dim, id, type) {
        var element = $('<div></div>');
        element.attr('id', id);
        setPanelPositionCss(element, dim, panel.pageNr);
        this.addEditorElement(panel, element, type);
        $('#image').append(element);

        var self = this;
        // fade all elements except those in the panel where the mouse is
        element.on('mouseenter', function (event) {
            if (!DragResize.dragging && !DragResize.resizing) {
                comicVM.EditorElements.fadeOtherPanelsElements(panel, true);
                self.hideThisPanelsInvisibleElements(panel, false);
                if (element.type === comicVM.EditorElements.TYPE_BACKGROUND) {
                    self.fadeElement(element, false);
                    self.mouseOverPanelId = panel.id;
                }
            }
        });
        element.on('mouseleave', function (event) {
            if (!DragResize.dragging && !DragResize.resizing) {
                comicVM.EditorElements.fadeOtherPanelsElements(panel, false);
                self.hideThisPanelsInvisibleElements(panel, true);
                if (element.type === comicVM.EditorElements.TYPE_BACKGROUND) {
                    self.fadeElement(element, true);
                }
            }
        });

        return element;
    },

    createEditorElementForCharacter: function (panel, dim, border, characterName, type) {
        dim = $.extend({}, dim);

        var dimExtended = this.getDimIncludingBorders(dim, comicVM.EditorElements.border.char.box),
            element = this.createEditorElement(panel, dimExtended, 'character-' + characterName + '-panel-' + panel.id, (type || comicVM.EditorElements.TYPE_CHARACTER));

        this.setBorderCss(element, border, false);
        element.css({
            zIndex: OPTIONS.Z_INDEX.Editor.character.enabled
        });

        if (!doesOverlap(panel.dim, dim)) {
            element.hide();
        }

        var i = characterName.indexOf(comicVM.EditorElements.ACTIVE_DOUBLE_SUFFIX);
        element.data('characterName', (i > 0) ? characterName.substr(0, i) : characterName);

        // add image element if its not an active double and if characters are not represented with a single image
        if (i < 0 && !panel.hasSingleImageQualifier()) {

            var character = panel.getCharacterByName(characterName);
            var img = panel.getCharacterImage(characterName);
            var $img = $('<img/>');
            $img.attr('src', img.src);
            if (!character.bitmapDim) {
                comicVM.PanelPainter.calcBitmapDim(panel, character);
            }
            var bitmapDimExtended = this.getDimIncludingBorders(character.bitmapDim, comicVM.EditorElements.border.char.box)
            setAttrWidthHeight($img, bitmapDimExtended);

            var imgBorder = comicVM.EditorElements.border.char.bitmap;
            this.setBorderCss($img, imgBorder);
            $img.css({
                marginLeft: character.bitmapDim.x - dim.x - border.width - imgBorder.width,
                marginTop: character.bitmapDim.y - dim.y - border.width - imgBorder.width,
                zIndex: OPTIONS.Z_INDEX.Editor.character.bitmap
            });

            $img.on('dragstart', function (event) {
                event.preventDefault(); // prevent browser dragging functionality of images
            });

            element.append($img);
        }

        return element;
    },

    createEditorElementForCharacterBBox: function (panel, dim, border, type) {
        dim = $.extend({}, dim);

        var element = this.createEditorElement(panel, dim, 'characterBBox-panel-' + panel.id, type);
        this.setBorderCss(element, border, false);
        element.css({
            zIndex: OPTIONS.Z_INDEX.Editor.bbox.enabled,
            backgroundColor: border.fill
        });
        if (isNaN(dim.w) || isNaN(dim.h)) {
            element.hide();
        }
        return element;
    },

    createEditorElementForBackground: function (panel, dim, border) {
        var panelDim = $.extend({}, panel.dim);
        panelDim = addOffset(panelDim, this.border.bgr.offset);
        var element = this.createEditorElement(panel, panelDim, 'background-panel-' + panel.id, comicVM.EditorElements.TYPE_BACKGROUND);
        this.setBorderCss(element, border, false);
        element.css({
            zIndex: OPTIONS.Z_INDEX.Editor.bgr
        });
        this.fadeElement(element, true);
        return element;
    },

    fadeElement: function ($e, fade) {
        $e.css('opacity', fade ? 0.2 : 1.0);
    },

    fadeElementsByType: function (type, fade, panel) {
        comicVM.EditorElements.applyToEach(function ($e) {
            if ($e.type === type) {
                comicVM.EditorElements.fadeElement($e, fade);
            }
        })
    },

    fadeOtherPanelsElements: function (panel, fade) {
        comicVM.EditorElements.applyToEach(function ($e, _panel) {
            if (_panel.id != panel.id && $e.type !== comicVM.EditorElements.TYPE_BACKGROUND) {
                comicVM.EditorElements.fadeElement($e, fade);
            }
        });
    },

    hideThisPanelsInvisibleElements: function (panel, hide) {
        comicVM.EditorElements.applyToEach(function ($e) {
            if ($e.type !== comicVM.EditorElements.TYPE_BACKGROUND) {
                var dim = _.extend({}, cssDim2PanelDim(parseCssPosition($e), panel.pageNr));
                // test with a dim half the size to hide *almost* visible element, too
                dim.x += dim.w / 4;
                dim.y += dim.h / 4;
                dim.w /= 2;
                dim.h /= 2;
                if (!doesOverlap(panel.dim, dim)) {
                    if (hide) {
                        $e.hide();
                    } else {
                        $e.show();
                    }
                }
            }
        }, panel);
    },

    /**
     * Moves all editor elements to their new positions.
     *
     * @param panel
     */
    updateEditorElementPositions: function (panel) {
        var self = this;
        this.applyToEach(function ($e) {

            // the two character types need to be handled differently.
            if ($e.type === self.TYPE_CHARACTER || $e.type === self.TYPE_CHARACTER_ACTINGDOUBLE) {
                var characterName = $e.data('characterName');
                var character = panel.getCharacterByName(characterName);

                if ($e.type === self.TYPE_CHARACTER_ACTINGDOUBLE) {

                    // active doubles have the suffix '-active' in their name
                    var i = characterName.indexOf(self.ACTIVE_DOUBLE_SUFFIX);
                    characterName = (i > 0) ? characterName.substr(0, i) : characterName;

                    var dim = pos2dim(panel.getActingCharactersPositions()[characterName]);
                    setPanelPositionCss($e, dim, panel.pageNr);

                } else {
                    var pos = panel.getCharactersPanelPositions()[characterName];
                    if (pos) {
                        character.pos = pos;
                        var dim = pos2dim(pos);
                        setPanelPositionCss($e, dim, panel.pageNr);

                        // set position of character image nested inside the editor element div:

                        var $img = $e.find('img');
                        comicVM.PanelPainter.calcBitmapDim(panel, character);
                        setAttrWidthHeight($img, character.bitmapDim);

                        var imgBorder = comicVM.EditorElements.border.char.bitmap;
                        var border = comicVM.EditorElements.border.char.box;
                        $img.css({
                            marginLeft: character.bitmapDim.x - dim.x - border.width - imgBorder.width,
                            marginTop: character.bitmapDim.y - dim.y - border.width - imgBorder.width
                        });
                    }
                }
            }

            else if ($e.type === self.TYPE_BBOX || $e.type === self.TYPE_BBOX_ACTIVE) {
                var dim = $e.type === self.TYPE_BBOX ?
                    panel.getCharactersPanelBBox()
                    : panel.getActingCharactersBBox();

                setPanelPositionCss($e, dim, panel.pageNr);
            }

        }, panel);
    },

    setBorderCss: function (elem, border, hover) {

        function getColor(border, hover) {
            return hover ? border.colorHover : border.color;
        }

        if (border) {
            if (getColor(border, hover)) {
                elem.css('border', border.width + 'px ' + border.style + ' ' + getColor(border, hover));
                elem.css('margin', 0);
            } else {
                elem.css('border', 'none');
                elem.css('margin', border.width);
            }
            if (border.radius) {
                elem.css('border-radius', border.radius);
            }
        }
    },

    getDimIncludingBorders: function (elementDim, border) {
        var dim = {
            w: elementDim.w + (border ? border.width : 0),
            h: elementDim.h + (border ? border.width : 0)
        }
        if (elementDim.x) {
            dim.x = elementDim.x - border.width * 0.5;
        }
        if (elementDim.y) {
            dim.y = elementDim.y - border.width * 0.5;
        }
        return dim;
    }
};
