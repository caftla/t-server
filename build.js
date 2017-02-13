// @flow

import Promise from 'bluebird'
import R from 'ramda'
import parse from './parser'
import mkdirp from 'mkdirp'
import {minify} from 'uglify-js'
import {transform} from 'babel-core'

const fs = Promise.promisifyAll(require('fs'))
const ejs = Promise.promisifyAll(require('ejs'))

const pageDir = `${__dirname}/pages`
const pageBuildDir = `${__dirname}/build/pages`

// create build directory if doesnt exists
mkdirp.sync(pageBuildDir)

const babelify = (jsString: string): string => transform(jsString, {presets: ["es2015", "babili"]}).code


const buildPage = (page: string): Promise =>
    R.composeP(
        (it)=> fs.writeFileAsync(`${pageBuildDir}/${page}.html.js`, babelify(it)),
        ({js, css, html})=> ejs.renderFileAsync('./template.js', {tagContent: {
            js: R.map(({inline, content})=> {
                // minify inline scripts
                return {inline, content: inline ? babelify(content) : content}
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
        R.filter((it)=> !R.test(/^_|\./, it))
    )(pages)
})
.catch((err)=> console.log(err))
