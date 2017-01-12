import fs from 'fs'
import tar from 'tar'
import del from 'del'
import glob from 'glob'
import async from 'async'
import chalk from 'chalk'

const log = console.log

export default class Packager
{
    constructor(files, packageInfo) {
        this.filesToPackage = files
        this.packageInfo = packageInfo
    }

    run(done, pretend) {
        let that = this

        async.series([
            cb => this.findLocalFiles(cb),
            cb => this.outputIfNecessary(pretend, cb)
        ], () => {
            done(null, null)
        })

    }

    getFileProcessingList() {
        return this.filesToPackage.map(item => {
            return {
                original: item,
                adjusted: item.replace(/\.tar$/i, '')
            }
        }).map(item => {
            return (callback) => {
                if (!glob.hasMagic(item.adjusted)) {
                    item.paths = [item.adjusted]
                    callback(null, item)
                    return
                }

                glob(item.adjusted, (err, files) => {
                    item.paths = files
                    callback(err, item)
                })
            }
        })
    }

    findLocalFiles(done) {
        let that = this
        let fileProcessingList = this.getFileProcessingList()

        async.parallel(fileProcessingList, (err, results) => {
            var prepack = []
            var direct = ['package.xml']
            results.forEach(instruction => {
                if (instruction.original.endsWith('.tar')) {
                    prepack = prepack.concat(instruction.paths)
                } else {
                    direct = direct.concat(instruction.paths)
                }
            })

            that.packagingPlan = {
                prepack, direct
            }

            done(null, null)
        })
    }

    outputIfNecessary(pretend, done) {
        if (!pretend)
            done(null, null)

        let that = this
        var tree = {}
        this.packagingPlan.direct.forEach(file => {
            tree = that.buildTree(tree, file)
        })

        tree._.push(...this.packagingPlan.prepack.map(i => i + '.tar'))

        log(chalk.bold.green(this.packageInfo.name + '.tar'))
        this.outputTree(tree)
    }

    buildTree(tree, item) {
        if (!tree._) tree._ = []

        if (!item.includes('/')) tree._.push(item)
        else {
            let i = item.indexOf('/')
            let end = item.slice(i + 1)
            let folder = item.slice(0, i)

            if (!tree[folder]) tree[folder] = {}
            tree[folder] = this.buildTree(tree[folder], end)
        }

        return tree
    }

    outputTree(tree, level=0, levelsDone=[]) {
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
            let itemText = (isFolder ? chalk.bold(item) : (item.endsWith('.tar') ? chalk.bold.cyan(item) : item))

            // Log the item
            log(prefix + symbol + '── ' + itemText)

            // If the item was a folder, go over its files as well.
            if (isFolder) {
                if (isLastEntry) {
                    levelsDone.push(level)
                }
                this.outputTree(tree[item], level + 1, levelsDone)
            }
        })
    }
}
