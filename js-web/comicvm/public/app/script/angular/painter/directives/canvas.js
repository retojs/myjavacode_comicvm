'use strict';

angular.module('painter')
    .directive('cvmCanvas', [
        '$rootScope', 'cvmPositions',
        function ($rootScope, positions) {
            return {
                scope: {
                    panelAndPage: '='
                },
                templateUrl: 'script/angular/painter/directives/canvas.html',
                controller: ['$scope', 'cvmContent', function ($scope, content) {
                    $scope.content = content;
                }],
                link: function ($scope) {

                    $scope.setPanelAndPage = function (mouseEvent) {
                        var pageNr = positions.getPageNr(mouseEvent);

                        if (pageNr > -1 && pageNr < LayoutParser.getPageCount()) {
                            var panel = positions.getPanelInPage(mouseEvent, pageNr);

                            $scope.panelAndPage.panel = panel;
                            $scope.panelAndPage.pageNr = pageNr;

                            comicVM.PanelPainter.highlighted.panelId = panel.id;
                        }

                        comicVM.Editor.repaint();

                        $rootScope.$broadcast('panelAndPage-changed');
                    };

                    $scope.reloadImages = function () {
                        $rootScope.$broadcast('reload-images');
                    };
                }
            }
        }]);