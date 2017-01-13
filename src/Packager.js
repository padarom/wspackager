import { buildTree, outputTree } from './TreeBuilder'
import fstream from 'fstream'
import chalk from 'chalk'
import async from 'async'
import glob from 'glob'
import path from 'path'
import tar from 'tar'
import del from 'del'
import fs from 'fs'

export default class Packager
{
    constructor(files, packageInfo) {
        this.packageInfo = packageInfo

        // Remove duplicates from array
        this.filesToPackage = files.filter(
            (el, i, arr) => arr.indexOf(el) === i
        )
    }

    run(done, quiet) {
        async.series([
            cb => this.findLocalFiles(cb),
            cb => this.writeTreeStructure(quiet, cb),
            cb => this.prepackage(cb),
            cb => this.packageAll(cb),
            cb => this.cleanup(cb),
            cb => this.getFileStats(cb),
        ], (err, results) => {
            let filesize = results.pop()

            if (!quiet) {
                console.log('-> ' + chalk.green.bold('Package generated')
                    + ' (' + filesize + ')')
            }

            done(err, results)
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

    getFileStats(done) {
        fs.stat(this.packageInfo.name + '.tar', (err, stats) => {
            function bytesToSize(bytes) {
               var sizes = ['Bytes', 'KB', 'MB', 'GB'];
               if (bytes == 0) return '0 Byte';
               var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
               return Math.round(bytes / Math.pow(1000, i), 2) + ' ' + sizes[i];
            };

            done(err, bytesToSize(stats.size))
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

    prepackage(done) {
        let that = this
        let tasks = []

        for (let dir of this.packagingPlan.prepack) {
            tasks.push(cb => {
                let packer = tar.Pack({ noProprietary: true, fromBase: true })
                let writeStream = fs.createWriteStream(dir + '.tar')

                packer.on('error', err => cb(err, null))
                    .on('end', () => cb(null, null))
                fstream.Reader({ path: dir, type: 'Directory'})
                    .on('error', that.pathDoesNotExist)
                    .pipe(packer)
                    .pipe(writeStream)
            })
        }

        async.parallel(tasks, err => done(err, null))
    }

    packageAll(done) {
        let that = this
        let packer = tar.Pack({ noProprietary: true, fromBase: true })

        let streams = []
        let files = this.packagingPlan.direct.concat(
            this.packagingPlan.prepack.map(item => item + '.tar')
        )

        var folders = []
        files.forEach(dir => {
            var base = path.dirname(dir)
            let dirs = [base]
            while (base.includes('/')) {
                base = path.dirname(base)
                dirs.push(base)
            }
            folders = folders.concat(dirs)
        })

        folders = folders.filter(
            (el, i, arr) => arr.indexOf(el) === i
        )

        let readStream = fstream.Reader({
            path: process.cwd(),
            filter: function (entry) {
                // Remove path up to cwd
                let file = entry.path.replace(process.cwd() + path.sep, '')
                return (file == process.cwd()
                    || folders.indexOf(file) !== -1
                    || files.indexOf(file) !== -1)
            }
        })

        readStream
            .pipe(packer)
            .pipe(fs.createWriteStream(that.packageInfo.name + '.tar'))
            .on('finish', () => done(null, null))
    }

    cleanup(done) {
        del(this.packagingPlan.prepack.map(i => i + '.tar')).then(paths => {
            done(null, null)
        })
    }

    pathDoesNotExist(error) {
        console.log(error)
    }

    writeTreeStructure(quiet, done) {
        if (quiet)
            return done(null, null)

        let that = this
        var tree = {}
        this.packagingPlan.direct.forEach(file => {
            tree = buildTree(tree, file)
        })

        tree._.push(...this.packagingPlan.prepack.map(i => i + '.tar'))

        console.log(chalk.bold.green(this.packageInfo.name + '.tar'))
        outputTree(tree)

        done(null, null)
    }
}
