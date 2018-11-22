'use strict';

angular.module('main')
    .directive('cvmImageDropIntoPage', [
        '$uibModal', 'cvmImages', 'cvmPositions', 'cvmContent',
        function ($uibModal, images, positions, content) {
            return {
                restrict: 'A',
                scope: {
                    uploadPath: '@',
                    downloadPath: '@',
                    onDrop: '&'
                },
                link: function ($scope, element, attrs) {

                    var eventCounter = 0,  // keep track of drag events on #image-panel's child elements
                        dropAreaBorderElement;  // displays the dashed drop area border

                    element.bind({
                        dragenter: function (e) {
                            e.preventDefault(); // needed for IE
                            eventCounter++;
                        },

                        dragleave: function () {
                            eventCounter--;
                            if (eventCounter === 0) {
                                hideDropBorderElement();
                            }
                        },

                        dragover: function (e) {
                            e.preventDefault();  // prerequisite for the drop event to be called

                            show(getDropTarget(e.originalEvent));
                        }
                    });

                    // avoid jQuery, otherwise chrome redirects to the image for unknown reasons
                    var imageDiv = document.getElementById(attrs.id);
                    imageDiv.ondrop = function (mouseEvent) {
                        eventCounter--;
                        hideDropBorderElement();

                        mouseEvent.preventDefault();
                        if (mouseEvent.stopPropagation) {
                            mouseEvent.stopPropagation(); // stops the browser from redirecting (?)
                        }

                        var dropTarget = getDropTarget(mouseEvent),
                            imageName = getDropTargetImageName(dropTarget);

                        images.uploadDroppedImages(mouseEvent, $scope.uploadPath, true)  // upload only a single image
                            .then(function (files) {
                                    $scope.modalInstance = $uibModal.open({
                                        scope: $scope,
                                        templateUrl: 'script/angular/painter/dialogs/imageDroppedIntoPage.html',
                                        controller: 'cvmImageDropController',
                                        resolve: {
                                            files: function () {
                                                return files;
                                            },
                                            imageName: function () {
                                                return imageName;
                                            }
                                        }
                                    });
                                    $scope.modalInstance.closed.then($scope.onDrop());
                                }
                            );

                        return false; // stops the browser from redirecting (?)
                    };

                    function getDropTarget(mouseEvent) {
                        var pageNr = positions.getPageNr(mouseEvent);
                        if (pageNr > -1 && pageNr < LayoutParser.getPageCount()) {
                            var panel = positions.getPanelInPage(mouseEvent, pageNr);
                            if (panel) {
                                var character = positions.getCharacterInPanel(mouseEvent, panel);
                                if (character) {
                                    return {character: character, panel: panel, pageNr: pageNr};
                                } else {
                                    return {panel: panel, pageNr: pageNr};
                                }
                            } else {
                                return {pageNr: pageNr};
                            }
                        }
                    }

                    function getDropTargetImageName(dropTarget) {
                        if (dropTarget.character) {
                            var mustMatchTags = dropTarget.panel.getMustMatchTags(dropTarget.character.name),
                                justMatchTags = dropTarget.panel.getCharacterTags(dropTarget.character.name),
                                tags = _(mustMatchTags.concat(justMatchTags))
                                    .filter(function (tag) {
                                        return tag != tagStore.TYPE_OBJECT;
                                    })
                                    .uniq()
                                    .value();

                            return tags.join('.');

                        } else if (dropTarget.panel) {
                            var allTags = Bgr.getBgrImageTags(dropTarget.panel.layoutGet.bgrQualifier()),
                                tags = _.filter(allTags, function (tag) {
                                    return tag != tagStore.TYPE_BACKGROUND;
                                });

                            return tags.join('.');

                        } else {
                            return PlotParser.getPlace();
                        }
                    }

                    function show(dropTarget) {
                        if (dropTarget.character) {
                            showDropBorderElement(pos2dim(dropTarget.character.pos), dropTarget.pageNr);
                        } else if (dropTarget.panel) {
                            showDropBorderElement(dropTarget.panel.dim, dropTarget.pageNr);
                        } else {
                            showDropBorderElement(positions.getPageDim(dropTarget.pageNr), dropTarget.pageNr);
                        }
                    }

                    function showDropBorderElement(dim, pageNr) {
                        if (!dropAreaBorderElement) {
                            dropAreaBorderElement = $('<div></div>');
                            dropAreaBorderElement.attr('id', 'drop-border');
                            dropAreaBorderElement.css('border', '3px dashed teal');
                        }
                        if (!dropAreaBorderElement.parentNode) {
                            element.append(dropAreaBorderElement);
                        }
                        setPanelPositionCss(dropAreaBorderElement, dim, pageNr);
                        dropAreaBorderElement.css('display', 'initial');
                    }

                    function hideDropBorderElement() {
                        if (dropAreaBorderElement) {
                            dropAreaBorderElement.css('display', 'none');
                        }
                    }
                }
            };
        }]);