import Promise from 'bluebird'
import R from 'ramda'
import parse from './parser'
import mkdirp from 'mkdirp'
const fs = Promise.promisifyAll(require('fs'))
const ejs = Promise.promisifyAll(require('ejs'))

const pageDir = './pages'
const pageBuildDir = './build/pages'

mkdirp.sync(pageBuildDir)

const buildPage = (page)=>
    R.composeP(
        (it)=> fs.writeFileAsync(`${pageBuildDir}/${page}.js`, it),
        ({js, css, html})=> ejs.renderFileAsync('./template.js', {tagContent: {js, css, html}}),
        parse
    )(`${pageDir}/${page}`)


fs.readdirAsync(pageDir)
.then((pages)=> {
    R.forEach(buildPage, pages)
})
.catch((err)=> console.log(err))
