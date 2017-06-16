var isMraid = typeof mraid != "undefined";

function toQueryString(obj) {
    return Object.keys(obj).map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k])
    })
    .join("&");
}

function loadScriptWithQueryString(url, queryString) {
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url + '?' + queryString;
    document.body.appendChild(script);
}

function isIphone() {
    if (!!navigator && !!navigator.userAgent) {
        return (navigator.userAgent.toLowerCase().indexOf("iphone") != -1)
    }
    return false;
}

function getSMSHrefRaw(number, keyword) {
    var body = '';

    if (!!keyword) {
        body = (isIphone() ? '&' : '?') + 'body=' + encodeURIComponent(isIphone() ? keyword.split(' ')[0] : keyword);
    }

    return 'sms:' + number + body;

}

function getSMSHref(number, keyword) {

    var href = getSMSHrefRaw(number, keyword);

    if (isMraid && mraid.supports("sms")) {
        return "javascript:mraid.open('" + href + "');";
    } else {
        return href;
    }
}

function openUrl(url) {
    if (isMraid) {
        mraid.open(url)
    } else {
        window.location.href = url
    }
}

function createPixel(url) {
    var pixel = document.createElement('img');
    pixel.src = url;
    pixel.setAttribute("style", "width: 1px; height: 1px; display:none");
    document.body.appendChild(pixel);
}

function mraidClose(url) {
    if (isMraid) {
        mraid.close()
    }
}

function appendIframeUrl(id,url) {
	document.getElementById(id).src = url;
}