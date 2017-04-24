// @flow

import Promise from 'bluebird'
import R from 'ramda'
import parse from './parser'
import mkdirp from 'mkdirp'
import {minify} from 'uglify-js'
import {transform} from 'babel-core'
import cheerio from 'cheerio'

const fs = Promise.promisifyAll(require('fs'))
const ejs = Promise.promisifyAll(require('ejs'))

const pageDir = `${__dirname}/pages`
const pageBuildDir = `${__dirname}/build/pages`

// create build directory if doesnt exists
mkdirp.sync(pageBuildDir)

const babelify = (jsString: string): string => transform(jsString, {presets: ["es2015", "babili"]}).code


const buildPage = (page: string): Promise =>
    R.composeP(
        ({pageType, content})=> {
            if (pageType == 'html') {
                fs.writeFileAsync(`${pageBuildDir}/${page}.html`, content)
            } else {
                fs.writeFileAsync(`${pageBuildDir}/${page}.html.js`, babelify(content))
            }
        },
        ({js, css, html})=> {
            const $ = cheerio.load(html)
            const pageType = $('meta[name="x-page-type"]').attr('content')

            if (pageType == 'html') {

                $('head').append('<script><%- scriptBlock %><\/script>')

                // append styles to head
                R.forEach(({inline, content})=> {
                    if (!!inline) {
                        $('head').append(`<style>${content}</style>`)
                    } else {
                        $('head').append(`<link rel="stylesheet" href="${content}" />`)
                    }
                })(css)

                // append scripts to body
                R.forEach(({inline, content})=> {
                    if (!!inline) {
                        $('body').append(`<script type="text/javascript">${content}</script>`)
                    } else {
                        $('body').append(`<script type="text/javascript" src="${content}" />`)
                    }
                })(js)

                return {
                    pageType: 'html',
                    content: $.html()
                }
            } else {
                return {
                    pageType: 'mraid',
                    content: ejs.render(
                        fs.readFileSync('./template.js', 'utf8'),
                        {
                            tagContent: {
                                js: R.map(({inline, content})=> {
                                    // minify inline scripts
                                    return {inline, content: inline ? babelify(content) : content}
                                })(js),
                                css,
                                html
                            }
                        }
                    )
                }
            }
        },
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
