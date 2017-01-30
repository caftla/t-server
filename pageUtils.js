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
