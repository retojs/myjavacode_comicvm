'use strict';

angular.module('main')
    .factory('cvmPositions', function () {

            var element = {
                getImage: function () {
                    return angular.element('#image');
                }
            };

            return {  // TODO move all functions into this service

                mouse2page: mouse2page,

                getPageOffset: getPageOffset,
                getPageDim: getPageDim,
                getPageNr: getPageNr,

                getPositionInPage: getPositionInPage,
                getPanelInPage: getPanelInPage,
                getCharacterInPanel: getCharacterInPanel
            };

            function getScrollTop() {
                return element.getImage().scrollTop();
            }

            function getPageOffset(pageNr) {
                if (typeof pageNr === 'undefined') {
                    throw "pageNr missing";
                }
                var offset = getImageDivOffset(null);
                var offsetPage = getStoryPageOffset(pageNr);

                return {
                    x: offset.x + offsetPage.x,
                    y: offset.y + offsetPage.y + getScrollTop()
                };
            }

            function mouse2page(mouseEvent, pageNr) {
                var offset = getPageOffset(pageNr);

                return {
                    x: mouseEvent.pageX - offset.x,
                    y: mouseEvent.pageY - offset.y
                };
            }

            function getPageDim(pageNr) {
                var options = OPTIONS.PAGE;
                return {
                    x: 0,
                    y: pageNr * getCanvasDim().h,
                    w: options.pageWidth + 2 * options.pagePadding.x,
                    h: options.pageHeight + 2 * options.pagePadding.y + pageNr * getCanvasDim().h
                }
            }

            function getPageNr(mouseEvent) {
                var offset = getPageOffset(null),
                    page = Math.floor((mouseEvent.pageY - offset.y + getScrollTop()) / getCanvasDim().h);

                return Math.min(page, LayoutParser.pagePanels.length - 1);
            }

            function getPositionInPage(mouseEvent) {
                var offset = getPageOffset(null);

                return {
                    x: mouseEvent.pageX - offset.x,
                    y: (mouseEvent.pageY - offset.y + getScrollTop()) % getCanvasDim().h
                };
            }

            function getPanelInPage(mouseEvent, pageNr) {
                if (pageNr < 0 || pageNr >= LayoutParser.getPageCount()) {
                    return;
                }

                var posInPage = getPositionInPage(mouseEvent);

                for (var i = 0; i < LayoutParser.pagePanels[pageNr].length; i++) {
                    var panel = LayoutParser.pagePanels[pageNr][i];
                    if (isPosInsideDim(posInPage, panel.dim)) {
                        return panel;
                    }
                }
            }

            function getCharacterInPanel(mouseEvent, panel) {
                if (!panel) {
                    return;
                }

                var posInPage = getPositionInPage(mouseEvent),
                    characterPositions = panel.getCharactersPanelPositions(),
                    characterNames = PlotParser.getCharacterNames();

                for (var i = 0; i < characterNames.length; i++) {
                    var characterPos = characterPositions[characterNames[i]];
                    if (isPosInsideDim(posInPage, pos2dim(characterPos))) {
                        return {
                            name: characterNames[i],
                            pos: characterPos
                        };
                    }
                }
            }

            function isPosInsideDim(pos, dim) {
                return (
                    dim.x <= pos.x
                    && dim.x + dim.w >= pos.x
                    && dim.y <= pos.y
                    && dim.y + dim.h >= pos.y
                );
            }
        }
    );
