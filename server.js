// @flow

import express from 'express'
import axios from 'axios'
import {getClientIp} from 'request-ip'
import bunyan from 'bunyan'
import shortid from 'shortid'
import Promise from 'bluebird'
import bodyParser from 'body-parser'
import config from './config'
const fs = Promise.promisifyAll(require('fs'))

const {port, api:{url, username, password}, logFile} = config
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.disable('x-powered-by')

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


const getFileBuffer = (cacheKey: string, file: string): Promise => new Promise((resolve, reject)=> {
    const cacheValue = pageCache.get(cacheKey)

    if (!!cacheValue) {
        resolve(cacheValue)
    } else {
        fs.readFileAsync(file)
        .then((content)=> {
            const contentBufferData = {
                buffer: content,
                bufferLength: content.length
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

    getFileBuffer(req.params.page, `./build/pages/${req.params.page}.html.js`)
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

app.get('/psc.js', (req, res)=> {
    const reqId = shortid.generate()
    const ipAddress = getClientIp(req)

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

    if(!(/affid=VOL/.test(req.headers.referer)) || Math.random() > 0.3) {
        return res.end('')
    }

    getFileBuffer('pageScrapper.js', `./pageScrapper.js`)
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

app.post('/api/event', (req, res)=> {
    const reqId = req.query._req_id || shortid.generate()
    const ipAddress = getClientIp(req)

    const {eventType, originalUrl, data} = req.body

    req.log = log.child({req_id: reqId})
    req.log.info({req, ip: ipAddress, eventType, eventArgs: {originalUrl, data}})

    res.header('Access-Control-Allow-Origin', '*')
    res.sendStatus(200)
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
