const gac = (()=> {

    var hitData = {
        v: 1
    }

    const collect = (payload)=> {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', 'https://www.google-analytics.com/collect')
        xhr.setRequestHeader('Content-Type', 'text/plain')
        xhr.send(payload)
    }

    const toQueryString = (obj)=> Object.keys(obj).map(
        (k)=> encodeURIComponent(k) + "=" + encodeURIComponent(obj[k])
    ).join("&")

    return (action, ...args)=> {

        switch (action) {
            case 'create':
                const [tid] = args
                hitData.tid = tid
                break;

            case 'set':
                const [key, value] = args

                if (key == 'page') {
                    hitData.dp = value
                } else if (key.indexOf('dimension') > -1) {
                    hitData[key.replace('dimension', 'cd')] = value
                } else {
                    hitData[key] = value
                }
                break;

            case 'send':
                const [hitType] = args
                hitData.t = hitType

                if (hitType == 'event') {
                    const [, ec, ea, el, ev] = args
                    hitData.ec = ec
                    hitData.ea = ea
                    hitData.el = el
                }

                collect(toQueryString(hitData))
                break;
        }
    }
})()
