'use strict';

angular.module('painter')
    .factory('cvmContent', [
        '$http', '$routeParams', '$rootScope', 'cvmBackend',
        function ($http, $routeParams, $rootScope, backend) {

            var noBackground = '',
                noPanel = '',

                content = {
                    story: 'Mariel',
                    scene: null,

                    selection: {
                        scenes: [],
                        scene: null,

                        background: noBackground,
                        panel: noPanel,

                        noBackground: noBackground,
                        noPanel: noPanel
                    },

                    source: {
                        plot: null,
                        layout: null
                    },

                    state: {
                        sourceLoaded: false,
                        imageListLoaded: false,
                        imagesLoaded: false
                    }
                };

            $rootScope.$on('$routeChangeSuccess', function () {
                content.story = $routeParams.story ? $routeParams.story : content.story;

                $http.get(backend.getSceneListURL(content.story))
                    .then(function (response) {
                        content.selection.scenes = _.map(_.compact(response.data), function (scene) {
                            return scene.replace(/^\//, '')
                                .replace('.plot', '')
                                .replace('.txt', '')
                        });
                        content.selection.scenes.sort();
                        content.selection.scene = content.selection.scenes[3];
                    });
            });

            return content;

        }]);
