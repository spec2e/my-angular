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

        it('ends the digest when the last watch is clean', function () {

            scope.array = _.range(100);
            var watchExecutions = 0;

            _.times(100, function (i) {
                scope.$watch(
                    function (scope) {
                        watchExecutions++;
                        return scope.array[i];
                    },
                    function (newValue, oldValue, scope) {

                    }
                );
            });

            scope.$digest();
            expect(watchExecutions).toBe(200);

            //Modify the value in the first position of the array. Set it to 420.
            scope.array[0] = 420;
            scope.$digest();
            expect(watchExecutions).toBe(301);

        });

        it('compares based on value if specified', function () {

            scope.aValue = [1, 2, 3];
            scope.counter = 0;

            //setup the watch to be a deep-watch, i.e. do value checking on the array instead of reference checking
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );

            //first round will be successful, since we initialize the watchers
            scope.$digest();
            expect(scope.counter).toBe(1);

            //second round will check that watchers are able to deep-watch instead of doing reference watch
            scope.aValue.push(4);
            scope.$digest();
            //if scope.counter has been incremented, it means that we have done a deep watch, since the adding
            //of the value '4' to the array should trigger a value-watch
            expect(scope.counter).toBe(2);

        });

        it('correctlly handles NaNs', function () {

            scope.number = 0 / 0;
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.number;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(1);

        });

        it('executes $evaled function and returns result', function () {
            scope.aValue = 42;

            var result = scope.$eval(function (scope) {
                return scope.aValue;
            })

            expect(result).toBe(42);
        });

        it('passes the second $eval argument straight through', function () {
            scope.aValue = 42;

            var result = scope.$eval(function (scope, arg) {
                return scope.aValue + arg;
            }, 2);

            expect(result).toBe(44);
        })

        it('executes $apply-ed function and calls $digest', function () {
            scope.aValue = 'someValue';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);

            scope.$apply(function (scope) {
                scope.aValue = 'some other value';
            });

            scope.$digest();
            expect(scope.counter).toBe(2);

        });

        it('execute $evalAsync-ed function later in the same cycle', function () {
            scope.aValue = [1, 2, 3];
            scope.asyncEvaluated = false;
            scope.asyncEvaluatedImmediately = false;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.$evalAsync(
                        function (scope) {
                            scope.asyncEvaluated = true;
                        });
                    scope.asyncEvaluatedImmediately = scope.asyncEvaluated;
                }
            )

            scope.$digest();
            expect(scope.asyncEvaluated).toBe(true);
            expect(scope.asyncEvaluatedImmediately).toBe(false);

        });

        it('has a $$phase field whose value is the current digest phase', function () {
            scope.aValue = [1,2,3];
            scope.phaseInWatchFunction = undefined;
            scope.phaseInListenerFunction = undefined;
            scope.phaseInApplyFunction = undefined;

            scope.$watch(
                function (scope) {
                    scope.phaseInWatchFunction = scope.$$phase;
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.phaseInListenerFunction = scope.$$phase;
                }
            );
            
            scope.$apply(function (scope) {
                scope.phaseInApplyFunction = scope.$$phase;
            });

            expect(scope.phaseInWatchFunction).toBe('$digest');
            expect(scope.phaseInListenerFunction).toBe('$digest');
            expect(scope.phaseInApplyFunction).toBe('$apply');

        });

        it('schedules a $digest in $evalAsync', function () {
            scope.aValue = 'abc';
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter ++;
                }
            );

            scope.$evalAsync(function (scope) {
                //do nothing - just see if it triggers the $digest
            });

            expect(scope.counter).toBe(0);
            waits(50);
            runs(function () {
                expect(scope.counter).toBe(1);
            });

        });
        
    });

});

