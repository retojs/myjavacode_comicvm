'use strict';

angular.module('main')
    .directive('cvmImagePanel', [
        '$timeout', '$q', '$uibModal', 'cvmImages',
        function ($timeout, $q, $uibModal, images) {
            return {
                scope: {
                    content: '=',
                    onImagesLoaded: '='
                },
                templateUrl: 'script/angular/painter/directives/imagePanel.html',
                link: function ($scope, element) {

                    $scope.noCacheParam = Date.now();

                    $scope.showImages = false;

                    /**
                     * Shows or hides image previews in the footer of the page.
                     * Scrolls down to the footer if you show the images and scrolls back up if you hide them.
                     */
                    $scope.toggleImageDisplay = function () {
                        var footer = angular.element('#footer');
                        $scope.showImages = !$scope.showImages;
                        if ($scope.showImages) {
                            $timeout(function () {
                                element.find('#image-filter').focus();
                                footer.css('min-height',
                                    angular.element(document).height()
                                    - angular.element('#story').height()
                                    - angular.element('#comicvm-menu').height()
                                    - 80);
                                scrollToFooter();
                            });
                        } else {
                            footer.css('min-height', '');
                            window.scrollTo(0, 0);
                        }
                    };

                    $scope.imageFilter = '';

                    /**
                     * Returns true if all key words in $scope.imageFilter are found in the specified imagePath
                     *
                     * @param imagePath
                     * @returns {boolean}
                     */
                    $scope.isVisible = function (imagePath) {
                        var filter = $scope.imageFilter.trim().toLowerCase();
                        if (filter === '') {
                            return true;
                        }
                        var substrings = filter.split(/[\s,;]/);
                        var foundAll = true;
                        for (var i = 0; i < substrings.length; i++) {
                            foundAll = foundAll && getName(imagePath).toLowerCase().indexOf(substrings[i]) >= 0;
                        }
                        return foundAll;
                    };

                    function getName(imagePath) {
                        return imagePath.substring(imagePath.lastIndexOf('/') + 1, imagePath.lastIndexOf('.'));
                    }

                    /**
                     * @param imagePath
                     * @returns {string} the image's name without path information
                     */
                    $scope.getName = getName;

                    $scope.$watch('content.state.sourceLoaded', function (newValue, oldValue) {
                        if (newValue !== oldValue) {
                            if (newValue === true) {
                                loadImages();
                            } else {
                                $scope.showImages = false;
                            }
                        }
                    });

                    $scope.$watch('content.state.imageListLoaded', function (newValue, oldValue) {
                        if (newValue !== oldValue && newValue === true) {
                            loadImages();
                        }
                    });

                    $scope.getBackgroundImageList = function () {
                        return getFilteredImageList('bgr/');
                    };

                    $scope.getCharacterImageList = function () {
                        return getFilteredImageList('chr/');
                    };

                    function getFilteredImageList(subPath) {
                        return _($scope.imageList)
                            .filter(function (path) {
                                return path.indexOf(subPath) > -1;
                            })
                            .sort()
                            .value();
                    }

                    $scope.imagesLoaded = false;
                    $scope.imageCount = 0;
                    $scope.imageList = [];  // used by ng-repeat
                    $scope.storyImageList;

                    loadStoryImageList();

                    function loadStoryImageList() {
                        return images.loadImageList($scope.content.story)
                            .then(function (imageList) {
                                $scope.storyImageList = imageList;
                                $scope.content.state.imageListLoaded = true;
                            });
                    }

                    var loadedImages = [],  // contains the tagKeys of all images that have already been loaded
                        loadedImagesSize = {};  // contains the loaded images widths and heights

                    /**
                     * @returns {number} The number of images that have not been loaded before
                     */
                    function getNumberOfImagesToLoad() {
                        var imageCount = 0;
                        for (var i = 0; i < $scope.imageList.length; i++) {
                            var tagKey = images.tagKeyFromPath($scope.imageList[i]);
                            if (loadedImages.indexOf(tagKey) < 0) {
                                imageCount++;
                            }
                        }
                        return imageCount;
                    }

                    function addLoadedImage(image) {
                        var tagKey = images.tagKeyFromPath(image.src);
                        loadedImages.push(tagKey);
                        loadedImagesSize[tagKey] = {width: image.width, height: image.height};
                    }

                    function getLoadedImageSize(image) {
                        var tagKey = images.tagKeyFromPath(image.src);
                        return loadedImagesSize[tagKey];
                    }

                    function loadImages() {
                        if ($scope.content.state.imageListLoaded && $scope.content.state.sourceLoaded) {

                            $scope.imageList = images.getSceneImageList($scope.content.scene, $scope.storyImageList); // this will trigger ng-repeat and create img elements

                            $scope.noCacheParam = Date.now();  // use new no-cache param in image src urls
                            loadedImages = [];
                            loadedImagesSize = {};

                            var nofImagesToLoad = getNumberOfImagesToLoad();
                            if (nofImagesToLoad === 0) {
                                $scope.imageCount = $scope.imageList.length;
                                $timeout(onLoadImagesComplete);
                            } else {
                                $timeout(function () {  // after $scope.$apply the img elements will be ready to have a load handler attached
                                    element.find('img').load(function (event) {
                                        addLoadedImage(event.target);
                                        nofImagesToLoad -= 1;
                                        $scope.imageCount = $scope.imageList.length - nofImagesToLoad;
                                        $scope.$apply();
                                        if (nofImagesToLoad === 0) {
                                            onLoadImagesComplete();
                                        }
                                    });
                                });
                            }
                        }
                    }

                    $scope.reloadImages = function () {
                        loadStoryImageList()
                            .then(loadImages);
                    };

                    $scope.$on('reload-images', function () {
                        window.scrollTo(0, 0);
                        $scope.showImages = false;
                        $scope.reloadImages();
                    });

                    function onLoadImagesComplete() {
                        _.each(element.find('img'), function (img, i) {
                            setImageAttrs(img);
                        });
                        images.initFromDOM(element.find('img'));
                        scrollToFooter();

                        $scope.imagesLoaded = true;
                        $scope.$apply();
                        $timeout($scope.onImagesLoaded, 200);  // TODO images should be ready without delay
                    }

                    function setImageAttrs(img) {
                        var imgDim = getImageDimensions(img),
                            isBgr = img.src && img.src.indexOf('bgr/') > -1;

                        img.title = $scope.getName(img.src) + ', width=' + imgDim.width + ', height=' + imgDim.height;
                        if (isBgr) {
                            if (imgDim.width < imgDim.height) {
                                img.width = imgDim.width;
                                img.height = imgDim.height;
                            } else {
                                angular.element(img).css('width', '100%');
                            }
                        } else {
                            img.width = imgDim.width;
                            img.height = imgDim.height;
                        }
                    }

                    var imageShrink = 0.25,
                        minImageSize = 70;

                    function getImageDimensions(img) {
                        var imgDim = getLoadedImageSize(img);
                        if (!imgDim) {
                            log("no image size for " + img.src);
                        }
                        var size = Math.min(imgDim.width, imgDim.height);
                        var shrink = size * imageShrink < minImageSize ? minImageSize / size : imageShrink;
                        return {
                            width: Math.round(imgDim.width * shrink),
                            height: Math.round(imgDim.height * shrink)
                        }
                    }

                    var footerVerticalOffset = 20;

                    function scrollToFooter() {
                        if ($scope.imagesLoaded && $scope.showImages) {
                            var footer = angular.element('#footer');
                            var pos = footer.position();
                            window.scrollTo(0, pos.top - footerVerticalOffset);
                        }
                    }
                }
            }
        }]);