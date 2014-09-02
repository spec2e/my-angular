/* jshint globalstrict: true */
'use strict';

var Scope = function () {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$postDigestQueue = [];
    this.$$phase = null;
    this.$$children = [];
    this.$$root = this;

};


function initWatchVal() {
}

Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {

    var self = this;

    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function () {
        },
        //test for deep-watch. Double negate converts whatever the value, to a boolean. Default is false.
        valueEq: !!valueEq,
        last: initWatchVal
    };

    self.$$watchers.unshift(watcher);
    this.$$root.$$lastDirtyWatch = null;

    return function () {
        var indexOfWatcher = self.$$watchers.indexOf(watcher);
        if (indexOfWatcher >= 0) {
            self.$$watchers.splice(indexOfWatcher, 1);
            self.$$root.$$lastDirtyWatch = null;
        }
    };
};

Scope.prototype.$watchCollection = function (watchFn, listenerFn) {

    var self = this,
        newValue,
        oldValue,
        changeCount = 0;

    var internalWatchFn = function (scope) {
        newValue = watchFn(scope);

        if(newValue !== oldValue) {
            changeCount ++;
        }
        oldValue = newValue;

        return changeCount;
    };

    var internalListenerFn = function () {
        listenerFn(newValue, oldValue, self);
    };

    return this.$watch(internalWatchFn, internalListenerFn);

};

//loop through the watchers once
Scope.prototype.$$digestOnce = function () {

    var dirty;
    var continueLoop = true;
    var self = this;
    this.$$everyScope(function (scope) {
        var newValue, oldValue;
        //we use the ECMA script 5 method on Array - every(). It breaks the loop when falsy is returned
        _.forEachRight(scope.$$watchers, function (watcher) {

            try {
                if (watcher) {
                    newValue = watcher.watchFn(scope);
                    oldValue = watcher.last;

                    if (!scope.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                        self.$$root.$$lastDirtyWatch = watcher;
                        watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                        watcher.listenerFn(newValue,
                            (oldValue === initWatchVal ? newValue : oldValue), scope);
                        dirty = true;

                    } else if (self.$$root.$$lastDirtyWatch === watcher) {
                        continueLoop = false;
                        return false;
                    }
                }
            } catch (e) {
                console.error(e);
            }
        });
        return continueLoop;
    });
    return dirty;
};

//loop through the watchers until there is no more dirty watchers - max 10 times
Scope.prototype.$digest = function () {
    //ttl = Time To Live - ensures that chained scopes newer results in an infinite loop
    var ttl = 10;
    var dirty;
    //for each digest cycle, start by resetting the $$lastDirtyWatch
    this.$$root.$$lastDirtyWatch = null;
    this.$beginPhase("$digest");
    do {
        while (this.$$asyncQueue.length) {
            try {
                var asyncTask = this.$$asyncQueue.shift();
                asyncTask.scope.$eval(asyncTask.expression);
            } catch (e) {
                console.error("async: " + e);
            }
        }

        dirty = this.$$digestOnce();
        //if dirty, check that ttl has not reached zero (0). If so, throw exception
        if (dirty && !(ttl--)) {
            this.$clearPhase();
            throw "10 digest iterations reached!";
        }
    } while (dirty);
    this.$clearPhase();

    while (this.$$postDigestQueue.length) {
        try {
            var postDigestFn = this.$$postDigestQueue.shift();
            postDigestFn();
        } catch (e) {
            console.error(e);
        }
    }
};

Scope.prototype.$$areEqual = function (newValue, oldValue, valueEq) {
    if (valueEq) {
        return _.isEqual(newValue, oldValue);
    } else {
        return newValue === oldValue ||
            (typeof newValue === "number" && typeof oldValue === "number" &&
                isNaN(newValue) && isNaN(oldValue));
    }
};

Scope.prototype.$eval = function (expr, arg) {
    return expr(this, arg);
};

Scope.prototype.$apply = function (expr) {
    try {
        this.$beginPhase("$apply");
        return this.$eval(expr);
    } finally {
        this.$clearPhase();
        this.$$root.$digest();
    }
};

Scope.prototype.$evalAsync = function (expr) {

    var self = this;
    if (!self.$$phase && !self.$$asyncQueue.length) {
        setTimeout(function () {
            if (self.$$asyncQueue.length) {
                self.$$root.$digest();
            }
        }, 0);
    }

    this.$$asyncQueue.push({
        scope: this,
        expression: expr
    });
};

Scope.prototype.$beginPhase = function (phase) {

    if (this.$$phase) {
        throw this.$$phase + " already in progress";
    }

    this.$$phase = phase;

};

Scope.prototype.$clearPhase = function () {
    this.$$phase = null;
};

Scope.prototype.$$postDigest = function (fn) {
    this.$$postDigestQueue.push(fn);
};

Scope.prototype.$new = function (isolated) {

    var child;

    if (isolated) {
        child = new Scope();
        child.$$root = this.$$root;
        child.$$asyncQueue = this.$$asyncQueue;
        child.$$postDigestQueue = this.$$postDigestQueue;
    } else {
        var ChildScope = function () {
        };
        ChildScope.prototype = this;
        child = new ChildScope();
    }

    this.$$children.push(child);
    child.$$watchers = [];
    child.$$children = [];
    child.$parent = this;
    return child;
};

Scope.prototype.$destroy = function () {
    if (this === this.$$root) {
        return;
    }

    var siblings = this.$parent.$$children;
    var indexOfThis = siblings.indexOf(this);
    if (indexOfThis >= 0) {
        siblings.splice(indexOfThis, 1);
    }

};

Scope.prototype.$$everyScope = function (fn) {
    if (fn(this)) {
        return this.$$children.every(function (child) {
            return child.$$everyScope(fn);
        });
    } else {
        return false;
    }
};