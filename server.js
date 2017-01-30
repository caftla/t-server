// @flow

import express from 'express'
import axios from 'axios'
import {getClientIp} from 'request-ip'
import bunyan from 'bunyan'
import shortid from 'shortid'
import Promise from 'bluebird'
import config from './config'
const fs = Promise.promisifyAll(require('fs'))

const {port, api:{url, username, password}, logFile} = config
const app = express()
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
                query: req.query
            }
        }
    }
})

app.get('/webapi/v2/one-click-id', (req, res)=> {
    const reqId = shortid.generate()

    // create child logger with unqiue id, so subsecuent logs will have same req_id
    req.log = log.child({req_id: reqId})
    req.log.info({eventType: 'visit', req})

    const ipAddress = getClientIp(req)
    const payload = {
        ...req.query,
        username: username,
        password: password,
        ipaddress: ipAddress
    }

    axios(url, {
        params: payload
    })
    .then(({data})=> {
        const {status, message, oneclickid} = data
        const jsonp = req.query.jsonp || 'doit'

        req.log.info({eventType: 'api', eventArgs: {...payload, password: '...'}, response: data}, message)

        if (status !== 0) {
            res.status(400).send(message)
        } else {
            res.header('Access-Control-Allow-Origin', '*')
            res.header('Content-Type', 'text/javascript')
            res.send(`${jsonp}(${JSON.stringify({req_id: reqId, data: oneclickid})})`)
        }
    })
    .catch((err)=> {
        req.log.error({eventType: 'api', eventArgs: {...payload, password: '...'}, err})
        res.sendStatus(400)
    })
})


app.get('/pages/:page', (req, res)=> {

    fs.readFileAsync(`./build/pages/${req.params.page}.html.js`, 'utf8')
    .then((content)=> {
        res.header('Access-Control-Allow-Origin', '*')
        res.header('Content-Type', 'text/javascript')
        res.send(`var queryStringObj=${JSON.stringify(req.query)}; \n ${content}`)
    })
    .catch((err)=> {
        res.sendStatus(400)
    })
})

app.listen(port, ()=> {
    console.log(`listening to port: ${port}`)
})
