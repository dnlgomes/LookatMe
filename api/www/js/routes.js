angular.module('starter.routes', [])

    .config(function($stateProvider, $urlRouterProvider) {

        // Ionic uses AngularUI Router which uses the concept of states
        // Learn more here: https://github.com/angular-ui/ui-router
        // Set up the various states which the app can be in.
        // Each state's controller can be found in controllers.js
        $stateProvider




            .state('index', {
                url: '/',
                templateUrl: 'index.html'
            })
            .state('main', {
                url: '/main',
                templateUrl: 'main.html'
            })
            .state('edit-profile', {
                    url: '/edit-profile',
                    templateUrl: 'edit-profile.html'
            });

        $urlRouterProvider.otherwise('/');



    });
