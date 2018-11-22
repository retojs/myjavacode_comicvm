'use strict';

angular.module('editor')
    .directive('cvmSourceEditor', [
        '$timeout', 'cvmSource',
        function ($timeout, cvmSource) {

    return {
        scope: {
            content: '=',
            onSourceLoaded: '=',
            onLayoutEdited: '=',
            onPlotEdited: '='
        },
        templateUrl: 'script/angular/editor/directives/sourceEditor.html',
        link: function ($scope, element, attributes) {

            $scope.sourceReloading = false;  // true when source gets reloaded

            /**
             * Loads the source and async. calls setSource(source)
             *
             * @returns {*}
             */
            $scope.loadSource = function () {
                $scope.sourceReloading = true;
                return cvmSource.loadSource($scope.content.story, $scope.content.selection.scene)
                    .then(function (source) {
                        $scope.setSource(source);
                        $scope.onSourceLoaded(source);
                        $timeout(function () {
                            $scope.sourceReloading = false;
                        });
                    });
            };

            $scope.reloadSource = function () {
                log('reloadSource not implemented', 'events');
            };

            /**
             * validates, formats and stores the new content.
             */
            $scope.setSource = function (source) {
                var layoutObject = LayoutParser.validateLayout(source.layout);
                if (layoutObject) {
                    source.layout = LayoutParser.serializeLayout(layoutObject);
                    $scope.content.source = source;
                }
            };

            $scope.$watch('content.selection.scene', function (newValue, oldValue) {
                if (newValue) {
                    $scope.content.state.sourceLoaded = false;
                    $scope.content.state.imagesLoaded = false;
                    //$scope.content.scene.hide();
                    PanelInfo.hide();
                    $scope.loadSource();
                }
            });

            /**
             * Stops propagation of the next layout change to onLayoutEdited.
             * The watcher resets it back to false every time it's called.
             *
             * This flag is set whenever the layout is changed using the interactive editor.
             * Editor changes should not trigger this watcher, since the repaint can be handled more efficiently from the editor.
             */
            $scope.silentLayoutEdited = false;

            $scope.$watch('content.source.layout', function (newValue, oldValue) {
                if (oldValue && !$scope.sourceReloading && newValue != oldValue) {  // if oldValue was undefined, source was loaded, not edited
                    if (LayoutParser.validateLayout(newValue)) {
                        if (!$scope.silentLayoutEdited) {
                            $scope.onLayoutEdited();
                            cvmSource.saveLayout($scope.content.story, $scope.content.selection.scene, newValue);
                        }
                        angular.element('#layoutContent').css('color', '#000');
                    } else {
                        angular.element('#layoutContent').css('color', '#888');
                    }
                    $scope.silentLayoutEdited = false;
                }
            });

            $scope.$watch('content.source.plot', function (newValue, oldValue) {
                if (oldValue && !$scope.sourceReloading && newValue != oldValue) {  // if oldValue was undefined, source was loaded, not edited
                    $scope.onPlotEdited();
                    cvmSource.savePlot($scope.content.story, $scope.content.selection.scene, newValue);
                }
            });

           // $scope.loadSource();
        }
    }
}]);