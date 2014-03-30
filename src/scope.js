'use strict';

var Scope = function () {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;
    this.$$asyncQueue = [];
    this.$$postDigestQueue = [];
    this.$$phase = null;

};


function initWatchVal(){};

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
    this.$$lastDirtyWatch = null;

    return function () {
        var indexOfWatcher = self.$$watchers.indexOf(watcher);
        if (indexOfWatcher >= 0) {
            self.$$watchers.splice(indexOfWatcher, 1);
            self.$$lastDirtyWatch = null;
        }
    };


};

//loop through the watchers once
Scope.prototype.$$digestOnce = function () {

    var self = this;
    var newValue, oldValue, dirty;

    //we use the ECMA script 5 method on Array - every(). It breaks the loop when falsy is returned
    _.forEachRight(this.$$watchers, function (watcher) {

        try {
            if (watcher) {
                newValue = watcher.watchFn(self);
                oldValue = watcher.last;

                if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
                    self.$$lastDirtyWatch = watcher;
                    watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
                    watcher.listenerFn(newValue,
                        (oldValue === initWatchVal ? newValue : oldValue), self);
                    dirty = true;

                } else if (self.$$lastDirtyWatch === watcher) {
                    //break the loop
                    return false;
                }
            }
        } catch (e) {
            console.error(e);
        }
        //stay in the loop
        return true;
    });
    return dirty;
};

//loop through the watchers until there is no more dirty watchers - max 10 times
Scope.prototype.$digest = function () {
    //ttl = Time To Live - ensures that chained scopes newer results in an infinite loop
    var ttl = 10;
    var dirty;
    //for each digest cycle, start by resetting the $$lastDirtyWatch
    this.$$lastDirtyWatch = null;
    this.$beginPhase('$digest');
    do {

        while (this.$$asyncQueue.length) {
            try {
                var asyncTask = this.$$asyncQueue.shift();
                asyncTask.scope.$eval(asyncTask.expression);
            } catch (e) {
                console.error(e);
            }
        }

        dirty = this.$$digestOnce();
        //if dirty, check that ttl has not reached zero (0). If so, throw exception
        if (dirty && !(ttl--)) {
            this.$clearPhase();
            throw '10 digest iterations reached!';
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
            (typeof newValue === 'number' && typeof oldValue === 'number' &&
                isNaN(newValue) && isNaN(oldValue));
    }
};

Scope.prototype.$eval = function (expr, arg) {
    return expr(this, arg);
};

Scope.prototype.$apply = function (expr) {
    try {
        this.$beginPhase('$apply');
        return this.$eval(expr);
    } finally {
        this.$clearPhase();
        this.$digest();
    }
};

Scope.prototype.$evalAsync = function (expr) {

    var self = this;
    if (!self.$$phase && !self.$$asyncQueue.length) {
        setTimeout(function () {
            if (self.$$asyncQueue.length) {
                self.$digest();
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
        throw this.$$phase + ' already in progress';
    }

    this.$$phase = phase;

};

Scope.prototype.$clearPhase = function () {
    this.$$phase = null;
};

Scope.prototype.$$postDigest = function (fn) {
    this.$$postDigestQueue.push(fn);
};