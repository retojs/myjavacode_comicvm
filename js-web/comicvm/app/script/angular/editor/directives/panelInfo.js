'use strict';

angular.module('editor')
    .directive('cvmPanelInfo', [
        'cvmPositions',
        function (positions) {
            return {
                scope: {
                    hideIf: '=',
                    panelAndPage: '=',
                    mouseListenerElement: '@'
                },
                templateUrl: 'script/angular/editor/directives/panelInfo.html',
                link: function ($scope) {

                    $scope.$on('panelAndPage-changed', function () {
                            $scope.next($scope.panelAndPage);
                    });

                    $scope.next = function (panelAndPage) {
                        if (!panelAndPage.panel) {
                            log('cvmPanelInfo: no panel selected');
                        } else {
                            OPTIONS.PANEL_INFO.next(panelAndPage.panel.id);
                            PanelInfo.show(panelAndPage);
                        }
                    };

                    angular.element($scope.mouseListenerElement).on('mousemove', function (e) {
                        var pageNr = positions.getPageNr(e);

                        if (pageNr > -1) {
                            var pos = positions.mouse2page(e, pageNr),
                                panel = positions.getPanelInPage(e, pageNr),
                                posFixed = {
                                    x: pos.x.toFixed(0),
                                    y: pos.y.toFixed(0)
                                },
                                text = '(' + zeroPositive(posFixed.x) + ', ' + zeroPositive(posFixed.y) + ') on page ' + pageNr + (panel ? ', panel ' + panel.id : '' );

                            angular.element('#mouse-position').text(text);
                        } else {
                            angular.element('#mouse-position').text('');
                        }

                        function zeroPositive(n) {
                            return n === '-0' ? '0' : n;
                        }
                    });

                }
            }
        }]);