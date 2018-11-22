'use strict';

angular.module('painter').factory('cvmPainter', [function () {

    return {
        paintScene: paintScene,
        paintBackground: paintBackground,
        repaintPlot: repaintPlot,
        repaintLayout: repaintLayout
    };

    function paintScene(scene, selection) {
        OPTIONS.PAINTER.paintSinglePanel = selection.panel === '' ? -1 : selection.panel;
        OPTIONS.PAINTER.paintSingleBackground = selection.background ? selection.background : null;
        comicVM.EditorElements.removeEditorElements();
        comicVM.PanelPainter.updateOptions();
        scene.paint();
    }

    function paintBackground(scene, qualifier) {
        if (!scene || !qualifier) {
            return
        }
        if (qualifier === 'DEFAULT') {
            qualifier = '';
        }

        scene.hide();

        var panels = LayoutParser.backgroundPanels[qualifier],
            widestPanel = _.reduce(panels, function (result, panel) {
                return result.dim.w < panel.dim.w ? panel : result;
            });

        comicVM.PanelPainter.updateOptions();
        comicVM.PanelPainter.paintBackgroundWithAllPanels(
            widestPanel,
            {
                paintBackground: true
            }
        );
    }

    function repaintPlot(content) {
        content.scene = content.scene.change(content.source.plot);

        var previouslyParsed = PlotParser.parsed,
            plotItems = previouslyParsed.plotItems;

        PlotParser.parse(content.source.plot);

        if (!_.isEqual(previouslyParsed.characterNames)) {
            content.scene.setup();
            content.scene.fitBackgrounds();
            paintScene(content.scene, content.selection);

        } else {

            for (var i = 0; i < PlotParser.parsed.plotItems.length; i++) {
                if (!plotItems[i].equals(PlotParser.parsed.plotItems[i])) {
                    // replace the differing plot item
                    plotItems[i].panel.resetPlotItem(PlotParser.parsed.plotItems[i]);
                    // replaint this plot items panel
                    content.scene.repaintSinglePanel(plotItems[i].panel);
                } else {
                    // copy the panel reference to the new plot items
                    PlotParser.parsed.plotItems[i].panel = plotItems[i].panel;
                }
            }
        }
    }

    function repaintLayout(content) {
        var scene = content.scene = content.scene.change(null, content.source.layout);

        // backup old layout
        var oldLayout = LayoutParser.getLayoutUnchanged();

        // apply new layout
        content.scene.setupNewLayout(content.source.layout);

        var change = LayoutRepaint.layoutChange(oldLayout, LayoutParser.getLayoutUnchanged());
        log('' + change);
        if (change.all) {
            comicVM.EditorElements.removeEditorElements();
            content.scene.paint();

        } else if (change.panelIds) {
            content.scene.repaintPanels(change.panelIds);
            if (change.rest) {
                repaintRemainingPanels(change.pageNr, change.stripNr, change.panelIds[0]);
                repaintRemainingStrips(change.pageNr, change.stripNr);
                repaintRemainingPages(change.pageNr);
            }
        } else if (change.strips) {
            for (var i = 0; i < change.strips.length; i++) {
                repaintStrip(change.strips[i].pageNr, change.strips[i].stripNr);
            }
            if (change.rest) {
                var lastStrip = change.strips[change.strips.length - 1];
                repaintRemainingStrips(lastStrip.pageNr, lastStrip.stripNr);
                repaintRemainingPages(lastStrip.pageNr);
            }
        } else if (change.pages) {
            for (var i = 0; i < change.pages.length; i++) {
                repaintPage(change.pages[i].pageNr);
            }
            if (change.rest) {
                var lastPage = change.pages[change.pages.length - 1];
                repaintRemainingPages(lastPage.pageNr);
            }
        }

        function repaintStrip(pageNr, stripNr) {
            var panelIds = LayoutParser.getStripPanelIds(pageNr, stripNr, oldLayout);
            comicVM.EditorElements.removeEditorElements(panelIds, pageNr);
            scene.repaintSingleStrip(pageNr, stripNr, panelIds);
        }

        function repaintPage(pageNr) {
            var panelIds = LayoutParser.getPagePanelIds(pageNr, oldLayout);
            comicVM.EditorElements.removeEditorElements(panelIds, pageNr);
            scene.repaintSinglePage(pageNr);
        }

        function repaintRemainingPanels(pageNr, stripNr, panelId) {
            var panelIds = LayoutParser.getRemainingPanels(pageNr, stripNr, panelId);
            scene.repaintPanels(panelIds);
        }

        function repaintRemainingStrips(pageNr, stripNr) {
            var strips = LayoutParser.getRemainingStrips(pageNr, stripNr);
            for (var i = 0; i < strips.length; i++) {
                repaintStrip(pageNr, strips[i]);
            }
        }

        function repaintRemainingPages(pageNr) {
            var pages = LayoutParser.getRemainingPages(pageNr);
            for (var i = 0; i < pages.length; i++) {
                repaintPage(pages[i]);
            }
        }
    }
}]);