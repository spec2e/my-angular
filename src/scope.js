'use strict';

var Scope = function() {

    this.$$watchers = [];

};

Scope.prototype.$watch = function(watchFn, listenerFn) {

    var watcher = {
        watchFn: watchFn,
        listenerFn: listenerFn || function() {}
    };

    this.$$watchers.push(watcher);

};

Scope.prototype.$$digestOnce = function() {

    var self = this;
    var dirty;
    this.$$watchers.forEach(function(watcher) {

        var newValue = watcher.watchFn(self);
        var oldValue = watcher.last;

        if(newValue !== oldValue) {
            watcher.listenerFn(newValue, oldValue, self);
            watcher.last = newValue;
            dirty = true;
        }
    });
    return dirty;
};

Scope.prototype.$digest = function() {
    //ttl = Time To Live - ensures that chained scopes newer results in an infinite loop
    var ttl = 10;
    var dirty;
    do {
        dirty = this.$$digestOnce();
        //if dirty, check that ttl has not reached zero (0). If so, throw exception
        if(dirty && !(ttl--)) {
            throw '10 digest iterations reached!';
        }
    } while(dirty);
};