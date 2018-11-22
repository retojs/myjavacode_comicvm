/**
 * The method properties if this paint strategy are added to comicVM.PanelPainter or override existing methods resp.
 *
 * - paint
 * - paintBackground
 * - paintCharacterBox
 * - paintCharactersBBoxes
 *
 *   This paint strategy creates DOM elements instead which are then made draggable and resizable.
 *
 */

// TODO Würde nicht ein objekt mit prototype PanelPainter zum selben Ziel führen wie die PaintStrategy?

;var comicVM = comicVM || {};

comicVM.EditorPanelPainterConstructor = function () {
};
comicVM.EditorPanelPainterConstructor.prototype = comicVM.PanelPainter;
comicVM.EditorPanelPainter = new comicVM.EditorPanelPainterConstructor();

// and now overwrite the methods if required:

_.extend(comicVM.EditorPanelPainter, {
    sceneOverlay: null,
    sceneOverlayCanvas: null

// etc.

});

// ? but how would you enable it ?
//   the initial paint would need to be calling EditorPanelPainter or PanelPainter


var EditorPaintStrategy = {

    PAINT_STRATEGY: 'EDITOR', // marker

    strategyEnableCondition: function () {
        return comicVM.Editor.editMode === true
    },

    apply: PaintStrategy.apply,


    sceneOverlay: null,
    sceneOverlayCanvas: null,

    newSceneOverlay: function (scene, paintBackground) {
        if (this.sceneOverlay) {
            $('#sceneOverlay').remove();
        }
        var imageDivDim = getImageDivDim(paintBackground);
        this.sceneOverlayCanvas = $('<canvas width="' + imageDivDim.w + '" height="' + imageDivDim.h + '"></canvas>');
        this.sceneOverlay = $('<div></div>');
        this.sceneOverlay.attr('id', 'sceneOverlay');
        setCssPosition(this.sceneOverlay, {
            left: 0,
            top: 0,
            width: imageDivDim.w,
            height: imageDivDim.h,
            zIndex: OPTIONS.Z_INDEX.sceneOverlay
        });
        this.sceneOverlay.append(this.sceneOverlayCanvas);
        $('#image').append(this.sceneOverlay);

        clearCanvas(null, this.sceneOverlayCanvas[0]);
        this.showSceneOverlay();
        return {
            $overlay: this.sceneOverlay,
            canvas: this.sceneOverlayCanvas[0],
            ctx: this.sceneOverlayCanvas[0].getContext('2d')
        }
    },

    createHelperDiv: function () {
        if (OPTIONS.PAINTER.displayPositionHelper) {

            var cssPosHelper = $('<div>helper</div>');
            cssPosHelper.attr('id', OPTIONS.PAINTER.HELPER.ID);
            $('#image').append(cssPosHelper);
            var css = {
                position: 'absolute',
                width: 66,
                height: 33,
                zIndex: OPTIONS.Z_INDEX.helperDiv,
                textAlign: 'center',
                lineHeight: '30px'
            };
            cssPosHelper.css($.extend(css, {border: '2px solid #0c0'}));
        }
    },

    beforePaintScene: function (scene) {

        if (comicVM.EditorElements.hasEditorElements()) {  // setup drag containment adjustment
            $('#story').off('scroll');
            $(document).off('scroll');
            $('#story').scroll(DragResize.setContainment);
            $(document).scroll(DragResize.setContainment);
        }

        this.newSceneOverlay(scene);

        this.createHelperDiv();
    },

    showSceneOverlay: function () {
        if (!this.sceneOverlay) {
            this.newSceneOverlay();
        }
        this.sceneOverlay.css({
            display: 'inline',
            opacity: 1,
            zIndex: OPTIONS.Z_INDEX.sceneOverlay
        });
    },

    hideSceneOverlay: function () {
        if (this.sceneOverlay) {
            this.sceneOverlay.css({
                display: 'none'
            });
        }
    },

    clearSceneOverlay: function () {
        clearCanvas(null, this.sceneOverlayCanvas[0]);
    },

    repaint: function (panel, editorElem) {
        this.hideSceneOverlay();
        switch (comicVM.Editor.editTarget) {
            case comicVM.Editor.id.PANEL:
                if (editorElem.type !== comicVM.EditorElements.TYPE_BACKGROUND) {
                    this.repaintPanel(panel);
                    break;
                }
            case comicVM.Editor.id.BGR:
                if (comicVM.Editor.editTarget !== comicVM.Editor.id.SCENE) {
                    this.repaintPanelsOfBackground(panel.bgr);
                    break;
                }
            case comicVM.Editor.id.SCENE:
                this.repaintPanelsOfScene(panel.scene);
        }
    },

    repaintPanel: function (panel) {
        this.sceneOverlay = null;
        comicVM.EditorElements.removeEditorElements(panel);
        panel.scene.repaintSinglePanel(panel);
        this.afterPaint();
    },

    repaintPanelsOfBackground: function (bgr) {
        if (typeof bgr === 'string') {
            bgr = ComicVM.scene.getBackground(bgr);
        }
        for (var i in bgr.panels.all) {
            bgr.panels.all[i].recalcPositions();
        }
        ComicVM.scene.fitBackgrounds();
        for (i in bgr.panels.all) {
            this.repaintPanel(bgr.panels.all[i]);
        }
    },

    repaintPanelsOfScene: function (scene) {
        for (var i in LayoutParser.panels) {
            LayoutParser.panels[i].recalcPositions();
        }
        ComicVM.scene.fitBackgrounds();
        for (i in LayoutParser.panels) {
            this.repaintPanel(LayoutParser.panels[i]);
        }
    },

    /**
     * Overwrites comicVM.PanelPainter.paint
     *
     * @param panel
     */
    paint: function (panel) {
        comicVM.EditorElements.removeEditorElements(panel);
        this.super_paint(panel);
        this.afterPaint();
    },

    afterPaint: function () {
        comicVM.EditorElements.editTargetChanged(comicVM.Editor.editTarget);
    },

    /**
     * Overwrites comicVM.PanelPainter.paintBackground
     */
    paintBackground: function (panel) {
        this.super_paintBackground(panel);

        var bgrDim = this.getBackgroundDim(panel);
        var bgr = comicVM.EditorElements.createEditorElementForBackground(panel, bgrDim, comicVM.EditorElements.border.bgr);

        DragResize.draggableBackground(panel, bgr, panel.dim);
    },

    /**
     * overwrites comicVM.PanelPainter.paintCharactersBBoxes
     */
    paintCharactersBBoxes: function (panel) {

        // additionally paint active characters at their initial position to explain the layout process (align active to center)
        for (var characterName in panel.actingCharacterPositions) {

            var characterDim = pos2dim(panel.actingCharacterPositions[characterName]);

            var activeCharElem = comicVM.EditorElements.createEditorElementForCharacter(
                panel,
                characterDim,
                comicVM.EditorElements.border.char.box.active.double,
                characterName + comicVM.EditorElements.ACTIVE_DOUBLE_SUFFIX,
                comicVM.EditorElements.TYPE_CHARACTER_ACTINGDOUBLE);

            DragResize.draggableResizableCharacter(panel, activeCharElem, characterDim, characterName);
        }

        if (hasSize(panel.getActingCharactersBBox())) {
            var activeBBox = comicVM.EditorElements.createEditorElementForCharacterBBox(
                panel,
                panel.getActingCharactersBBox(),
                comicVM.EditorElements.border.bbox.active,
                comicVM.EditorElements.TYPE_BBOX_ACTIVE
            );
            DragResize.draggableBBox(panel, activeBBox, panel.getActingCharactersBBox());
        }
        if (hasSize(panel.getCharactersPanelBBox())) {
            var bbox = comicVM.EditorElements.createEditorElementForCharacterBBox(
                panel,
                panel.getCharactersPanelBBox(),
                comicVM.EditorElements.border.bbox, comicVM.EditorElements.TYPE_BBOX
            );
            DragResize.draggableBBox(panel, bbox, panel.getCharactersPanelBBox());
        }
    },

    /**
     * Overwrites comicVM.PanelPainter.paintCharacterBox
     */
    paintCharacterBox: function (panel, character) {
        var border = panel.isActingCharacter(character.who) ? comicVM.EditorElements.border.char.box.active : comicVM.EditorElements.border.char.box;
        var box = comicVM.EditorElements.createEditorElementForCharacter(panel, pos2dim(character.pos), border, character.who);
        DragResize.draggableResizableCharacter(panel, box, pos2dim(character.pos), character.who);
    },

    paintCharacterBitmap: function (img, bitmapDim) {
        // don't paint image again
    },

    /**
     * visualizes how the background image size is determined: it has to cover all panels where it is used
     *
     * @param panel
     * @param ctx
     */
    paintBackgroundWithAllPanels: function (panel, options) {
        options || (options = {});

        if (options.paintBackground) {
            this.newSceneOverlay(panel.scene, true);
        }
        this.showSceneOverlay();
        this.clearSceneOverlay();

        var ctx = this.sceneOverlayCanvas[0].getContext('2d'),
            pageOffset = getStoryPageOffset(panel.pageNr),
            charactersBBox = (function calculateCharactersBackgroundBBox() {
                panel.bgr.panels.all.map(function (panel) {
                    panel.recalcPositions();
                });
                panel.bgr.fitBackground(panel.scene);
                return panel.getCharactersBackgroundBBox();
            })();

        ctx.save();
        ctx.translate(pageOffset.x, pageOffset.y);

        if (options.paintBackground) {
            // transform the canvas such that the background image will
            // be in the top center and fill the canvas width

            var pageDim = getImageDivDim(true),
                bgrDim = this.getBackgroundDim(panel),
                scale = (pageDim.w - (OPTIONS.PAGE.pagePadding.x * 2)) / bgrDim.w;

            comicVM.PanelPainter.setupCtx(ctx);
            ctx.translate(OPTIONS.PAGE.pagePadding.x, OPTIONS.PAGE.pagePadding.y);
            ctx.scale(scale, scale);
            ctx.translate(-bgrDim.x, -bgrDim.y);
        }

        paintBackgroundImage(panel, ctx, options, this.options);

        for (var panelId in panel.bgr.panels.bboxPanelDim) {

            var panelDim = paintPanelRelative(panel, panelId, ctx, this.options);

            if (options.paintBackground) {  // paint characters and bubbles at the relative panel-position
                var otherPanel = LayoutParser.getPanelObject(panelId);

                ctx.save();
                ctx.translate(panelDim.x, panelDim.y);
                ctx.scale(panel.getZoom() / otherPanel.getZoom(), panel.getZoom() / otherPanel.getZoom());
                ctx.translate(-otherPanel.dim.x, -otherPanel.dim.y);
                ctx.globalAlpha = 0.5;
                usingCanvas(this.sceneOverlayCanvas[0], function () {
                    comicVM.PanelPainter.paintCharacters(otherPanel);
                    PanelTextPainter.paintBubbles(otherPanel);
                });
                ctx.restore();

            } else if (panelId !== ('' + panel.id)) {
                // paint each panel at its original position when painting the whole page
                paintPanelAbsolute(panelId, panel, ctx, options);
            }
        }

        ctx.restore();

        this.showSceneOverlay();

        function _transform(dim) { // transform panel frames such that this panel has its true size and position
            return {
                x: dim.x * panel.getZoom() + charactersBBox.x,
                y: dim.y * panel.getZoom() + charactersBBox.y,
                w: dim.w * panel.getZoom(),
                h: dim.h * panel.getZoom()
            };
        }

        /**
         * Paint each panel relative to the characters position (panelDim)
         *
         * @param ctx
         * @returns: The panel's dimensions
         */
        function paintPanelRelative(panel, panelId, ctx, options) {
            var panelDim = _transform(panel.bgr.panels.bboxPanelDim[panelId]);

            ctx.save();
            ctx.lineWidth = 3;
            rectFromDim(
                panelDim,
                options.color.info.frame.relative,
                null,
                ctx
            );

            PanelMetaInfoPainter.paintPanelId({
                id: panelId,
                dim: panelDim
            }, ctx);
            ctx.restore();

            return panelDim;
        }

        function paintPanelAbsolute(panelId, panel, ctx, options) {

            if (!comicVM.PanelPainter.options.paint.yellowPrint && panelId !== ('' + panel.id)) {

                var lineColor = comicVM.PanelPainter.options.color.info.frame.lines,
                    frameColor = comicVM.PanelPainter.options.color.info.frame.absolute,

                // highlight the panel at its real position (thatPanelDim)

                    thatPanel = LayoutParser.getPanelObject(panelId),
                    pageOffset = getStoryPageOffset(thatPanel.pageNr - panel.pageNr),
                    thatPanelDim = addOffset(thatPanel.dim, pageOffset);

                thatPanelDim = addOffset(
                    thatPanelDim,
                    {x: -25, y: 0}  // obviously we need to subtract the getPageOffset x value, for whatever reasons...
                );

                ctx.save();
                ctx.lineWidth = comicVM.EditorElements.border.bgr.width;

                rectFromDim( // paint the original panel
                    thatPanelDim,
                    frameColor,
                    null,
                    ctx
                );

                // connect the two panel frames with lines from corner to corner

                ctx.lineWidth = 1;
                line(
                    {x: panelDim.x, y: panelDim.y},
                    {x: thatPanelDim.x, y: thatPanelDim.y},
                    lineColor,
                    ctx
                );
                line(
                    {x: panelDim.x + panelDim.w, y: panelDim.y},
                    {x: thatPanelDim.x + thatPanelDim.w, y: thatPanelDim.y},
                    lineColor,
                    ctx
                );
                line(
                    {x: panelDim.x, y: panelDim.y + panelDim.h},
                    {x: thatPanelDim.x, y: thatPanelDim.y + thatPanelDim.h},
                    lineColor,
                    ctx
                );
                line(
                    {x: panelDim.x + panelDim.w, y: panelDim.y + panelDim.h},
                    {x: thatPanelDim.x + thatPanelDim.w, y: thatPanelDim.y + thatPanelDim.h},
                    lineColor,
                    ctx
                );

                ctx.restore();
            }
        }

        function paintBackgroundImage(panel, ctx, options, panelOptions) {
            var bgrDim = comicVM.PanelPainter.getBackgroundDim(panel);

            ctx.save();
            ctx.globalAlpha = options.paintBackground ? (panelOptions.paint.yellowPrint ? 0.75 : 1.0 ) : 0.5;
            drawImageYellowIf(panel.getBgrImg(), bgrDim, comicVM.PanelPainter.options.paint.yellowPrint, ctx);
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = panelOptions.style.lineWidth.background;
            ctx.setLineDash(panelOptions.style.info.background.lineDash);

            rectFromDim(bgrDim, panelOptions.color.info.background.image.line, null, ctx);

            ctx.restore();
        }
    }
};
