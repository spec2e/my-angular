'use strict';

var Scope = function () {
    this.$$watchers = [];
    this.$$lastDirtyWatch = null;

};

Scope.prototype.$watch = function (watchFn, listenerFn, valueEq) {

    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function () {
        },
        //test for deep-watch. Double negate converts whatever the value, to a boolean. Default is false.
        valueEq: !!valueEq
    };

    this.$$watchers.push(watcher);

};

//loop through the watchers once
Scope.prototype.$$digestOnce = function () {

    var self = this;
    var dirty;

    //we use the ECMA script 5 method on Array - every(). It breaks the loop when falsy i returned
    this.$$watchers.every(function (watcher) {

        var newValue = watcher.watchFn(self);
        var oldValue = watcher.last;

        if (!self.$$areEqual(newValue, oldValue, watcher.valueEq)) {
            watcher.listenerFn(newValue, oldValue, self);
            self.$$lastDirtyWatch = watcher;
            dirty = true;
            watcher.last = (watcher.valueEq ? _.cloneDeep(newValue) : newValue);
        } else if (self.$$lastDirtyWatch === watcher) {
            //break the loop
            return false;
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
    do {
        dirty = this.$$digestOnce();
        //if dirty, check that ttl has not reached zero (0). If so, throw exception
        if (dirty && !(ttl--)) {
            throw '10 digest iterations reached!';
        }
    } while (dirty);
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