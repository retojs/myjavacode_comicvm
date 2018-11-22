'use strict';

angular.module('editor')
    .factory('cvmSource', [
        '$q', '$http', 'cvmBackend',
        function ($q, $http, backend) {

            return {
                loadSource: loadSource,
                savePlot: _.throttle(savePlot, 3000, {leading: false}),
                saveLayout: _.throttle(saveLayout, 3000, {leading: false})
            };

            function loadSource(story, scene) {

                var result = {
                    plot: null,
                    layout: null
                };

                var deferred = $q.defer();

                var filesToLoad = 2;

                function onLoad() {
                    filesToLoad--;
                    if (filesToLoad === 0) {
                        deferred.resolve(result);
                    }
                }

                resetSource();

                $http.get(backend.getPlotURL(story, scene) + "?" + (new Date()).getTime())
                    .success(function (data, status, headers, config) {
                        result.plot = data;
                        onLoad();
                    })
                    .error(function (data, status, headers, config) {
                        deferred.reject('could not load plot from ' + backend.getPlotURL());
                    });

                $http.get(backend.getLayoutURL(story, scene) + "?" + (new Date()).getTime())
                    .success(function (data, status, headers, config) {
                        result.layout = data;
                        onLoad();
                    })
                    .error(function (data, status, headers, config) {
                        deferred.reject('could not load layout from ' + backend.getLayoutURL());
                    });

                return deferred.promise;
            }

            function savePlot(story, scene, plot) {
                var deferred = $q.defer();

                $http.post(backend.getPlotURL(story, scene), {content: plot}).success(function (data, status, headers, config) {
                    deferred.resolve(data);
                    log('plot saved');
                }).error(function (data, status, headers, config) {
                    deferred.reject('could not save plot to ' + backend.getPlotURL(story, scene));
                });

                return deferred.promise;
            }

            function saveLayout(story, scene, layout) {
                var deferred = $q.defer();

                $http.post(backend.getLayoutURL(story, scene), {content: layout}).success(function (data, status, headers, config) {
                    deferred.resolve(data);
                    log('layout saved');
                }).error(function (data, status, headers, config) {
                    deferred.reject('could not save layout to ' + backend.getPlotURL(story, scene));
                });

                return deferred.promise;
            }

            function resetSource() {
                ComicVM.source.plotTextContent = null;
                ComicVM.source.plotContent = null;
                ComicVM.source.layoutContent = null;
            }
        }]);