/* jshint globalstrict: true */
/* global Scope: false, jasmine: false */
"use strict";

describe("Scope", function () {

    it("can be constructed and used as an object", function () {

        var scope = new Scope();
        scope.aProperty = 1;

        expect(scope.aProperty).toBe(1);

    });


    describe("digest", function () {

        var scope;

        beforeEach(function () {
            scope = new Scope();
        });

        it("calls the listener function of a watch on first $digest", function () {

            var watchFn = function () {
                return "watch";
            };
            var listenerFn = jasmine.createSpy();

            scope.$watch(watchFn, listenerFn);
            scope.$digest();

            expect(listenerFn).toHaveBeenCalled();


        });

        it("calls the watch function with the scope as argument", function () {
            var watchFn = jasmine.createSpy();
            var listenerFn = function () {
            };

            scope.$watch(watchFn, listenerFn);
            scope.$digest();

            expect(watchFn).toHaveBeenCalledWith(scope);

        });

        it("calls the listener function when the watched value changes", function () {

            scope.someValue = "a";
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

            scope.someValue = "b";
            expect(scope.counter).toBe(1);

            scope.$digest();
            expect(scope.counter).toBe(2);


        });

        it("calls listener when watch value is first undefined", function () {
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(1);
        });

        it("calls listener with new value as the old value, the first time", function () {
            scope.someValue = 123;
            var oldValuesGiven;

            scope.$watch(
                function (scope) {
                    return scope.someValue;
                },
                function (newValue, oldValue, scope) {
                    oldValuesGiven = oldValue;
                }
            );

            scope.$digest();
            expect(oldValuesGiven).toBe(123);

        });


        it("may have watchers that omit the listener function", function () {

            var watchFn = jasmine.createSpy().andReturn("something");
            scope.$watch(watchFn);

            scope.$digest();

            expect(watchFn).toHaveBeenCalled();
        });

        it("triggers chained watchers in the same digest", function () {

            scope.name = "jane";

            scope.$watch(
                function (scope) {
                    return scope.nameUpper;
                },
                function (newValue, oldValue, scope) {
                    if (newValue) {
                        scope.initial = newValue.substring(0, 1) + ".";
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

            expect(scope.initial).toBe("J.");

            scope.name = "Bob";
            scope.$digest();

            expect(scope.initial).toBe("B.");
        });

        it("gives up on the watches after 10 iterations", function () {

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

        it("ends the digest when the last watch is clean", function () {

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

        it("compares based on value if specified", function () {

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
            //of the value "4" to the array should trigger a value-watch
            expect(scope.counter).toBe(2);

        });

        it("correctlly handles NaNs", function () {

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

        it("executes $evaled function and returns result", function () {
            scope.aValue = 42;

            var result = scope.$eval(function (scope) {
                return scope.aValue;
            })

            expect(result).toBe(42);
        });

        it("passes the second $eval argument straight through", function () {
            scope.aValue = 42;

            var result = scope.$eval(function (scope, arg) {
                return scope.aValue + arg;
            }, 2);

            expect(result).toBe(44);
        })

        it("executes $apply-ed function and calls $digest", function () {
            scope.aValue = "someValue";
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
                scope.aValue = "some other value";
            });

            scope.$digest();
            expect(scope.counter).toBe(2);

        });

        it("execute $evalAsync-ed function later in the same cycle", function () {
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

        it("has a $$phase field whose value is the current digest phase", function () {
            scope.aValue = [1, 2, 3];
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

            expect(scope.phaseInWatchFunction).toBe("$digest");
            expect(scope.phaseInListenerFunction).toBe("$digest");
            expect(scope.phaseInApplyFunction).toBe("$apply");

        });

        it("schedules a $digest in $evalAsync", function () {
            scope.aValue = "abc";
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
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

        it("runs a $$postDigest function after each $digest", function () {

            scope.counter = 0;

            scope.$$postDigest(function () {
                scope.counter++;
            });

            //Test that $$postDigest does not run before the $digest has been called
            expect(scope.counter).toBe(0);

            scope.$digest();
            //Test that $$postDigest has been run after the $digest has been called
            expect(scope.counter).toBe(1);

            scope.$digest();
            //Test that $$postDigest has not been again after a new $digest has been issued
            expect(scope.counter).toBe(1);


        });

        it("does not include $$postDigest in the digest cycle", function () {
            var originalValue = "original value";
            var changedValue = "changed value";
            scope.aValue = originalValue;

            scope.$$postDigest(function () {
                scope.aValue = changedValue;
            });

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.watchedValue = newValue;
                }
            );

            scope.$digest();
            //Test that the first call to $digest does not have effect on the scope.watchedValue
            expect(scope.watchedValue).toBe(originalValue);

            scope.$digest();
            //Test that the second $digest now will have the scope.watchedValue set to "changed value"
            expect(scope.watchedValue).toBe(changedValue);

        });

        it("catches exceptions in watch functions and continues", function () {
            scope.aValue = "abc";
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    throw "Error";
                },
                function (newValue, oldValue, scope) {

                }
            );

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

        });

        it("catches exceptions in listener functions and continues", function () {
            scope.aValue = "abc";
            scope.counter = 0;

            //This will produce an error. This test case will test the the next $watch will still be handled
            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    throw "Error";
                }
            );

            //This $watch should stille be executed, even if the pre $watch had failed...
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

        });

        it("catches exceptions in $evalAsync", function () {
            scope.aValue = "abc";
            scope.counter = 0;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$evalAsync(function () {
                throw "Error";
            });

            setTimeout(function () {
                expect(scope.counter).toBe(1);
                done();
            }, 50);
        });


        it("catches exceptions in $$postDigest", function () {
            var didRun = false;

            scope.$$postDigest(function () {
                throw "Error";
            });

            scope.$$postDigest(function () {
                didRun = true;
            });

            scope.$digest();
            expect(didRun).toBe(true);
        });


        it("allows destroying a $watch with a removal function", function () {
            scope.aValue = "abc";
            scope.counter = 0;

            var destroyWatch = scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            //expect this to be 1, since the watch has run first time
            expect(scope.counter).toBe(1);

            scope.aValue = "def";
            scope.$digest();
            //expect scope.counter to be 2, since we changed the watched value and called $digest
            expect(scope.counter).toBe(2);

            destroyWatch();
            scope.$digest();
            //This should still be 2 even though we changed the watched expression, since we called the function to remove the watch
            expect(scope.counter).toBe(2);


        });

        it("allows destroying a watch during a $digest", function () {

            scope.aValue = "abc";
            var watchCalls = [];

            scope.$watch(
                function (scope) {
                    watchCalls.push("first");
                    return scope.aValue;
                }
            );

            var destroyWatch = scope.$watch(
                function (scope) {
                    watchCalls.push("second");
                    destroyWatch();
                }
            );

            scope.$watch(
                function (scope) {
                    watchCalls.push("third");
                    return scope.aValue;
                }
            );

            scope.$digest();
            expect(watchCalls).toEqual(["first", "second", "third", "first", "third"]);

        });


        it("allows a watch to destroy another during watching", function () {
            scope.aValue = "abc";
            scope.counter = 0;

            var destroyWatch = null;

            scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    destroyWatch();
                }
            );

            destroyWatch = scope.$watch(
                function (scope) {
                },
                function (newValue, oldValue, scope) {
                }
            );

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

        });

        it("allows destroying several watches during $digest", function () {
            scope.aValue = "abc";
            scope.counter = 0;

            var destroyWatch1, destroyWatch2;

            destroyWatch1 = scope.$watch(
                function (scope) {
                    destroyWatch1();
                    destroyWatch2();
                }
            );

            destroyWatch2 = scope.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                }
            );

            scope.$digest();
            expect(scope.counter).toBe(0);

        });

    });

    describe("Inheritance", function () {

        it("Inherits the parents properties", function () {
            var parent = new Scope();
            parent.aValue = [1, 2, 3];

            var child = parent.$new();

            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it("Does not cause a parent to inherit its properties", function () {

            var parent = new Scope();

            var child = parent.$new();

            child.aValue = [1 , 2, 3];

            expect(parent.aValue).toBeUndefined();
        });

        it("It inherit the parents properties whenever they are defined", function () {

            var parent = new Scope();
            var child = parent.$new();

            parent.aValue = [1, 2, 3];

            expect(child.aValue).toEqual([1, 2, 3]);
        });

        it("Can manipulate a parent scopes property", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];

            child.aValue.push(4);

            expect(child.aValue).toEqual([1, 2, 3, 4]);
            expect(parent.aValue).toEqual([1, 2, 3, 4]);
        });

        it("Can watch a property in the parent", function () {
            var parent = new Scope();
            var child = parent.$new();
            parent.aValue = [1, 2, 3];
            child.counter = 0;

            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter++;
                },
                true
            );

            child.$digest();
            expect(child.counter).toBe(1);

            parent.aValue.push(4);
            child.$digest();
            expect(child.counter).toBe(2);
        });

        it("Can be nested at any depth", function () {
            var a = new Scope();
            var aa = a.$new();
            var aaa = aa.$new();
            var aab = aa.$new();
            var ab = a.$new();
            var abb = ab.$new();

            a.value = 1;

            expect(aa.value).toBe(1);
            expect(aaa.value).toBe(1);
            expect(aab.value).toBe(1);
            expect(ab.value).toBe(1);
            expect(abb.value).toBe(1);

            ab.anotherValue = 2;

            expect(abb.anotherValue).toBe(2);
            expect(aa.anotherValue).toBeUndefined();
            expect(aaa.anotherValue).toBeUndefined();


        });

        it("shadows a parents property with the same name", function () {
            var parent = new Scope();
            var child = parent.$new();

            parent.name = "joe";
            child.name = "jill";

            expect(parent.name).toBe("joe");
            expect(child.name).toBe("jill");
        });

        it("does not shadow members of parent scopes attributes", function () {
            var parent = new Scope();
            var child = parent.$new();

            parent.user = {user: "joe"};
            child.user.name = "jill";

            expect(child.user.name).toBe("jill");
            expect(parent.user.name).toBe("jill");

        });

        it("does not digest its parent(s)", function () {
            var parent = new Scope();
            var child = parent.$new();

            parent.aValue = "abc";

            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            child.$digest();
            expect(child.aValueWas).toBeUndefined();

        });

        it("keeps a record of its children", function () {
            var parent = new Scope();
            var child1 = parent.$new();
            var child2 = parent.$new();
            var child2_1 = child2.$new();

            expect(parent.$$children.length).toBe(2);
            expect(parent.$$children[0]).toBe(child1);
            expect(parent.$$children[1]).toBe(child2);

            expect(child1.$$children.length).toBe(0);
            expect(child2.$$children.length).toBe(1);
            expect(child2.$$children[0]).toBe(child2_1);

        });

        it("digests its children", function () {
            var parent = new Scope();
            var child = parent.$new();

            parent.aValue = "abc";
            child.$watch(function (scope) {
                    return scope.aValue;
                }, function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            parent.$digest();
            expect(child.aValueWas).toBe("abc");
        });

        it("digests from root on $apply", function () {
            var parent = new Scope();
            var child = parent.$new();
            var child2 = child.$new();

            parent.aValue = "abc";
            parent.counter = 0;

            parent.$watch(function (scope) {
                return scope.aValue;
            }, function (newValue, oldValue, scope) {
                scope.counter++;
            })

            child2.$apply(function (scope) {
            })

            expect(parent.counter).toBe(1);
        });

        it("it schedules a digest from root on $evalAsync", function () {

            var parent = new Scope();
            var child = parent.$new();
            var child2 = child.$new();

            parent.aValue = 0;
            parent.counter = 0;

            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (oldValue, newValue, scope) {
                    scope.counter++;
                }
            );

            child2.$evalAsync(function (scope) {

            });

            setTimeout(function () {
                expect(parent.counter).toBe(1);
                done();

            }, 50);


        });

        it("does not have access to its parent attributes when isolated", function () {

            var parent = new Scope();
            var child = parent.$new(true);

            parent.aValue = "abc";

            expect(child.aValue).toBeUndefined();


        });

        it("can not watch parent attributes when isolated", function () {

            var parent = new Scope();
            var child = parent.$new(true);

            parent.aValue = "abc";

            child.$watch(function (scope) {
                    return scope.aValue;
                },
                function (oldValue, newValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            child.$digest();
            expect(child.aValueWas).toBeUndefined();
        });

        it("digests its isolated children", function () {

            var parent = new Scope();
            var child = parent.$new(true);

            child.aValue = "abc";
            child.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.aValueWas = newValue;
                }
            );

            parent.$digest();
            expect(child.aValueWas).toBe("abc");

        });

        it("digests from root on $apply when isolated", function () {

            var parent = new Scope();
            var child = parent.$new(true);
            var child2 = child.$new();

            parent.aValue = "abc";
            parent.counter = 0;
            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (newValue, oldValue, scope) {
                    scope.counter ++;
                }
            );

            child2.$apply(function (scope) {
                //empty...
            });

            expect(parent.counter).toBe(1);

        });

        it("schedules a digest from root on $evalAsync when isolated", function () {

            var parent = new Scope();
            var child = parent.$new(true);
            var child2 = child.$new();

            parent.aValue = 0;
            parent.counter = 0;

            parent.$watch(
                function (scope) {
                    return scope.aValue;
                },
                function (oldValue, newValue, scope) {
                    scope.counter++;
                }
            );

            child2.$evalAsync(function (scope) {
                console.log("1");
            });

            setTimeout(function () {

                expect(parent.counter).toBe(1);
                done();

            }, 50);
        });
    });

});

