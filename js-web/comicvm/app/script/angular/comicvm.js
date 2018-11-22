'use strict';


angular.module('main', []);
angular.module('painter', []);
angular.module('editor', []);

var comicvm = angular.module('comicvm', [
    'main',
    'painter',
    'editor',

    'ngRoute',
    'ui.bootstrap'
]);

comicvm.config(['$routeProvider', function ($routeProvider) {
    $routeProvider.when('/print', {
        templateUrl: 'pages/print.html'
    }).when('/:story', {
        templateUrl: 'pages/main.html'
    }).otherwise({
        templateUrl: 'pages/main.html'
    });
}]);