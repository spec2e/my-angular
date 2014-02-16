'use strict';

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.initConfig({
        watch: {
            js: {
                files: [
                    'src/**/*.js'],
                tasks: ['newer:jshint:all']
            },
            jsTest: {
                files: [
                    'test/**/*.js'],
                tasks: ['newer:jshint:test', 'karma']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            }
        },

        // Make sure code styles are up to par and there are no obvious mistakes
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                'src/**/*.js'
            ],
            test: {
                src: ['test/**/*.js']
            }
        },

        karma: {
            options: {
                frameworks: ['jasmine'],
                files: [
                    'node_modules/lodash/dist/lodash.js',
                    'node_modules/jquery/dist/jquery.js',
                    'src/**/*.js',
                    'test/**/*.js'
                ],
                reporters: ['progress'],
                port: 9876,
                browsers: ['PhantomJS'],
                singleRun: true,
                plugins: [
                    'karma-jasmine',
                    'karma-phantomjs-launcher'
                ]
            },
            ci: {
                autoWatch: false
            },
            dev: {
                singleRun: false,
                autoWatch: true
            }
        }
    });


    grunt.registerTask('default', ['jshint']);

};