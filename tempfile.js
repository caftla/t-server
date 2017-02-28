!function(global) {
    function now() {
        if (global.performance && typeof global.performance.now === 'function') {
            return global.performance.now();
        } else if (typeof Date.now === 'function') {
            return Date.now();
        } else {
            return (new Date()).getTime();
        }
    }

    // get the time when the script loads
    var startTime = now();

    $(document).ready(function() {
        var documentReadyTime = now();
        var loadTime = documentReadyTime - startTime;

        $.post('https://tags.mobirun.net/api/event', {eventType: 'page-performance', requestTime: (new Date()).getTime(), pageLoadTime: loadTime});
    })
}(typeof global !== 'undefined' ? global : this);
