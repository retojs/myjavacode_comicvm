'use strict';

angular.module('main')
    .controller('cvmMainController', [
        '$scope', '$routeParams', 'cvmPainter', 'cvmContent',
        function ($scope, $routeParams, painter, content) {

            $scope.content = content;

            $scope.onImagesLoaded = function () {
                resetPanelInfo();

                content.state.imagesLoaded = true;
                comicVM.Editor.repaint();
            };

            $scope.onSourceLoaded = function (source) {
                content.source = source;

                if (!content.scene) {
                    content.scene = new Scene(content.source.plot, content.source.layout);
                    ComicVM.scene = content.scene;  // TODO not a great solution
                } else {
                    content.scene.change(content.source.plot, content.source.layout)
                }
                content.scene.setup();

                content.state.sourceLoaded = true;
                comicVM.Editor.repaint();
            };

            /**
             * Paints the scene only if both images and sources are loaded
             */
            $scope.paintScene = function () {
                if (content.state.sourceLoaded && content.state.imagesLoaded) {
                    content.scene.fitBackgrounds();
                    painter.paintScene(content.scene, content.selection);
                }
            };


            $scope.paintBackground = function () {
                content.scene.fitBackgrounds();
                painter.paintBackground(content.scene, content.selection.background)
            };

            $scope.paint = function () {
                if (comicVM.Editor.paintOptionBackground && content.selection.background) {
                    $scope.paintBackground();
                } else {
                    $scope.paintScene();
                }
                $scope.refreshPanelInfo();
            };

            $scope.onPlotEdited = _.throttle(function () {
                painter.repaintPlot(content);
                $scope.refreshPanelInfo();
            }, 100, {leading: true});

            $scope.onLayoutEdited = _.throttle(function () {
                painter.repaintLayout(content);
                $scope.refreshPanelInfo();
            }, 300, {leading: false});

            /**
             * @type {boolean}: true means: don't trigger a selection watcher if the selection was changed by the other selection watcher
             */
            var ignoreAutoChange = false;

            $scope.$watch('content.selection.background', function (newValue, oldValue) {
                if (!ignoreAutoChange) {
                    if (newValue !== oldValue) {
                        // reset the panel selection
                        if (content.selection.panel !== content.selection.noPanel) {
                            content.selection.panel = content.selection.noPanel;  // this would trigger the other selection watcher
                            ignoreAutoChange = true;  // so set this flag
                        }
                        $scope.paint();
                    }
                } else {
                    ignoreAutoChange = false;
                }
            });

            $scope.$watch('content.selection.panel', function (newValue, oldValue) {
                if (!ignoreAutoChange) {
                    if (newValue !== oldValue) {
                        // reset the background selection
                        if (content.selection.background !== content.selection.noBackground) {
                            content.selection.background = content.selection.noBackground;  // this would trigger the other selection watcher
                            ignoreAutoChange = true;  // so set this flag
                        }
                        $scope.paint();
                    }
                } else {
                    ignoreAutoChange = false;
                }
            });

            $scope.panelAndPage = {};

            function resetPanelInfo() {
                $scope.panelAndPage.pageNr = 0;
                $scope.panelAndPage.panel = LayoutParser.panels[0];
                $scope.refreshPanelInfo();
            }

            $scope.refreshPanelInfo = function () {
                if ($scope.panelAndPage.panel) {
                    $scope.panelAndPage.panel = LayoutParser.panels[$scope.panelAndPage.panel.id];
                    PanelInfo.show($scope.panelAndPage);
                }
            }
        }]);