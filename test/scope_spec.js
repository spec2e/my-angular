/* jshint globalstrict: true */
/* global Scope: false, jasmine: false */
'use strict';

describe('Scope', function () {

    it('can be constructed and used as an object', function () {

        var scope = new Scope();
        scope.aProperty = 1;

        expect(scope.aProperty).toBe(1);

    });


    describe('digest', function () {

        var scope;

        beforeEach(function () {
            scope = new Scope();
        });

        it('calls the listener function of a watch on first $digest', function () {

            var watchFn = function () {
                return "watch";
            };
            var listenerFn = jasmine.createSpy();

            scope.$watch(watchFn, listenerFn);
            scope.$digest();

            expect(listenerFn).toHaveBeenCalled();


        });

        it('calls the watch function with the scope as argument', function () {
            var watchFn = jasmine.createSpy();
            var listenerFn = function () {
            };

            scope.$watch(watchFn, listenerFn);
            scope.$digest();

            expect(watchFn).toHaveBeenCalledWith(scope);

        });

        it('calls the listener function when the watched value changes', function () {

            scope.someValue = 'a';
            scope.counter = 0;

            var watchFn = function (scope) {
                return scope.someValue;
            };

            var listenerFn = function (newValue, oldValue, scope) {
                scope.counter++;
            };

            scope.$watch(watchFn, listenerFn);
            expect(scope.counter).toBe(0);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.someValue = 'b';
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(2);


        });

        it('may have watchers that omit the listener function', function () {

            var watchFn = jasmine.createSpy().andReturn('something');
            scope.$watch(watchFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalled();
        });

        it('triggers chained watchers in the same digest', function () {

            scope.name = 'jane';

            scope.$watch(
                function (scope) {
                    return scope.nameUpper;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + '.';
                    }
                }
            );

            scope.$watch(
                function (scope) {
                    return scope.name;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.nameUpper = newValue.toUpperCase();
                    }
                }
            );

            scope.$digest();

            expect(scope.initial).toBe('J.');

            scope.name = 'Bob';
            scope.$digest();

            expect(scope.initial).toBe('B.');
        });

        it('gives up on the watches after 10 iterations', function () {

            scope.counterA = 0;
            scope.counterB = 0;

            //scope watching counterA modifies counterB
            scope.$watch(
                function (scope) {
                    return scope.counterA;
                },
                function (newValue, oldValue, scope) {
                    scope.counterB++;
                }
            );

            //scope watching counterB modifies counterA
            scope.$watch(
                function (scope) {
                    return scope.counterB;
                },
                function (newValue, oldValue, scope) {
                    scope.counterA++;
                }
            );

            //encapsulate the $digest call to check for error
            var digestFn = function () {
                scope.$digest();
            };

            expect(digestFn).toThrow();
        });

        it('ends the digest when the last watch is clean', function() {

            scope.array = _.range(100);



        });

    });

});
