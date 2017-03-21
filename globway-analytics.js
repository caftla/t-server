(function() {

    var startTime = Date.now();

    function sendEvent(data)
    {
        var url = "http://tags.mobirun.net/api/event";
        var xhr = createCORSRequest('POST', url);
        if (!xhr) {
            return;
        }
        xhr.onerror = function() {};
        xhr.send(JSON.stringify(data));
    }

    function createCORSRequest(method, url)
    {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
            // XHR for Chrome/Firefox/Opera/Safari.
            xhr.open(method, url, true);
        } else if (typeof XDomainRequest != "undefined") {
            // XDomainRequest for IE.
            xhr = new XDomainRequest();
            xhr.open(method, url);
        } else {
            // CORS not supported.
            xhr = null;
        }
        return xhr;
    }

    function ensureDurationIsValid(duration) {
        if (duration > 2147483647 || duration < 0) {
            // Indicate duration is not valid.
            duration = -1;
        }
        return duration;
    }

    function addEvent(html_element, event_name, event_function)
    {
        if (html_element.attachEvent) {
            html_element.attachEvent("on" + event_name, function() {event_function.call(html_element);});
        } else if (html_element.addEventListener) {
            html_element.addEventListener(event_name, event_function, false);
        }
    }

    addEvent(window, 'load', function() {
        var now = Date.now();
        var loadTime = ensureDurationIsValid(now - startTime);

        // Do it in next event loop, to ensure getPerformance() is returning correct value.
        setTimeout(function(){
            var data = {};
            data['loadTime'] = loadTime;
            data['eventType'] = 'load';
            data['stayInPageTime'] = loadTime;
            data['eventArgs'] = getPerformance();

            sendEvent(data);
        }, 0);
    });

    (function () {
        var lastTouchOrMouseEvent = 0;

        ["touchstart", "mousedown"].forEach(function(et) {
            addEvent(document, et, function(event) {
                event = event || window.event;

                var now = new Date().valueOf();

                if (now - lastTouchOrMouseEvent > 500) {
                    var data = {};
                    data['eventType'] = 'mousedown';

                    var elementId = (event.target || event.srcElement).id;
                    if (elementId == '') {
                        elementId = null;
                    }

                    if (et == 'touchstart') {
                        var touches = event.touches;
                        data['eventArgs'] = {
                            'type' : et,
                            'elementId' : elementId
                        };
                        for (var i = 0; i < touches.length; i++) {
                            var touch = touches[i];
                            data['eventArgs']['clientX' + i] = touch.clientX;
                            data['eventArgs']['clientY' + i] = touch.clientY;
                            data['eventArgs']['pageX' + i] = touch.pageX;
                            data['eventArgs']['pageY' + i] = touch.pageY;
                        }
                    } else {

                        data['eventArgs'] = {
                            'clientX'   : event.clientX,
                            'clientY'   : event.clientY,
                            'pageX'     : event.pageX,
                            'pageY'     : event.pageY,
                            'elementId' : elementId
                        };
                        data['eventArgs']['type'] = et;
                    }
                    data['stayInPageTime'] = ensureDurationIsValid(now - startTime);
                    sendEvent(data);
                }
                lastTouchOrMouseEvent = now;
            })
        });
    })();

    addEvent(window, 'blur', function() {
        var data = {};
        data['eventType']      = 'blur';
        data['stayInPageTime'] = ensureDurationIsValid(Date.now() - startTime);
        sendEvent(data);
    });

    addEvent(window, 'focus', function() {
        var data = {};
        data['eventType']      = 'focus';
        data['stayInPageTime'] = ensureDurationIsValid(Date.now() - startTime);
        sendEvent(data);
    });

    var resizeTimeOut;
    var resizeCount = resizeCount || 1;
    addEvent(window, "resize", function() {
        clearTimeout(resizeTimeOut);
        resizeTimeOut = setTimeout(resizedWindow, 250);
    });

    addEvent(window, "error", function(msg) {
        var data = {};
        data['eventType'] = 'error';

        if ('error' in msg && 'message' in msg.error) {
            data['eventArgs'] = {
                'message' : msg.error.message
            };

            if ('stack' in msg.error) {
                data['eventArgs']['stack'] = msg.error.stack;
            }
        }

        data['stayInPageTime'] = ensureDurationIsValid(Date.now() - startTime);
        sendEvent(data);
        return true;
    });

    function resizedWindow()
    {
        var data = {};
        data['eventType']      = 'onResize';
        data['resizeCount']    = resizeCount++;
        data['stayInPageTime'] = ensureDurationIsValid(Date.now() - startTime);
        sendEvent(data);
    }

    (function() {
        var hidden = "hidden";

        // Standards:
        if (hidden in document)
            document.addEventListener("visibilitychange", onchange);
        else if ((hidden = "mozHidden") in document)
            document.addEventListener("mozvisibilitychange", onchange);
        else if ((hidden = "webkitHidden") in document)
            document.addEventListener("webkitvisibilitychange", onchange);
        else if ((hidden = "msHidden") in document)
            document.addEventListener("msvisibilitychange", onchange);
        // IE 9 and lower:
        else if ("onfocusin" in document)
            document.onfocusin = document.onfocusout = onchange;
        else {
            window.onpageshow = window.onpagehide = onchange;
        }

        function onchange (evt) {
            var v = "visible", h = "hidden",
                    evtMap = {
                        focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
                    };

            evt = evt || window.event;

            var eventType = null;
            if (evt.type in evtMap)
                eventType = evtMap[evt.type];
            else
                eventType = this[hidden] ? h : v;

            var data = {};
            data['eventType']      = eventType;
            data['stayInPageTime'] = ensureDurationIsValid(Date.now() - startTime);
            sendEvent(data);
        }

        // set the initial state (but only if browser supports the Page Visibility API)
        if( document[hidden] !== undefined )
            onchange({type: document[hidden] ? "pagehide" : "pageshow"});
    })();

    function getPerformance()
    {
        if (!!window.performance && !!window.performance.timing) {
            var timing = window.performance.timing;

            return {
                domLoadTime    : timing.loadEventEnd - timing.responseEnd, // affected by CDN
                fetchTime      : timing.responseEnd - timing.fetchStart, // affected by server
                totalLoadTime  : timing.loadEventEnd - timing.navigationStart, // total time
                navigationTime : timing.fetchStart - timing.navigationStart // affected by network
            }
        }

        return null
    }
})();
