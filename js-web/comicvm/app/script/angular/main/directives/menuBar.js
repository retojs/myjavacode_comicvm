'use strict';

angular.module('main')
    .directive('cvmMenuBar', [
        'cvmContent',
        function (content) {

            return {
                scope: false,
                templateUrl: 'script/angular/main/directives/menuBar.html',
                controller: ['$scope', function ($scope) {

                    function getBgrOptions() {
                        var options = content.selection.noBackground;
                        if (content.scene) {
                            options = [options].concat(content.scene.getBackgroundQualifiers());
                        }
                        return options;
                    }

                    function getPanelOptions() {
                        var options = content.selection.noPanel;
                        if (content.scene) {
                            options = [options].concat(content.scene.getPanelIds());
                        }
                        return options;
                    }

                    $scope.options = {};

                    $scope.$watch('content.scene.ID', function () {
                        $scope.options.backgroundQualifiers = getBgrOptions();
                        $scope.options.panelIds = getPanelOptions();
                        content.selection.background = content.selection.noBackground;
                    });
                }]
            }
        }]);