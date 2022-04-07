import chalk from 'chalk'
import Util from './Util'

const log = console.log

export function buildTree(tree, item) {
    if (!tree._) tree._ = []

    if (!item.includes('/')) tree._.push(item)
    else {
        let i = item.indexOf('/')
        let end = item.slice(i + 1)
        let folder = item.slice(0, i)

        if (!tree[folder]) tree[folder] = {}
        tree[folder] = buildTree(tree[folder], end)
    }

    return tree
}

export function outputTree(tree, level=0, levelsDone=[]) {
    let files =
        tree._
            .concat(Object.keys(tree)
            .filter(i => i != '_'))
            .sort()

    files.forEach((item, key) => {
        let isFolder = tree.hasOwnProperty(item)
        let isLastEntry = key == files.length - 1

        // The symbol to display.
        // This is different for items in the middle and at the end of a list
        let symbol = isLastEntry ? '└' : '├'

        // The prefix for this level.
        var prefix = '';
        for (let i = 0; i < level; i++) {
            prefix += levelsDone.indexOf(i) != -1 ? '    ' : '│   '
        }

        // The item itself.
        let itemText = (isFolder ? chalk.bold(item) : (Util.isTarball(item) ? chalk.bold.cyan(item) : item))

        // Log the item
        log(prefix + symbol + '── ' + itemText)

        // If the item was a folder, go over its files as well.
        if (isFolder) {
            if (isLastEntry) {
                levelsDone.push(level)
            }
            outputTree(tree[item], level + 1, levelsDone)
        }
    })
}
