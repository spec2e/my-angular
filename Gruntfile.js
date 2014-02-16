'use strict';

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Time how long tasks take. Can help when optimizing build times
    require('time-grunt')(grunt);

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-protractor-runner');

    grunt.initConfig({
        yeoman: {
            // configurable paths
            app: require('./bower.json').appPath || 'app',
            dist: 'target/dist'
        },
        watch: {
            js: {
                files: ['src/**/*.js'],
                tasks: ['newer:jshint:all']
            },
            jsTest: {
                files: ['test/**/*.js'],
                tasks: ['newer:jshint:test', 'karma']
            },
            gruntfile: {
                files: ['Gruntfile.js']
            },
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                files: [
                    '<%= yeoman.app %>/index.html',
                    '<%= yeoman.app %>/styles/{,*/}*.css',
                    '<%= yeoman.app %>/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
                ]
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
                '<%= yeoman.app %>/scripts/**/*.js'
            ],
            test: {
                src: ['test/spec/**/*.js']
            }
        },

        karma: {
            options: {
                frameworks: ['jasmine'],
                files: [
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

    grunt.registerTask('server', function () {

        grunt.task.run([
            'connect:livereload',
            'watch'
        ]);
    });

    grunt.registerTask('default', ['jshint']);

};