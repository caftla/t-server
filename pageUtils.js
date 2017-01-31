var isMraid = typeof mraid != "undefined";

function toQueryString(obj) {
    return Object.keys(obj).map(k => {
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

function getSMSHref(number, keyword) {
    var body = '';

    if (!!keyword) {
        body = (isIphone() ? '&' : '?') + 'body=' + keyword;
    }

    var href = 'sms:' + number + body;

    if (isMraid && mraid.supports("sms")) {
        return "javascript: mraid.open('" + href + "');";
    } else {
        return href;
    }
}

function openUrl(url)
{
    if (isMraid) {
        mraid.open(url)
    } else {
        window.location.href = url
    }
}
