// @flow

import cheerio from 'cheerio'
import Promise from 'bluebird'
import R from 'ramda'
const fs = Promise.promisifyAll(require('fs'))


const loadFile = (file): Promise<string> => fs.readFileAsync(file, 'utf8')


const extractStyles = ($): ?Array<{inline: boolean, content: string}>=> {

    const links = $('link').map((i, el)=> {
        return {inline: false, content: $(el).attr('href')}
    }).toArray()

    const styles = $('style').map((i, el)=> {
        return {inline: true, content: $(el).html()}
    })

    return [...links, ...styles]
}


const extractScripts = ($): ?Array<{inline: boolean, content: string}>=> {

    return $('script').map((i, el)=> {
        const srcAttr = $(el).attr('src')
        const dontInline = $(el).data('dont-inline') !== undefined

        if (!!srcAttr) {

            if (dontInline) {
                return {inline: false, content: srcAttr}
            } else {
                // @TODO: handle the case if it's remote script
                const content = fs.readFileSync(`${__dirname}/pages/${srcAttr}`, 'utf8')
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

        // remove tags with [data-remove] from the page
        // cheerio remove function is with side effect, the "$" object will be modified as a result
        $('[data-remove]').remove()

        const styles = extractStyles($)
        const scripts = extractScripts($)

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
