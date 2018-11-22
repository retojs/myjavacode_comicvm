var PanelMetaInfoPainter = {

    options: {},

    paint: function (panel) {
        this.paintPlotItemCount(panel);
        this.paintPanelId(panel);
        this.paintBackgroundInfo(panel);
        this.paintBackgroundImageSize(panel);
    },

    paintCharacterInfo: function (panel, character) {
        if (!this.options.paint.info.character) {
            return;
        }

        var options = {
                color: this.options.color.info.character,
                style: this.options.style.info.character
            },

            name = character.who,
            nameWidth = getCtx().measureText(name).width,
            tags = panel.getCharacterTags(character.who).filter(function (tag) {
                return tag != name && tag != panel.place && tag != panel.layoutGet.bgrQualifier(); // no need to repeat these...
            }),
            pos = character.pos;

        getCtx().save();
        getCtx().fillStyle = options.color.text;
        getCtx().font = options.style.getFont();
        getCtx().fillText(name,
            pos.x - (nameWidth / 2) + pos.size / 2,
            pos.y + pos.size + options.style.lineHeight);

        var offsetY = tags.length * options.style.lineHeight;
        for (i in tags) {
            offsetY -= options.style.lineHeight;
            var tagWidth = getCtx().measureText(tags[i]).width;
            getCtx().fillText(tags[i],
                pos.x - (tagWidth / 2) + pos.size / 2,
                pos.y - offsetY - 6
            );
        }

        getCtx().restore();

    },

    /**
     * paint the background qualifiers and (optional) the image path at the bottom of the frame
     *
     * @param panel
     */
    paintBackgroundInfo: function (panel) {
        if (!this.options.paint.info.background
            || (panel.getBgrImg() && panel.getBgrImg().dataset.empty)) {
            return;
        }

        getCtx().save();
        getCtx().font = this.options.style.info.background.getFont();

        var options = {
                color: this.options.color.info.background,
                style: this.options.style.info.background
            },

            bgrInfo = panel.place + (panel.layoutGet.bgrQualifier() ? "." + panel.layoutGet.bgrQualifier() : "" ),
            bgrInfoRev = bgrInfo + (panel.isBgrReverse() ? " (reverse)" : ""),

            x = panel.dim.x + panel.dim.w / 2 - getCtx().measureText(bgrInfoRev).width / 2,
            y = panel.dim.y + panel.dim.h - 6;

        getCtx().fillStyle = options.color.fill;
        getCtx().fillRect(panel.dim.x, y - options.style.font.height, panel.dim.w, options.style.font.height + 6);
        getCtx().fillStyle = options.color.text;
        getCtx().fillText(bgrInfoRev, x, y);
        if (panel.getBgrImg()) {
            var imgSrc = panel.getBgrImgName();
            if (imgSrc.substring(0, imgSrc.lastIndexOf(".")) !== bgrInfo) { // only paint img src if it differs from bgrInfo
                var x = panel.dim.x + 4,
                    y = panel.dim.y + panel.dim.h - 8 - options.style.font.height;
                getCtx().fillStyle = options.color.fill;
                getCtx().fillText(imgSrc, x, y);
            }
        }
        getCtx().restore();
    },

    paintBackgroundImageSize: function (panel) {
        if (!this.options.paint.info.bgrImageSize) {
            return;
        }
        var bgrImg = panel.getBgrImg();
        if (bgrImg && panel.layoutGet.bgrQualifier() === comicVM.PanelPainter.options.paint.info.bgrImageSize) {

            var bgrDim = comicVM.PanelPainter.getBackgroundDim(panel);

            rect(
                bgrDim.x, bgrDim.y, bgrDim.w, bgrDim.h,
                this.options.color.info.background.image.line,
                this.options.color.info.background.image.fill,
                getOverlayCtx()
            );
            line(
                {x: bgrDim.x, y: bgrDim.y},
                {x: bgrDim.x + bgrDim.w, y: bgrDim.y + bgrDim.h},
                this.options.color.info.background.image.line,
                getOverlayCtx()
            );
            line(
                {x: bgrDim.x, y: bgrDim.y + bgrDim.h},
                {x: bgrDim.x + bgrDim.w, y: bgrDim.y},
                this.options.color.info.background.image.line,
                getOverlayCtx()
            );
            var circleFillStyle = null;
            if (panel.bgr.panels.smallestCharacter.panel && panel.id === panel.bgr.panels.smallestCharacter.panel.id) {
                circleFillStyle = this.options.color.info.background.image.line;
            }
            circle(
                bgrDim.x + bgrDim.w / 2,
                bgrDim.y + bgrDim.h / 2,
                15,
                this.options.color.info.background.image.line,
                circleFillStyle,
                getOverlayCtx());
        }
    },

    paintPlotItemCount: function (panel, ctx) {
        if (!this.options.paint.info.plotItemCount) {
            return;
        }

        var ctx = (ctx || getCtx()),
            options = {
                color: this.options.color.info.panel.plotItemCount,
                style: this.options.style.info.panel.plotItemCount
            },
            text = "plot items: " + panel.plotItems.length,
            textWidth = ctx.measureText(text).width,
            offset = {x: 2, y: 2}, // offset from panel corner outside
            width = textWidth,
            height = options.style.font.height + 8;

        ctx.save();
        ctx.lineWidth = options.style.lineWidth;

        rect(
            panel.dim.x + panel.dim.w - offset.x - width,
            panel.dim.y + offset.y,
            width,
            height,
            options.color.line,
            options.color.fill
        );

        ctx.font = options.style.getFont();
        ctx.fillStyle = options.color.text;
        ctx.fillText(
            text,
            panel.dim.x + panel.dim.w - offset.x - width + 8,
            panel.dim.y + options.style.font.height + 1 + offset.y
        );
        ctx.restore();
    },

    paintPanelId: function (panel, ctx) {
        if (!this.options.paint.info.panel.id && comicVM.PanelPainter.highlighted.panel !== panel.id) {
            return;
        }

        var ctx = (ctx || getCtx()),
            options = {
                paint: this.options.paint.info.panel,
                color: this.options.color.info.panel.id,
                style: this.options.style.info.panel.id
            },
            text = "" + panel.id,
            textWidth = ctx.measureText(text).width,
            offset = {x: 2, y: 2}, // offset from panel corner outside
            width = textWidth + 16,
            height = options.style.font.height + 10;

        ctx.save();
        ctx.lineWidth = options.style.lineWidth;
        rect(
            panel.dim.x + offset.x,
            panel.dim.y + offset.y,
            width,
            height,
            options.paint.border ? options.color.line : null,
            options.color.fill,
            ctx
        );

        ctx.font = options.style.getFont();
        ctx.fillStyle = options.color.text;
        ctx.fillText(text,
            panel.dim.x + 8 + offset.x,
            panel.dim.y + options.style.font.height + 3 + offset.y
        );
        ctx.restore();
    }
};
