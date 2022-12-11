'use strict';

angular.module('main')
    .factory('cvmBackend', function () {

        var URL = {
            sceneList: ':storyDir/:story/list/scenes',
            imageList: ':storyDir/:story/list/images',

            plot: ':storyDir/:story/plot/:scene.plot.txt',
            layout: ':storyDir/:story/layout/:scene.json',
            image: ':storyDir/:story/images/:imageType/:name',
            moveTempImage: ':storyDir/:story/images/move/tmp/:name'
        };

        function replaceStory(story, path) {
            return path
                .replace(':storyDir', OPTIONS.SOURCE.storiesDir)
                .replace(':story', story);
        }

        function replaceScene(scene, path) {
            return path.replace(':scene', scene);
        }

        return {
            getBaseUrl: getBaseUrl,

            getSceneListURL: getSceneListURL,
            getImageListURL: getImageListURL,

            getPlotURL: getPlotURL,
            getLayoutURL: getLayoutURL,
            getImageURL: getImageURL,
            getMoveTempImageURL: getMoveTempImageURL
        };


        function getBaseUrl() {
            return 'http://' + OPTIONS.SOURCE.host + ':' + OPTIONS.SOURCE.port + '/';
        }

        function getSceneListURL(story) {
            return replaceStory(story, getBaseUrl() + URL.sceneList);
        }

        function getImageListURL(story) {
            return replaceStory(story, getBaseUrl() + URL.imageList);
        }

        function getPlotURL(story, scene) {
            return replaceStory(story,
                replaceScene(scene, getBaseUrl() + URL.plot)
            );
        }

        function getLayoutURL(story, scene) {
            return replaceStory(story,
                replaceScene(scene, getBaseUrl() + URL.layout)
            );
        }

        function getImageURL(story, imageType, imageName) {
            return replaceStory(story, getBaseUrl() + URL.image).replace(':imageType', imageType).replace(':name', imageName);
        }

        function getMoveTempImageURL(story, imageName) {
            return replaceStory(story, getBaseUrl() + URL.moveTempImage).replace(':name', imageName);
        }
    });