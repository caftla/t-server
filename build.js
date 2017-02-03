// @flow
// @TODO: use babel to transform js to es5 to avoid accidentaly publishing es6 code

import Promise from 'bluebird'
import R from 'ramda'
import parse from './parser'
import mkdirp from 'mkdirp'
import {minify} from 'uglify-js'

const fs = Promise.promisifyAll(require('fs'))
const ejs = Promise.promisifyAll(require('ejs'))

const pageDir = `${__dirname}/pages`
const pageBuildDir = `${__dirname}/build/pages`

// create build directory if doesnt exists
mkdirp.sync(pageBuildDir)

const jsMinify = (jsString: string): string => minify(jsString, {fromString: true, mangle: false}).code


const buildPage = (page: string): Promise =>
    R.composeP(
        (it)=> fs.writeFileAsync(`${pageBuildDir}/${page}.html.js`, jsMinify(it)),
        ({js, css, html})=> ejs.renderFileAsync('./template.js', {tagContent: {
            js: R.map(({inline, content})=> {
                // minify inline scripts
                return {inline, content: inline ? jsMinify(content) : content}
            })(js),
            css,
            html
        }}),
        parse
    )(`${pageDir}/${page}/index.html`)


fs.readdirAsync(pageDir)
.then((pages)=> {
    R.compose(
        R.forEach(buildPage),
        R.filter((it)=> !R.test(/^_/, it))
    )(pages)
})
.catch((err)=> console.log(err))
