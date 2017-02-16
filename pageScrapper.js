function toQueryString(obj) {
    return Object.keys(obj).map(function(k) {
      return encodeURIComponent(k) + "=" + encodeURIComponent(obj[k])
    })
    .join("&");
}

$(document).ready(function() {
    $.post('https://tags.mobirun.net/api/event?' + toQueryString(queryStringObj), {eventType: 'scrap-html', originalUrl: window.location.href, data: $('html').html()})
})
