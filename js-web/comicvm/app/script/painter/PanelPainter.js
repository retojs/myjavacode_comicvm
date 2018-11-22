/**
 * This singleton object can paint any panel
 */

;var comicVM = comicVM || {};

comicVM.PanelPainter = {

    PAINT_STYLE: {
        INK: 0,  // values are use as array index in options
        YELLOW: 1,
        EDITOR: 2
    },

    paintStyle: null,

    isPaintStyleINK: function () {
        return this.paintStyle === this.PAINT_STYLE.INK;
    },
    isPaintStyleYELLOW: function () {
        return this.paintStyle === this.PAINT_STYLE.YELLOW
    },
    isPaintStyleEDITOR: function () {
        return this.paintStyle === this.PAINT_STYLE.EDITOR;
    },

    setPaintStyle: function (paintStyle) {
        this.paintStyle = paintStyle;
        this.updateOptions();
    },

    setPaintStyleINK: function () {
        this.setPaintStyle(this.PAINT_STYLE.INK);
    },
    setPaintStyleYELLOW: function () {
        this.setPaintStyle(this.PAINT_STYLE.YELLOW);
    },
    setPaintStyleEDITOR: function () {
        this.setPaintStyle(this.PAINT_STYLE.EDITOR);
    },

    highlighted: {
        panelId: -1
    },
	
	// TODO rename to config

    options: {},

    updateOptions: function () {

        this.options = {

		// TODO remove and use inheritance
		
            paintStrategy: EditorPaintStrategy,
		
		// configuration should provide sections
		//  - paint: condition if to paint or not to paint
		//  - color: values are HTML colors (#123123, rgba(255, 255, 0), etc.)
		//  - measures: lengths, widths, radius, ...
		//     (contains sections by value (lineWidth) and sections by element (character)
		//  - font: font stile and size

            paint: {  // true | false

                yellowPrint: this.isPaintStyleYELLOW(),
                background: true,
                character: {
                    box: !this.isPaintStyleINK(),
                    bitmap: true,
                    bitmapBorder: false && this.isPaintStyleEDITOR()
                },
                characters: {
                    bbox: this.isPaintStyleEDITOR(),
                    active: {
                        bbox: this.isPaintStyleEDITOR()
                    }
                },
                info: {
                    plotItemCount: false,
                    panel: {
                        id: false,
                        border: false
                    },
                    character: this.isPaintStyleEDITOR(),
                    background: this.isPaintStyleEDITOR(),
                    bgrImageSize: true
                },
                descriptions: this.isPaintStyleEDITOR(),
                grid: this.isPaintStyleEDITOR()
            },

            color: {  // color values by paintStyle index (0: INK, 1: YELLOW, 2: EDITOR

                background: '#fff',
                text: ['#000', '#ff0', '#000'][this.paintStyle],
                frame: ['#000', '#ff0', '#000'][this.paintStyle],
                grid: ['rgba(0, 0, 255, 0.333)', 'rgba(255, 255, 0, 0.5)', 'rgba(125, 125, 125, 0.333)'][this.paintStyle],
                bubble: {
                    line: ['#000', '#ff0', '#000'][this.paintStyle],
                    fill: '#fff',
                    pointerHalo: 'rgba(255, 255, 255, 0.5)'
                },
                character: {
                    box: {
                        line: this.isPaintStyleYELLOW() ? '#ff0' : comicVM.EditorElements.border.char.box.color,
                        fill: ['rgba(225, 255, 255, 0.5)', '#ff0', 'rgba(225, 255, 255, 0.5)'][this.paintStyle]
                    },
                    active: {
                        box: {
                            line: this.isPaintStyleYELLOW() ? '#ff0' : 'rgb(255, 99, 0)',
                            fill: [comicVM.EditorElements.border.char.box.active.fill, '#ff0', comicVM.EditorElements.border.char.box.active.fill][this.paintStyle],
                        }
                    },
                    bitmapBorder: '#888'
                },
                characters: {
                    bbox: {
                        line: null,
                        fill: comicVM.EditorElements.border.bbox.fill
                    },
                    active: {
                        bbox: {
                            line: null,
                            fill: comicVM.EditorElements.border.bbox.active.fill
                        }
                    }
                },
                info: {
                    text: ['#000', '#0ff', '#09f'][this.paintStyle],
                    character: {
                        text: comicVM.EditorElements.border.char.box.color,
                        fill: '#fff'
                    },
                    background: {
                        text: '#fff',
                        fill: ['teal', '#ff0', 'teal'][this.paintStyle],
                        image: {
                            line: this.isPaintStyleYELLOW() ? '#ff0' : 'rgba(120, 120, 120, 1.0)',
                            fill: 'rgba(0, 255, 0, 0.3)'
                        }
                    },
                    panel: {
                        id: {
                            text: 'teal',
                            fill: 'lightcyan',
                            line: 'lightseagreen'
                        },
                        plotItemCount: {
                            text: 'teal',
                            fill: 'lightcyan',
                            line: 'lightseagreen'
                        }
                    },
                    descriptions: ['#00f', '#ff0', '#0ff'][this.paintStyle],
                    frame: {
                        highlighted: ['#000', '#ff0', 'teal'][this.paintStyle],
                        relative: this.isPaintStyleYELLOW() ? '#ff0' : 'rgba(0, 255, 90, 0.9)',
                        absolute: this.isPaintStyleYELLOW() ? '#ff0' : 'rgba(0, 255, 90, 0.5)',
                        lines: 'rgba(0, 255, 90, 0.5)'
                    }
                }
            },

			// TODO: rename to "measures"
			
            style: {
                lineWidth: {
                    frame: 3,
                    grid: 0.5,
                    bubble: {
                        border: 3,
                        pointer: 1.5,
                        pointerHalo: 4
                    },
                    bitmap: {
                        border: 1,
                        lineDash: [2, 5]
                    },
                    character: {
                        box: 2,
                        bbox: comicVM.EditorElements.border.bbox.width
                    },
                    background: 2,
                    told: {
                        border: 3
                    },
                    highlighted: {
                        frame: [3, 3, 4][this.paintStyle]
                    }
                },
				
				// TODO move to own section "font"
				
                getFont: function () {
                    return this.font.height + 'px ' + this.font.face;
                },
                font: {
                    face: 'Comic Sans MS',
                    height: 14,
                    lineHeight: 16,
                    baseLine: 0.85 // defines the vertical position of the text baseline (0: top, 1: bottom)
                },
                bubble: {
                    margin: {x: 10, y: 10}, // space around the border
                    padding: {x: 12, y: 8}, // space between border and text
                    maxWidthHeightRatio: 25, // the length of a bubble can not be longer than this many times its height
                    radiusX: 14, // bubble corner radius
                    radiusY: 12, // bubble corner radius
                    characterGap: 8 // distance between line pointer and character
                },
                character: {
                    minVisibility: 0.2 // character is only drawn if more than this part of it is visible
                },
                background: {
                    lineDash: [6, 10]
                },
                told: {
                    margin: {x: 5, y: 5}, // space around the border
                    padding: {x: 5, y: 5} // space between border and text
                },
                desc: {
                    margin: {x: 10, y: 7}
                },
                info: {
                    background: {
                        font: {
                            height: 12
                        },
                        getFont: function () {
                            return this.font.height + 'px ' + comicVM.PanelPainter.options.style.font.face;
                        },
                        lineDash: [6, 10]
                    },
                    character: {
                        lineHeight: 12,
                        font: {
                            height: 10
                        },
                        getFont: function () {
                            return this.font.height + 'px ' + comicVM.PanelPainter.options.style.font.face;
                        }
                    },
                    panel: {
                        id: {
                            lineWidth: 2,
                            font: {
                                height: 12
                            },
                            getFont: function () {
                                return this.font.height + 'px ' + comicVM.PanelPainter.options.style.font.face;
                            }
                        },
                        plotItemCount: {
                            lineWidth: 2,
                            font: {
                                height: 12
                            },
                            getFont: function () {
                                return this.font.height + 'px ' + comicVM.PanelPainter.options.style.font.face;
                            }
                        }
                    }
                }
            }
        };

        this.options.paintStrategy.apply(this);

        PanelMetaInfoPainter.options = this.options;
        PanelTextPainter.options = this.options;
    },

    beforePaintScene: function (scene) {
    },

    paint: function (panel) {

        panel.freeSpaceTop = 0;  // needed to align text boxes and bubbles

        this.setupCtx(getCtx());  // remove clip and set new save point

        if ((OPTIONS.PAINTER.paintSinglePanel < 0 && !OPTIONS.PAINTER.paintSingleBackground )
            || panel.id === OPTIONS.PAINTER.paintSinglePanel
            || OPTIONS.PAINTER.paintSingleBackground === panel.bgr.qualifier) {

			getCtx().scale(OPTIONS.PAGE.scale, OPTIONS.PAGE.scale);

            this.setClip(panel);
            this.paintBackground(panel);
            this.paintCharacters(panel);

            PanelTextPainter.paint(panel);

            this.paintFrame(panel);

            PanelMetaInfoPainter.paint(panel);

        } else {
            this.setClip(panel);
            this.paintFrame(panel);
        }
    },

    setupCtx: function (ctx) {
        ctx.restore();
        ctx.save();
        ctx.lineWidth = this.options.style.lineWidth;
        ctx.font = this.options.style.getFont();
    },

    setClip: function (panel) {
        getCtx().beginPath();
        getCtx().moveTo(panel.dim.x, panel.dim.y);
        getCtx().lineTo(panel.dim.x + panel.dim.w, panel.dim.y);
        getCtx().lineTo(panel.dim.x + panel.dim.w, panel.dim.y + panel.dim.h);
        getCtx().lineTo(panel.dim.x, panel.dim.y + panel.dim.h);
        getCtx().clip();
    },

    paintFrame: function (panel) {
        getCtx().save();
        getCtx().lineWidth =
            (this.highlighted.panelId === panel.id)
                ? this.options.style.lineWidth.highlighted.frame
                : this.options.style.lineWidth.frame;
        getCtx().strokeStyle =
            (this.highlighted.panelId === panel.id)
                ? this.options.color.info.frame.highlighted
                : this.options.color.frame;

        rect(panel.dim.x, panel.dim.y, panel.dim.w, panel.dim.h, getCtx().strokeStyle);

        this.paintGrid(panel);

        getCtx().restore();
    },

    paintGrid: function (panel) {
        if (!this.options.paint.grid) {
            return;
        }

        getCtx().save();

        var characterSize = Math.floor(panel.bgr.defaults.characterWidth * panel.getZoom());
        var lineCount = {
            x: characterSize !== 0 ? Math.floor(panel.dim.w / characterSize) : 0,
            y: characterSize !== 0 ? Math.floor(panel.dim.h / characterSize) : 0
        };
        var offset = {
            x: characterSize !== 0 ? (panel.dim.w % characterSize) / 2 : 0,
            y: characterSize !== 0 ? (panel.dim.h % characterSize) / 2 : 0
        };

        // make sure there is one square perfectly in the middle
        if (Math.floor(panel.dim.w / characterSize) % 2 === 0) {
            offset.x += characterSize / 2;
        }
        if (Math.floor(panel.dim.h / characterSize) % 2 === 0) {
            offset.y += characterSize / 2;
        }

        getCtx().lineWidth = this.options.style.lineWidth.grid;
        for (var i = 0; i < lineCount.x; i++) {
            line({
                    x: panel.dim.x + offset.x + i * characterSize,
                    y: panel.dim.y
                },
                {
                    x: panel.dim.x + offset.x + i * characterSize,
                    y: panel.dim.y + panel.dim.h
                },
                this.options.color.grid);
        }
        for (var i = 0; i < lineCount.y; i++) {
            line({
                    x: panel.dim.x,
                    y: panel.dim.y + offset.y + i * characterSize
                },
                {
                    x: panel.dim.x + panel.dim.w,
                    y: panel.dim.y + offset.y + i * characterSize
                },
                this.options.color.grid);
        }
        getCtx().restore();
    },

    getBackgroundDim: function (panel) {
        if (panel.getActingCharacterNames().length > 0) {
            var charactersBBox = panel.getCharactersBackgroundBBox();
            return {
                x: charactersBBox.x + panel.bgr.defaults.characterPos.x * panel.getZoom(),
                y: charactersBBox.y + panel.bgr.defaults.characterPos.y * panel.getZoom(),
                w: panel.bgr.defaults.bgrDim.w * panel.getZoom(),
                h: panel.bgr.defaults.bgrDim.h * panel.getZoom()
            };
        } else {
            var bgrDim = panel.bgr.getBgrDimensions({w: panel.dim.w, h: panel.dim.h});
            return {
                x: panel.dim.x - (bgrDim.w - panel.dim.w) / 2,
                y: panel.dim.y - (bgrDim.h - panel.dim.h) / 2,
                w: bgrDim.w,
                h: bgrDim.h
            };
        }
    },

    paintBackground: function (panel) {
        if (panel.getBgrImg() && !panel.getBgrImg().dataset.empty && this.options.paint.background) {
            var bgrDim = this.getBackgroundDim(panel);
            if (comicVM.Editor.paintOptionPrint === comicVM.Editor.PAINT_OPTION.PRINT.EDITOR || comicVM.Editor.editMode === true) {
                if (comicVM.Editor.mouseOverPanelId === panel.id || this.highlighted.panelId === panel.id) {
                    getCtx().globalAlpha = 0.7;
                } else {
                    getCtx().globalAlpha = 0.2;
                }
            }
            drawImageYellowIf(panel.getBgrImg(), bgrDim, this.options.paint.yellowPrint);
            getCtx().globalAlpha = 1;
        }
    },

    /**
     * (!) adds property .pos to all characters
     */
    paintCharacters: function (panel) {

        this.paintCharactersBBoxes(panel);

        if (panel.hasSingleImageQualifier()) {
            this.paintSingleImage(panel);
        }

        var self = this;
        $.each(PlotParser.getCharacterNames(panel.isBgrReverse()), function (index, name) {
            self.paintCharacter(panel, name);
        });
    },

    paintCharacter: function (panel, name) {
        var character = panel.getCharacterByName(name);
        character.pos = panel.getCharactersPanelPositions()[name];
        this.paintCharacterImage(panel, character);
        PanelMetaInfoPainter.paintCharacterInfo(panel, character);
    },

    paintCharactersBBoxes: function (panel) {
        getCtx().save();
        getCtx().lineWidth = this.options.style.lineWidth.character.bbox;
        if (this.options.paint.characters.bbox) {
            rectFromDim(panel.getCharactersPanelBBox(), this.options.color.characters.bbox.line, this.options.color.characters.bbox.fill);
        }
        if (this.options.paint.characters.active.bbox) {
            rectFromDim(panel.getActingCharactersBBox(), this.options.color.characters.active.bbox.line, this.options.color.characters.active.bbox.fill);
        }
        getCtx().restore();
    },

    /**
     * Paints a single image for all characters
     *
     * @param panel
     */
    paintSingleImage: function (panel) {

        var img = panel.getCharacterImage('all');
        if (img && !tagStore.isEmpty(img)) {
            var dim = panel.getCharactersPanelBBox();
            dim.y += dim.h / 2;
            dim.h = 1;  // width is important, ignore height
            var bitmapDim = getImageDimensions(img, dim);
            alignCentered(bitmapDim, dim);

            drawImageYellowIf(img, bitmapDim, this.options.paint.yellowPrint);

            if (this.options.paint.character.bitmapBorder) {
                getCtx().save();
                getCtx().lineWidth = this.options.style.lineWidth * 0.5;
                getCtx().setLineDash(this.options.style.lineWidth.bitmap.lineDash)
                rectFromDim(bitmapDim, this.options.color.character.bitmap.border);
                getCtx().restore();
            }

            // calc each individual character.bitmapDimBubble for bubble painting
            for (var i = 0; i < panel.allCharacterList.length; i++) {
                var character = panel.allCharacterList[i];
                if (panel.isActingCharacter(character.who)) {
                    character.bitmapDimBubble = pos2dim(character.pos);
                }
            }
        }
    },

    calcBitmapDim: function (panel, character) {
        var img = panel.getCharacterImage(character.who);
        var bitmapDim = getImageDimensions(img, pos2dim(character.pos));
        bitmapDim = panel.getAdjustedImageDimensions(bitmapDim, character.who);

        if (panel.getImagePosition(character.who)) {
            character.bitmapDimBubble = pos2dim(character.pos); // with custom image positions the bubble pointer reference is the plain character pos
            character.bitmapDim = pos2dim(panel.getImagePosition(character.who));
        } else {
            alignCentered(bitmapDim, pos2dim(character.pos));
            character.bitmapDimBubble = bitmapDim;// without custom image position the bubble pointer reference is the dimension of the bitmap image
            character.bitmapDim = bitmapDim;
        }
    },

    paintCharacterImage: function (panel, character) {
        var img = panel.getCharacterImage(character.who);

        this.calcBitmapDim(panel, character);

        if (!this.options.paint.character.bitmap || this.options.paint.character.box) {
            this.paintCharacterBox(panel, character);
        }
        if (img) {
            // paint characters if properly visible
            var pos = character.pos;
            if (pos.x + pos.size > panel.dim.x + pos.size * this.options.style.character.minVisibility
                && pos.x < panel.dim.x + panel.dim.w - pos.size * this.options.style.character.minVisibility) {

                if (true // comicVM.Editor.paintOptionPrint !== comicVM.Editor.PAINT_OPTION.PRINT.YELLOW
                    && !panel.hasSingleImageQualifier()
                    && !tagStore.isEmpty(img)
                ) {
                    getCtx().save();
                    this.paintCharacterBitmap(img, character.bitmapDim);
                    if (this.options.paint.character.bitmapBorder) {
                        getCtx().save();
                        getCtx().lineWidth = this.options.style.lineWidth.bitmapBorder;
                        rectFromDim(character.bitmapDim, this.options.color.character.bitmapBorder);
                        getCtx().restore();
                    }
                    getCtx().restore();
                }
            }
        }
    },

    paintCharacterBitmap: function (img, bitmapDim) {
        drawImageYellowIf(img, bitmapDim, this.options.paint.yellowPrint);
    },

    paintCharacterBox: function (panel, character) {
        var pos = character.pos,
            color = {
                line: panel.isActingCharacter(character.who) ? this.options.color.character.active.box.line : this.options.color.character.box.line,
                fill: panel.isActingCharacter(character.who) ? this.options.color.character.active.box.fill : this.options.color.character.box.fill
            };

        getCtx().save();
        getCtx().lineWidth = this.options.style.lineWidth.character.box;

        rect(
            pos.x,
            pos.y,
            pos.size,
            pos.size,
            color.line
        );

        getCtx().restore();
    }
};