// @flow

import cheerio from 'cheerio'
import Promise from 'bluebird'
import R from 'ramda'
import Datauri from 'datauri'
import path from 'path'
const fs = Promise.promisifyAll(require('fs'))


const loadFile = (file): Promise<string> => fs.readFileAsync(file, 'utf8')


const isRemoteUrl = (url: string): boolean=> /^http(s)?:\/\/|^\/\//.test(url)


const extractStyles = ($, dir): ?Array<{inline: boolean, content: string}>=> {

    const links = $('link').map((i, el)=> {
        const srcAttr = $(el).attr('href')

        if (isRemoteUrl(srcAttr)) {
            return {inline: false, content: srcAttr}
        } else {
            const content = fs.readFileSync(`${dir}/${srcAttr}`, 'utf8')
            return {inline: true, content: transformCss(content, path.dirname(`${dir}/${srcAttr}`))}
        }
    }).toArray()

    const styles = $('style').map((i, el)=> {
        return {inline: true, content: transformCss($(el).html(), dir)}
    })

    return [...links, ...styles]
}


const transformCss = (cssString, dir)=> {
    return cssString.replace(/url\((.*)\)/g, (_, s)=> {
        const dataUri = Datauri.sync(`${dir}/${s.replace(/\"/g, '').replace(/\'/g, '')}`)
        return `url(${dataUri})`
    })
}


const extractScripts = ($, dir): ?Array<{inline: boolean, content: string}>=> {

    return $('script').map((i, el)=> {
        const srcAttr = $(el).attr('src')

        if (!!srcAttr) {

            if (isRemoteUrl(srcAttr)) {
                return {inline: false, content: srcAttr}
            } else {
                const content = fs.readFileSync(`${dir}/${srcAttr}`, 'utf8')
                return {inline: true, content: content}
            }

        } else {
            return {inline: true, content: $(el).html()}
        }
    }).toArray()

}


export default (file: string) => new Promise((resolve, reject)=>
    loadFile(file)
    .then((fileContent)=> {
        const $ = cheerio.load(fileContent)
        const dir = path.dirname(file)
        // remove tags with [data-remove] from the page
        // cheerio remove function is with side effect, the "$" object will be modified as a result
        $('[data-remove]').remove()

        const styles = extractStyles($, dir)
        const scripts = extractScripts($, dir)

        // replace images with datauri
        $('img').each((i, el)=> {
            const srcAttr = $(el).attr('src')

            if (isRemoteUrl(srcAttr)) {
                $(el).attr('src', srcAttr)
            } else {
                $(el).attr('src', Datauri.sync(`${dir}/${srcAttr}`))
            }
        })

        // remove tags from the page
        R.forEach((it)=> {
            $(it).remove()
        })(['script', 'style', 'link'])

        const html = $.html()

        const scriptTag = {
            js: scripts,
            css: styles,
            html: html
        }

        resolve(scriptTag)

    })
    .catch(reject)
)
