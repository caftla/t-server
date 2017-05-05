import Promise from 'bluebird'
const fs = Promise.promisifyAll(require('fs'))

module.exports = (req, res, next)=> {
    const {page} = req.query
    const {referer} = req.headers

    // if (page != 'flamilingo_es' || Math.random() > 0.5)
    //     return
    //
    // return fs.readFileAsync('./analytics/flamilingo_es.js', 'utf8')
}
