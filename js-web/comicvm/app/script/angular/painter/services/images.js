'use strict';

angular.module('painter')
    .factory('cvmImages', [
        '$q', '$http', 'cvmBackend',
        function ($q, $http, backend) {

            return {
                loadImageList: loadImageList,
                getSceneImageList: getSceneImageList,
                tagKeyFromPath: tagKeyFromPath,
                initFromDOM: initFromDOM,

                uploadImage: uploadImage,
                uploadDroppedImages: uploadDroppedImages,
                postImageName: postImageName
            };

            /**
             * Loads the file OPTIONS.SOURCE.baseUrl + OPTIONS.SOURCE.images (default is images.json).
             * To generate the images.json file execute updateImages.js
             */
            function loadImageList(story) {
                return $http.get(backend.getImageListURL(story))
                    .then(function (response) {
                        return _.compact(response.data);
                    });
            }

            /**
             * @param scene: scene object
             * @param imageList: array of strings
             * @returns only the paths of those images that are used in the scene
             */
            function getSceneImageList(scene, imageList) {
                var tagStoreBackup = tagStore;
                tagStore = new TagStore();
                tagStore.defaultResult = 'images/empty.png';
                scene.resetImages();

                // add all image paths to the tag store, setting both key and value to path
                _.each(imageList, function (path) {
                    var tagKey = tagKeyFromPath(path);
                    tagStore.add(path, tagKey);
                });

                // get the paths of all images that are used in this scene
                var result = scene.getImageNames();
                result = _.filter(result, function (imageName) {
                    return imageName !== tagStore.defaultResult;
                });

                tagStore = tagStoreBackup;
                scene.resetImages();

                return result;
            }

            /**
             * Initialize TagStore from DOM using the filename as tag key
             *
             * @param imgElements: A list of DOM <img> elements
             */
            function initFromDOM(imgElements) {
                tagStore.drop();
                _.each(imgElements, function (element, i) {
                    var src = $(element).attr('src');
                    var tagKey = tagKeyFromPath(src);
                    tagStore.add(element, tagKey);
                });
            }

            /**
             * Converts an image path into its corresponding tag key
             *
             * @param path: A URL or a file path to an image
             * @returns {string} The image's tag key
             */
            function tagKeyFromPath(path) {
                var type = path.indexOf(OPTIONS.SOURCE.backgroundsDir + '/') >= 0 ? tagStore.TYPE_BACKGROUND : tagStore.TYPE_OBJECT;
                var tagKey = path.substring(path.lastIndexOf('/') + 1, path.lastIndexOf('.'));
                return type + '.' + tagKey.toLowerCase();
            }

            function uploadImage(file, url) {
                var formData = new FormData();
                formData.append('image', file);

                return $http.post(url, formData, {
                    transformRequest: angular.identity,
                    headers: {'Content-Type': undefined}  // let the system set the content type
                });
            }

            function uploadDroppedImages(mouseEvent, uploadPath, singleImageOnly) {
                var files = [],
                    uploadPromises = [];

                if (mouseEvent.dataTransfer && mouseEvent.dataTransfer.files) {
                    _.each(mouseEvent.dataTransfer.files, function (file, index) {
                        if (!singleImageOnly || index === 0) {
                            files.push(file);
                            uploadPromises.push(uploadImage(file, uploadPath));
                        }
                    });

                    return $q.all(uploadPromises).then(function () {
                        return files;
                    });
                } else {
                    return $.reject('no files dropped');
                }
            }

            function postImageName(tmpName, newName, story, imageType) {
                var url = backend.getMoveTempImageURL(story, tmpName),
                    dest = backend.getImageURL(story, imageType, newName);

                return $http.post(url, {dest: dest});
            }
        }]);