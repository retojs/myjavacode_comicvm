'use strict';

angular.module('main')
    .directive('cvmImageDropArea', [
        '$timeout', '$q', '$uibModal', 'cvmImages',
        function ($timeout, $q, $uibModal, images) {
            return {
                restrict: 'A',
                scope: {
                    uploadPath: '@',
                    downloadPath: '@',
                    onDrop: '&'
                },
                link: function ($scope, element, attrs) {

                    var imagePanel = element, //angular.element('#image-panel'),
                        eventCounter = 0;  // keep track of drag events on #image-panel's child elements

                    imagePanel.bind({
                        dragenter: function (e) {
                            e.preventDefault(); // needed for IE
                            eventCounter++;
                            $(this).addClass('drag-over');
                        },

                        dragleave: function () {
                            eventCounter--;
                            if (eventCounter === 0) {
                                $(this).removeClass('drag-over');
                            }
                        },

                        dragover: function (e) {
                            e.preventDefault();  // prerequisite for the drop event to be called
                        }
                    });

                    // avoid jQuery, otherwise chrome redirects to the image for unknown reasons
                    imagePanel = document.getElementById(attrs.id);
                    imagePanel.ondrop = function (mouseEvent) {
                        eventCounter--;
                        if (eventCounter === 0) {
                            $(this).removeClass('drag-over');
                        }

                        if (mouseEvent.stopPropagation) {
                            mouseEvent.stopPropagation(); // stops the browser from redirecting.
                        }

                        images.uploadDroppedImages(mouseEvent, $scope.uploadPath)
                            .then(function (files) {
                                $uibModal.open({
                                        scope: $scope,
                                        templateUrl: 'script/angular/painter/dialogs/imageUploaded.html',
                                        controller: function ($scope) {
                                            $scope.images = files;
                                            $scope.noCacheParam = Date.now();
                                        }
                                    })
                                    .closed.then($scope.onDrop());
                            });


                        return false; // stops the browser from redirecting.
                    };
                }
            };
        }]);