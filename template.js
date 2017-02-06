var isMraid = typeof mraid != "undefined";
var head = document.getElementsByTagName("head")[0];

// create ad container
var scriptElement = document.getElementById('mobirun-script');
var viewport = document.createElement('div');
viewport.id = "adContainer";
viewport.setAttribute('style', "position: absolute; left: 0; top: 0; width: 100%; height: 100%; overflow: auto;");
document.body.appendChild(viewport);

var hostElement = scriptElement.parentNode;

var fixViewPort = function() {
    var docStyle = document.documentElement.style;
    docStyle.margin = 0;
    docStyle.padding = 0;
    docStyle.width = "100%";
    docStyle.height = "100%";
    var bodStyle = document.body.style
    bodStyle.margin = 0;
    bodStyle.padding = 0;
    bodStyle.width = "100%";
    bodStyle.height = "100%";
    // fixViewPort: fixed viewport meta tag
    if (!document.querySelector("meta[name=viewport]")) {
        var meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content = "initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no";
        document.getElementsByTagName("head").item(0).appendChild(meta);
    }
    if ((!hostElement.offsetParent || hostElement.offsetParent === document.body && "static" === getComputedStyle(document.body, null).position)) {
        hostElement.style.position = "relative";
        hostElement.style.width = hostElement.style.height = "100%";
    }
}

// parsed creative content (css, js, html)
window.sam_tag_content = <%- JSON.stringify(tagContent) %>
var styles = window.sam_tag_content.css
var scripts = window.sam_tag_content.js
var html = window.sam_tag_content.html

// viewport setup
fixViewPort()

var renderAd = function() {
    // add html
    viewport.innerHTML = html
    
    if (isMraid) {
        mraid.useCustomClose(true);

        var closeButton = document.getElementById('close');

        if(!closeButton) {
            console.log("close button not found")
        } else {
            closeButton.addEventListener('click', function() {
                mraid.close()
            })
        }
    }

    // add styles
    if (!!styles) {
        for(var i = 0; i < styles.length; i++) {
            if(!!styles[i].inline) {
                var style = document.createElement('style');
                style.innerHTML = unescape(styles[i].content);
                document.head.appendChild(style);
            } else {
                var link = document.createElement('link');
                link.type = 'text/css';
                link.rel = 'stylesheet';
                link.href = links[i].content;
                document.head.appendChild(link);
            }
        }
    }

    // add scripts
    if (!!scripts) {
        function loadScripts(items, i) {

            if (i >= items.length) return;

            var script = document.createElement('script');
            script.type = 'text/javascript';

            if(!!items[i].inline) {
                script.innerHTML = unescape(items[i].content);
                document.body.appendChild(script);

                loadScripts(items, i + 1);
            } else {
                script.src = items[i].content;
                script.onload = function() {
                    loadScripts(items, i + 1);
                }
                document.body.appendChild(script);
            }
        }

        loadScripts(scripts, 0)
    }
}

var once = function(self, f) {
    var isCalled = false;
    var result = null;
    return function() {
        if(isCalled) {
            return result;
        }
        isCalled = true;
        return result = f.apply(self, arguments);
    }
}

var renderAd_once = once(this, renderAd);

// wait for mraid to load
if (isMraid && mraid.getState() === 'loading') {
    mraid.addEventListener('ready', renderAd_once);
    setTimeout(renderAd_once, 2000);
} else {
    renderAd_once();
}
