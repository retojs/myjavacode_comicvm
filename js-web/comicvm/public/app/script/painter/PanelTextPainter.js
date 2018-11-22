var PanelTextPainter = {

    options: {},

    paint: function (panel) {
        this.paintTolds(panel, this.isLastPlotItem(panel.plotItems[panel.plotItems.length - 1]));
        this.paintBubbles(panel);
        this.paintDescriptions(panel, panel.bubbleList.length > 0);
    },

    paintTolds: function (panel, isLastPlotItem) {

        for (var i = 0; i < Math.min(panel.toldList.length, 2); i++) {
            var told = panel.toldList[i];

            var maxW = panel.dim.w - this.options.style.told.margin.x * 2;
            var lines = this.getConfinedLines(told, maxW - this.options.style.bubble.padding.y * 2);
            var w = lines.length == 1 ? this.getBoxWidth(lines) : maxW;
            var h = lines.length * this.options.style.font.lineHeight + this.options.style.told.padding.y * 2;
            toldItem = {
                lines: lines,
                w: w,
                h: h
            };

            var isEpilog = ((i + 1) === panel.toldList.length) && isLastPlotItem;

            if (!isEpilog) {
                panel.freeSpaceTop += h + this.options.style.told.margin.y * 2;
            }

            var pos = {
                x: isEpilog ?
                panel.dim.x + panel.dim.w - w - this.options.style.told.margin.x // align right
                    :
                panel.dim.x + this.options.style.told.margin.x, // align left
                y: isEpilog ?
                panel.dim.y + panel.dim.h - this.options.style.told.margin.y - toldItem.h
                    :
                panel.dim.y + this.options.style.told.margin.y
            };
            this.paintTold(toldItem, pos);
        }

        // display warning if there are more invisible tellings
        if (panel.toldList.length > 2) {
            var more = ".!.";
            var moreW = getCtx().measureText(more).width;
            getCtx().fillStyle = this.options.color.text;
            getCtx().fillText("",
                panel.dim.x + panel.dim.w - moreW,
                panel.dim.y + panel.dim.h);
        }
    },

    paintTold: function (toldItem, pos) {

        getCtx().save();
        getCtx().lineWidth = this.options.style.lineWidth.told.border;

        rect(
            pos.x,
            pos.y,
            toldItem.w,
            toldItem.h,
            this.options.color.text,
            "#fff"
        );

        // print text


        getCtx().fillStyle = this.options.color.text;
        for (var l = 0; l < toldItem.lines.length; l++) {
            var line = toldItem.lines[l];
            getCtx().fillText(
                line,
                pos.x + this.options.style.told.padding.x,
                pos.y + this.options.style.told.padding.y + this.options.style.font.lineHeight * (l + this.options.style.font.baseLine)
            );
        }
        getCtx().restore();
    },

    paintBubbles: function (panel) {

        // calculate dimension of single bubbles
        var bubbleItems = [];
        for (var i = 0; i < panel.bubbleList.length; i++) {
            var bubble = panel.bubbleList[i];

            var maxLW = this.getMaxLineWidth(panel, bubble.says);
            var lines = this.getConfinedLines(bubble.says, maxLW);
            var w = this.getBoxWidth(lines);
            var h = lines.length * this.options.style.font.lineHeight + this.options.style.bubble.padding.y * 2;
            bubbleItems[i] = {
                characterName: bubble.who,
                lines: lines,
                w: w,
                h: h
            };
        }

        // layout bubbles in lines
        var availableWidth = panel.dim.w - this.options.style.bubble.margin.x * 2;
        var bubbleLines = [];
        var currentLine = 0;
        bubbleLines[currentLine] = [];
        for (var i = 0; i < bubbleItems.length; i++) {
            var bubble = bubbleItems[i];
            if (this.getTotalWidth(bubbleLines[currentLine], this.options.style.bubble.margin.x) + bubble.w > availableWidth) {
                // new line of bubbles
                bubbleLines[++currentLine] = [];
            }
            bubbleLines[currentLine].push(bubble);
        }

        // paint bubbles

        var CENTER = "center"; // bubbles are aligned to center
        var LEFTRIGHT = "left-right"; // bubbles are alternatingly aligned left and right
        var ALIGN_LEFT = "alignLeft";
        var ALIGN_RIGHT = "alignRight";

        // simplistic approach:
        //  if there is more than one line
        //  and the first bubble in the second line is from a different character than the first bubble in the first line,
        //  then align the lines "left-right"
        var layout =
            bubbleLines.length > 1 && typeof bubbleLines[0][0] !== 'undefined' && typeof bubbleLines[1][0] !== 'undefined'
            && bubbleLines[0][0].characterName != bubbleLines[1][0].characterName
                ? LEFTRIGHT : CENTER;

        var align = layout == LEFTRIGHT ? ALIGN_LEFT : null;

        var pos = {
            y: panel.dim.y + panel.freeSpaceTop + this.options.style.bubble.margin.y
        };
        for (var i = 0; i < bubbleLines.length; i++) {
            var bubbleLine = bubbleLines[i];
            pos.x =
                layout == CENTER ?
                panel.dim.x + panel.dim.w / 2 - this.getTotalWidth(bubbleLine, this.options.style.bubble.margin.x) / 2
                    :
                    align == ALIGN_LEFT ?
                    panel.dim.x + this.options.style.bubble.margin.x
                        :
                    panel.dim.x + panel.dim.w - this.options.style.bubble.margin.x - this.getTotalWidth(bubbleLine, this.options.style.bubble.margin.x);

            var maxBubbleHeight = 0;
            for (var b = 0; b < bubbleLine.length; b++) {
                var bubble = bubbleLine[b];
                this.paintBubble(panel, bubble, pos);
                pos.x += bubble.w + this.options.style.bubble.margin.x;
                maxBubbleHeight = bubble.h > maxBubbleHeight ? bubble.h : maxBubbleHeight;
            }
            pos.y += maxBubbleHeight + this.options.style.bubble.margin.x;
            align = align == ALIGN_LEFT ? ALIGN_RIGHT : ALIGN_LEFT;
        }
    },

    paintBubble: function (panel, bubble, pos) {

        log("Panel.paintBubble() pos: { x: " + pos.x + ", y: " + pos.y + " }, bubble: { w: " + bubble.w + ", h: " + bubble.h + " }", "panel.bubble");

        // paint bubble-pointer(s)
        if (Array.isArray(bubble.characterName)) {
            for (var i = 0; i < bubble.characterName.length; i++) {
                this.paintBubblePointer(panel, pos, bubble, bubble.characterName[i]);
            }
        } else {
            this.paintBubblePointer(panel, pos, bubble, bubble.characterName);
        }

        getCtx().save();
        getCtx().lineWidth = this.options.style.lineWidth.bubble.border;

        // paint bubble
        roundRect(
            pos.x,
            pos.y,
            bubble.w,
            bubble.h,
            this.options.style.bubble.radiusX,
            this.options.style.bubble.radiusY,
            this.options.color.bubble.line,
            this.options.color.bubble.fill
        );

        // print text
        getCtx().fillStyle = this.options.color.text;
        for (var l = 0; l < bubble.lines.length; l++) {
            var line = bubble.lines[l];
            var m = getCtx().measureText(line);
            getCtx().fillText(
                line,
                pos.x + this.options.style.bubble.padding.x + (bubble.w - 2 * this.options.style.bubble.padding.x - m.width) / 2,
                pos.y + this.options.style.bubble.padding.y + this.options.style.font.lineHeight * (l + this.options.style.font.baseLine)
            );
        }

        getCtx().restore();
    },

    paintBubblePointer: function (panel, pos, bubble, characterName) {

        var character = panel.getCharacterByName(characterName);

        var from = {
            x: pos.x + bubble.w / 2,
            y: pos.y + bubble.h
        };

        var to = {
            x: character.bitmapDimBubble.x + character.bitmapDimBubble.w / 2,
            y: character.bitmapDimBubble.y - this.options.style.bubble.characterGap
        };

        getCtx().save();
        getCtx().lineCap = 'round';
        getCtx().lineWidth = this.options.style.lineWidth.bubble.pointerHalo;
        this.bubbleQCurve(from, to, character.bitmapDimBubble.w, this.options.color.bubble.pointerHalo);

        getCtx().lineWidth = this.options.style.lineWidth.bubble.pointer;
        this.bubbleQCurve(from, to, character.bitmapDimBubble.w, this.options.color.bubble.line);
        getCtx().restore();
    },

    bubbleQCurve: function (from, to, bubbleWidth, strokeStyle) {
        getCtx().beginPath();
        getCtx().moveTo(from.x, from.y);
        var dx = from.x - to.x;
        var dy = from.y - to.y;
        getCtx().quadraticCurveTo(
            from.x,
            from.y - dy * 0.5,
            to.x + (dx > 0 ? 1 : -1) * Math.min(Math.abs(bubbleWidth / 2), Math.abs(dx * 0.3)),
            to.y);
        getCtx().strokeStyle = strokeStyle;
        getCtx().stroke();
    },

    paintDescriptions: function (panel, onBottom) {
        if (comicVM.Editor.paintOptionPrint !== comicVM.Editor.PAINT_OPTION.PRINT.YELLOW) {
            // calculate layout
            var totalDescHeight = 0;
            var descItems = [];
            for (var i = 0; i < panel.descList.length; i++) {
                var desc = panel.descList[i];

                var w = panel.dim.w - this.options.style.desc.margin.x * 2;
                var lines = this.getConfinedLines(desc, w);
                var h = lines.length * this.options.style.font.lineHeight;
                descItems[i] = {
                    lines: lines,
                    w: w,
                    h: h
                };

                totalDescHeight += h + this.options.style.desc.margin.y;
            }

            // paint
            var dim = {
                x: panel.dim.x + this.options.style.desc.margin.x,
                y: onBottom ?
                panel.dim.y + panel.dim.h - this.options.style.desc.margin.y - totalDescHeight
                    :
                panel.dim.y + this.options.style.desc.margin.y + this.options.style.font.lineHeight + panel.freeSpaceTop
            };
            for (var i = 0; i < descItems.length; i++) {
                dim.w = descItems[i].w;
                dim.h = descItems[i].h;
                this.paintDescription(descItems[i], dim);
                dim.y += descItems[i].h + this.options.style.desc.margin.y;
            }
        }
    },

    paintDescription: function (descItem, dim) {

        if (this.options.paint.descriptions) {
            var whiteAlpha = "rgba(255, 255, 255, 0.5)";
            rect(dim.x - 1, dim.y - 1 - this.options.style.font.lineHeight, dim.w + 2, dim.h + 2, null, whiteAlpha); // white background for readability
            getCtx().fillStyle = this.options.color.descriptions;
            for (var l = 0; l < descItem.lines.length; l++) {
                var line = descItem.lines[l];
                log("Panel.paintDescription() line " + l + ": " + line + ", dim: { x:" + dim.x + ", y: " + dim.y + "}", "panel");
                getCtx().fillText(
                    line,
                    dim.x,
                    dim.y + this.options.style.font.lineHeight * l - 2);
            }
        }
    },

    /**
     * Returns the maximum line width (restricted by panel width and options.bubble.maxWidthHeightRatio)
     * and the best line width (all lines have equal length)
     *
     * @param panel
     * @param text
     * @returns {{best: number, max: number}}
     */
    getMaxLineWidth: function (panel, text) {

        var totalWidth = getCtx().measureText(text).width * 1.1; // give some extra space for line breaks
        var lineCount = 0;
        var maxLineWidth = 0;
        var panelWidth = (panel.dim.w - this.options.style.bubble.padding.x * 2 - this.options.style.bubble.margin.x * 2);
        while (lineCount == 0 || (totalWidth / lineCount > maxLineWidth && lineCount < 4)) {
            lineCount++;
            // bubble should not be longer than options.bubble.maxWidthHeightRatio times its heights
            var maxLineWidthPercents = Math.min(1, (lineCount * this.options.style.font.height * this.options.style.bubble.maxWidthHeightRatio) / panelWidth);
            maxLineWidth = maxLineWidthPercents * panelWidth;
        }
        var bestLineWidth = totalWidth / lineCount; // try to get lines of equal length if more than one is needed.
        return {
            best: bestLineWidth - this.options.style.bubble.padding.y * 2,
            max: maxLineWidth
        };
    },

    /**
     * Split text into lines of desired width
     *
     * @param text
     * @param lineWidth: {best: number, max: number}
     * @returns {Array}
     */
    getConfinedLines: function (text, lineWidth) {

        var result = [];
        var lineCount = 0;
        var remainderPos = 0;
        for (var i = 1; i <= text.length; i++) {
            var line = text.substring(remainderPos, i);
            if (line.length > 0) {
                result[lineCount] = line;
            }
            if (getCtx().measureText(line).width >= lineWidth.best) {
                if (text.charAt(i) != ' ' && text.length > i) {
                    // position of last space in line
                    var lineEnd = line.lastIndexOf(' ');
                    // line until next space
                    var rest = text.substr(i);
                    var lineTillNextSpace = line + text.substr(i, rest.indexOf(' ') > 0 ? rest.indexOf(' ') : rest.length);
                    // break the line on the nearest space
                    if (line.length - lineEnd > rest.indexOf(' ') && getCtx().measureText(lineTillNextSpace).width <= lineWidth.max) {
                        result[lineCount] = lineTillNextSpace;
                        remainderPos += lineTillNextSpace.length + 1;
                        i = remainderPos + 1;
                    } else if (line.lastIndexOf(' ') > 0) {
                        result[lineCount] = line.substr(0, lineEnd);
                        remainderPos += lineEnd + 1;
                    } else {
                        continue;
                    }
                } else {
                    remainderPos = i + 1;
                }
                lineCount++;
            }
        }
        return result;
    },

    /**
     * Returns the maximum width of the specified lines
     */
    getBoxWidth: function (lines) {

        var result = 0;
        for (var i = 0; i < lines.length; i++) {
            var lineWidth = getCtx().measureText(lines[i]).width;
            if (lineWidth > result) {
                result = lineWidth;
            }
        }
        return result + this.options.style.bubble.padding.x * 2;
    },

    /**
     * Returns the sum of all properties w in the specified array, adding gaps between them
     */
    getTotalWidth: function (items, gap) {

        var result = 0;
        var gap_ = 0;
        for (var i = 0; i < items.length; i++) {
            result += items[i].w + gap_;
            gap_ = gap;
        }
        return result;
    },

    isLastPlotItem: function (plotItem) {
        return plotItem === PlotParser.parsed.plotItems[PlotParser.parsed.plotItems.length - 1];
    }
};