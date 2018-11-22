'use strict';

angular.module('painter')

    /**
     * This directive opens the print dialog whenever the $scope variable doPrint changes.
     *  (which happens when the print button is pressed.)
     * The print dialog is opened through the window.print() function.
     * The window to be printed is the iframe #print-iframe, which displays all canvas elements inside the #image div.
     * The #image div is provided to the iframe by this directive through the global variable cvmIamgeDiv.
     */
    .directive('cvmPrintFrame', [function () {
        return {
            templateUrl: 'script/angular/painter/directives/printFrame.html',
            controller: ['$scope', function ($scope) {
                $scope.$watch('doPrint', function (newValue, oldValue) {
                    if (newValue !== oldValue) {
                        var iframe = angular.element('#print-iframe');
                        iframe.attr('src', '#/print/');
                    }
                });
            }],
            link: function () {
                // provide the #image div to cvmPrintFrameImage in the nested iframe as a global variable accessible by window.parent.cvmIamgeDiv
                window.cvmIamgeDiv = angular.element('#image')[0];
            }
        }
    }])

    /**
     * Put this directive inside print.html
     */
    .directive('cvmPrintFrameImage', [
        '$timeout', '$window',
        function ($timeout, $window) {
            return {
                link: function ($scope, element) {

                    // get the #image div from parent document
                    var parentImageDiv = window.parent.cvmIamgeDiv;

                    // redraw all canvas elements inside the #image div
                    var allCanvas = angular.element(parentImageDiv).find('canvas');
                    _.each(allCanvas, function (canvas) {
                        var canvasCopy = angular.element('<canvas></canvas>')[0];
                        canvasCopy.width = canvas.width;
                        canvasCopy.height = canvas.height;
                        element.append(canvasCopy);
                        var context = canvasCopy.getContext('2d');
                        context.drawImage(canvas, 0, 0);
                    });

                    $timeout($window.print(), 500);
                }
            }
        }]);