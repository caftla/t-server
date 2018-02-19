(function () {
    // ---- RxJS minimal implementation ----
    var SafeObserver = /** @class */ (function () {
        function SafeObserver(destination) {
            this.destination = destination;
        }
        SafeObserver.prototype.next = function (value) {
            // only try to next if you're subscribed have a handler
            if (!this.isUnsubscribed && this.destination.next) {
                try {
                    this.destination.next(value);
                }
                catch (err) {
                    // if the provided handler errors, teardown resources, then throw
                    this.unsubscribe();
                    throw err;
                }
            }
        };
        SafeObserver.prototype.error = function (err) {
            // only try to emit error if you're subscribed and have a handler
            if (!this.isUnsubscribed && this.destination.error) {
                try {
                    this.destination.error(err);
                }
                catch (e2) {
                    // if the provided handler errors, teardown resources, then throw
                    this.unsubscribe();
                    throw e2;
                }
                this.unsubscribe();
            }
        };
        SafeObserver.prototype.complete = function () {
            // only try to emit completion if you're subscribed and have a handler
            if (!this.isUnsubscribed && this.destination.complete) {
                try {
                    this.destination.complete();
                }
                catch (err) {
                    // if the provided handler errors, teardown resources, then throw
                    this.unsubscribe();
                    throw err;
                }
                this.unsubscribe();
            }
        };
        SafeObserver.prototype.unsubscribe = function () {
            this.isUnsubscribed = true;
            if (this.unsub) {
                this.unsub();
            }
        };
        return SafeObserver;
    }());
    var Observable = /** @class */ (function () {
        function Observable(_subscribe) {
            this._subscribe = _subscribe;
        }
        Observable.prototype.subscribe = function (observer) {
            var safeObserver = new SafeObserver(observer);
            safeObserver.unsub = this._subscribe(safeObserver);
            return safeObserver.unsubscribe.bind(safeObserver);
        };
        return Observable;
    }());
    var map = function (project) { return function (source) { return new Observable(function (observer) {
        return source.subscribe({
            next: function (x) { return observer.next(project(x)); },
            error: function (err) { return observer.error(err); },
            complete: function () { return observer.complete(); }
        });
    }); }; };
    var filter = function (f) { return function (source) { return new Observable(function (observer) {
        return source.subscribe({
            next: function (x) { return f(x) ? observer.next(x) : void 8; },
            error: function (err) { return observer.error(err); },
            complete: function () { return observer.complete(); }
        });
    }); }; };
    var take = function (limit) { return function (source) { return new Observable(function (observer) {
        var i = 0;
        return source.subscribe({
            next: function (x) { i++; observer.next(x); if (i == limit) {
                observer.complete();
            } },
            error: function (err) { return observer.error(err); },
            complete: function () { return observer.complete(); }
        });
    }); }; };
    var act = function (f) { return map(function (x) { f(x); return x; }); };
    var startWith = function (init) { return function (source) { return new Observable(function (observer) {
        observer.next(init);
        return source.subscribe(observer);
    }); }; };
    var scan = function (f) { return function (source) { return new Observable(function (observer) {
        var last = null;
        var has_last = false;
        var mapObserver = {
            next: function (x) {
                last = has_last ? f(last, x) : x;
                has_last = true;
                return observer.next(last);
            },
            error: function (err) { return observer.error(err); },
            complete: function () { return observer.complete(); }
        };
        return source.subscribe(mapObserver);
    }); }; };
    var withLatestFrom = function (right) { return function (source) { return new Observable(function (observer) {
        var right_val = null;
        var sourceObserver = {
            next: function (x) { return observer.next([x, right_val]); },
            error: function (err) { return observer.error(err); },
            complete: function () { return observer.complete(); }
        };
        var rightObserver = {
            next: function (x) { right_val = x; },
            error: function (err) { return observer.error(err); },
            complete: function () { return observer.complete(); }
        };
        var source_unsub = source.subscribe(sourceObserver);
        var right_unsub = right.subscribe(rightObserver);
        var unsub = function () {
            source_unsub();
            right_unsub();
        };
        return unsub;
    }); }; };
    var timer = function (interval, limit) {
        if (limit === void 0) { limit = Infinity; }
        return new Observable(function (observer) {
            var i = 0;
            var t = setInterval(function () {
                observer.next(i++);
                if (i == limit) {
                    observer.complete();
                    clearInterval(t);
                }
            }, interval);
            return function () { return clearInterval(t); };
        });
    };
    var fromEvent = function (element, eventname) { return new Observable(function (observer) {
        var callback = function (e) { return observer.next(e); };
        element.addEventListener(eventname, callback);
        return function () { return element.removeEventListener(eventname, callback); };
    }); };
    function pipe(initialValue) {
        var fns = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            fns[_i - 1] = arguments[_i];
        }
        return fns.reduce(function (state, fn) { return fn(state); }, initialValue);
    }
    // ---- user code ----
    var min360 = function (x) { return Math.min(x, Math.abs(360 - x)); };
    var pd = function (p, a, b) { return Math.pow(min360(a.latest[p]) - min360(b.latest[p]), 2); };
    var orientation$ = pipe(fromEvent(window, 'deviceorientation'), map(function (event) { return ({ latest: { alpha: event.alpha, beta: event.beta, gamma: event.gamma }, count: 1, distance: 0 }); }), startWith({ latest: null, count: 0, distance: 0 }), scan(function (acc, a) { return ({
        latest: a.latest, count: acc.count + 1,
        distance: acc.distance + (!acc.latest ? 0 : Math.sqrt(pd('alpha', a, acc) + pd('beta', a, acc) + pd('gamma', a, acc)))
    }); }));
    var unsub = pipe(timer(1000), // every 1 second
    withLatestFrom(orientation$), filter(function (_a) {
        var x = _a[1];
        return x.distance > 30;
    }), take(1)).subscribe({
        next: function (x) { },
        error: function (err) { },
        complete: function () { motion = true; }
    });
})();
