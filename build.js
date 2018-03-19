// @flow

import Promise from 'bluebird'
import R from 'ramda'
import parse from './parser'
import mkdirp from 'mkdirp'
import {minify} from 'uglify-js'
import {transform} from 'babel-core'
import cheerio from 'cheerio'
import fse from 'fs-extra'
const htmlMinify = require('html-minifier').minify

const fs = Promise.promisifyAll(require('fs'))
const ejs = Promise.promisifyAll(require('ejs'))

const pageDir = `${__dirname}/pages`
const pageBuildDir = `${__dirname}/build/pages`

const babelify = (jsString: string): string => transform(jsString, {presets: ["es2015", "babili"]}).code


const buildPage = (page: string): Promise =>
    R.composeP(
        ({pageType, content})=> {
            // create build directory if doesnt exists
            mkdirp.sync(`${pageBuildDir}/${page}`)

            if (pageType == 'html') {
                return fs.writeFileAsync(`${pageBuildDir}/${page}/index.html`, htmlMinify(content, {removeComments: true, collapseWhitespace: true, minifyCSS: true, minifyJS: true}))
            } else if (pageType == 'jstag') {
                const jstagContent = `document.write('${
                    htmlMinify(content, {removeComments: true, collapseWhitespace: true, minifyCSS: true, minifyJS: true}).replace(/(<\/?)script/g, (_, a)=> (a + "scr'+'ipt"))
                }')`
                return fs.writeFileAsync(`${pageBuildDir}/${page}/index.jstag.js`, jstagContent)
            } else {
                return fs.writeFileAsync(`${pageBuildDir}/${page}/index.html.js`, babelify(content))
            }
        },
        ({js, css, html})=> {
            const $ = cheerio.load(html)
            const pageType = $('meta[name="x-page-type"]').attr('content')

            if (pageType == 'html' || pageType == 'jstag') {

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

                $('img[data-datauri="off"]').each((i, el)=> {
                    const srcAttr = $(el).attr('src')

                    fse.copySync(`./pages/${page}/${srcAttr}`, `./build/pages/${page}/${srcAttr}`)
                    $(el).attr('src', `/${page}/${srcAttr}`)
                })

                return {
                    pageType: pageType,
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
                                html: $('body').html()
                            }
                        }
                    )
                }
            }
        },
        parse
    )(`${pageDir}/${page}/index.html`)


const [,,pageName] = process.argv

R.composeP(
    (it)=> Promise.map(it, buildPage, {concurrency: 5}),
    R.filter((it)=> !pageName ? true : R.test(new RegExp(`^${pageName}`, 'i'), it)),
    R.filter((it)=> !R.test(/^_|\./, it)),
    (it)=> fs.readdirAsync(it)
)(pageDir)
