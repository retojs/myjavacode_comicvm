'use strict';

angular.module('main')
    .controller('cvmImageDropController', [
        '$scope', 'cvmImages', 'cvmPositions', 'cvmContent', 'files', 'imageName',
        function ($scope, images, positions, content, files, imageName) {
            $scope.images = files;
            $scope.imageName = imageName.toLowerCase();
            $scope.noCacheParam = Date.now();
            $scope.validation = validate();

            $scope.imageNameChanged = function (imageName) {
                $scope.imageName = imageName.toLowerCase();
                $scope.validation = validate();
            };

            $scope.postImageName = function (tmpImageName) {
                images.postImageName(tmpImageName, $scope.imageName + '.png', content.story, $scope.validation.imageType)
                    .then(function () {
                        $scope.modalInstance.close();
                    });
            };

            function validate() {
                var imageTags = $scope.imageName.split('.'),
                    bgrQualifiers = LayoutParser.getBackgroundQualifiers(),
                    characterNames = PlotParser.getCharacterNames(),

                    backgroundsInImageName = _.filter(bgrQualifiers, function (qualifier) {
                        return imageTags.indexOf(qualifier.toLowerCase()) > -1;
                    }),
                    charactersInImageName = _.filter(characterNames, function (name) {
                        return imageTags.indexOf(name.toLowerCase()) > -1;
                    });

                if (!/^(\w|-)+(\.(\w|-)+)*$/.test($scope.imageName)) {
                    return createValidation(
                        'Der Name muss die Form "tag1.tag2.tag3" haben und darf keine Umlaute und keine Sonderzeichen ausser "-" und "_"  enthalten.',
                        false
                    );
                }

                if (charactersInImageName.length === 0 && backgroundsInImageName.length === 0) {
                    return createValidation(
                        'Der Name muss entweder einen Hintergrund-Namen oder einen Figuren-Namen enthalten.',
                        false
                    );
                }

                // this should be no problem, right?

                //if (charactersInImageName.length > 1) {
                //    return createValidation(
                //        'Der Name darf nicht Namen von mehr als einer Figur enthalten. ('
                //        + charactersInImageName.join(', ')
                //        + ')',
                //        false
                //    );
                //}
                //if (backgroundsInImageName.length > 1) {
                //    return createValidation(
                //        'Der Name darf nicht Namen von mehr als einem Hintergrund enthalten. ('
                //        + backgroundsInImageName.join(', ')
                //        + ')',
                //        false
                //    );
                //}

                if (charactersInImageName.length === 1) {
                    return createValidation(
                        'Das Bild wird mit der Figur "' + charactersInImageName[0] + '" assoziiert',
                        true,
                        tagStore.TYPE_OBJECT
                    );
                }
                if (backgroundsInImageName.length === 1) {
                    return createValidation(
                        'Das Bild wird mit dem Hintergrund "' + backgroundsInImageName[0] + '" assoziiert',
                        true,
                        tagStore.TYPE_BACKGROUND
                    );
                }

                return 'no message';
            }

            function createValidation(message, isValid, imageType) {
                return {
                    message: message,
                    isValid: isValid,
                    imageType: imageType
                };
            }
        }]);