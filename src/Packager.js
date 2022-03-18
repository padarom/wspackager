import { buildTree, outputTree } from './TreeBuilder'
import chalk from 'chalk'
import async from 'async'
import glob from 'glob'
import path from 'path'
import _ from 'lodash'
import tar from 'tar'
import fs from 'fs'

export default class Packager
{
    constructor(files, packageInfo) {
        this.packageInfo = packageInfo

        // Order by intermediate files
        files.sort((a, b) => {
            if (a.intermediate > b.intermediate) return -1;
            else return 1;
        })

        // Remove duplicates from array
        this.filesToPackage = _.uniqBy(files, 'path')
    }

    run(done, destination, quiet) {
        this.destination = destination

        async.series({
            localFiles:     cb => this.findLocalFiles(cb),
            treeStructure:  cb => this.writeTreeStructure(quiet, cb),
            prepackage:     cb => this.prepackage(cb),
            package:        cb => this.packageAll(cb),
            cleanup:        cb => this.cleanup(cb),
            fileStats:      cb => this.getFileStats(cb),
        }, (err, results) => {
            results = {
                filename: results.package === undefined ? results.package : path.basename(results.package),
                path: results.package,
                filesize: results.fileStats
            }

            if (!quiet) {
                console.log('-> ' + chalk.green.bold('Package generated')
                    + ' (' + results.filesize + ')')
            }

            done(err, results)
        })
    }

    getFileProcessingList() {
        let files = this.filesToPackage.map(item => item.path)

        return files.map(item => {
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
        fs.stat(this.getDestinationPath(), (err, stats) => {
            function bytesToSize(bytes) {
               var sizes = ['Bytes', 'KB', 'MB', 'GB']
               if (bytes == 0) return '0 Byte'
               var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)))
               return Math.round(bytes / Math.pow(1000, i), 2) + ' ' + sizes[i]
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
                    direct = direct.concat(
                        instruction.paths.map(i => i.replace(/\.tar@$/, '.tar'))
                    )
                }
            })

            that.packagingPlan = {
                prepack, direct
            }

            done()
        })
    }

    prepackage(done) {
        let that = this

        const tasks = this.packagingPlan.prepack.map(dir => {
            return (callback) => {
                tar.c(
                    {
                        file: dir + '.tar',
                        cwd: dir,
                        portable: true,
                        filter: (filePath, stat) => {
                            let file = filePath.replace(process.cwd() + path.sep, '').replace(/\\/g, '/')
                            return dir == file || !that.isIntermediateFile(file)
                        }
                    },
                    fs.readdirSync(dir),
                    (err) => {
                        callback(err)
                    }
                )
            }
        });

        async.waterfall(tasks, err => done(err))
    }

    isIntermediateFile(name, omitTar) {
        for (var file in this.filesToPackage) {
            let filename = this.filesToPackage[file].path
            if (filename == name + '.tar' || (omitTar && filename == name)) {
                return this.filesToPackage[file].intermediate
            }
        }

        return false
    }

    packageAll(done) {
        let that = this
        
        let streams = []

        let files = this.packagingPlan.direct.concat(
            this.packagingPlan.prepack.map(item => item + '.tar')
        ).map(path.normalize) // Windows compatibility

        var folders = []
        files.forEach(dir => {
            // Don't include folders that only contain intermediate files
            if (that.isIntermediateFile(dir, true)) return

            var base = path.dirname(dir)
            let dirs = [base]
            while (path.dirname(base) != '.') {
                base = path.dirname(base)
                dirs.push(base)
            }
            folders = folders.concat(dirs)
        })

        folders = folders.filter(
            (el, i, arr) => arr.indexOf(el) === i
        )

        // Make sure directory exists
        let destination = that.getDestinationPath()
        const dir = path.dirname(destination);
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }

        tar.c(
            { 
                file: destination,
                portable: true,
                preservePaths: false,
                gzip: (destination.substr(-6) === 'tar.gz'),
                filter: (filePath, stat) => {
                    // Remove path up to cwd
                    let file = path.relative(process.cwd(), filePath)
                    return !that.isIntermediateFile(file, true) &&
                        (!file // Zero-length-string = cwd
                        || folders.indexOf(file) !== -1
                        || files.indexOf(file) !== -1)
                }
            },
            fs.readdirSync(process.cwd()),
            (err) => {
                done(err, destination)
            }
        )
    }

    getDestinationPath() {
        var destination = this.destination

        if (path.extname(destination) === '')
          destination = path.join(destination, '{name}_v{version}.tar.gz');

        destination = path.normalize(destination.replace('{name}', this.packageInfo.name).replace('{version}', this.packageInfo.version.replace(/\s+/gi,'_')))

        return destination
    }

    cleanup(done) {
        const deleteTasks = this.packagingPlan.prepack.map(dir => {
            return (callback) => fs.unlink(dir + '.tar', () => callback())
        });

        async.parallel(deleteTasks, () => done());
    }

    writeTreeStructure(quiet, done) {
        if (quiet)
            return done()

        let that = this
        var tree = {}
        this.packagingPlan.direct.forEach(file => {
            tree = buildTree(tree, file)
        })

        let nonIntermediatePrepacks = this.packagingPlan.prepack.filter(it => !that.isIntermediateFile(it))
        tree._.push(...nonIntermediatePrepacks.map(i => i + '.tar'))

        console.log(chalk.bold.green(path.basename(this.getDestinationPath())))
        outputTree(tree)

        done()
    }
}
